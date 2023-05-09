const http = require('http');
const States = require('../model/States');

const path = require('path');
const express = require('express');

const app = express();
const url = require('url');
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const data = {
  states: require('../model/statesData.json')
};

const getAllStates = async (req, res) => {
  const searchParams = new URLSearchParams(req.url.split('?')[1]);
  const contig = searchParams.get('contig');
  console.log({ contig });
  let states = data.states;


  const filteredStates = states.filter(state => {
    if (contig === 'true') {
      return state.code !== 'AK' && state.code !== 'HI';
    } else if (contig === 'false') {
      return state.code === 'AK' || state.code === 'HI';
    }
    // If no contig parameter is provided or its value is not 'true' or 'false',
    // include all states in the response
    return true;
  });

  states = filteredStates;

  for (let state of states) {
    const foundState = await States.findOne({ stateCode: state.code }, 'funfacts').lean().exec();
    if (foundState && foundState.funfacts) {
      state.funfacts = foundState.funfacts;
    }
  }

  res.json(states);
};


const getState = async (req, res) => {
  // Destructure the request parameters for better readability
  const { code } = req.params;

  // Check if stateCode is provided in the request
  if (!code) {
    return res.status(400).json({ 'message': 'State code is required.' });
  }

  try {
    // Find the state in the data array based on stateCode
    const state = data.states.find(state => state.code === code.toUpperCase());

    if (!state) {
      return res.status(400).json({ 'message': 'Invalid state abbreviation parameter' });
    }

    // Retrieve fun facts for the state from MongoDB
    const stateCode = code.toUpperCase();
    const facts = await States.findOne({ stateCode: stateCode });
    let response = { ...state };

    if (facts && facts.funfacts) {
      response = { ...response, funfacts: facts.funfacts };
    }

    res.json(response);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ 'message': 'Internal server error.' });
  }
};




const getfunfact = async (req, res) => {

  const code = req.params.stateCode.toUpperCase();

  const state = await States.findOne({ stateCode: code }).exec();
  const name = data.states.find(state => state.code === code);


  // Check if state is found, and return appropriate response
  if (!name) {
    return res.status(400).json({ 'message': 'Invalid state abbreviation parameter' });
  }

  if (!state) {
    // handle case where state with given stateCode was not found
    return res.status(404).json({ 'message': `No Fun Facts found for ${name.state}` });
  }

  const funfactIndex = Math.floor(Math.random() * state.funfacts.length);

  const funfact = state.funfacts[funfactIndex];
  res.json({ funfact });

}

const postfunfact = async (req, res) => {
  const code = req.params.stateCode.toUpperCase();
  const funfacts = req.body.funfacts;
  const stateName = data.states.find(s => s.code === code);


  if (!funfacts) {
    return res.json({ 'message': 'State fun facts value required' });
  }

  if (!Array.isArray(funfacts)) {
    return res.status(400).json({ message: 'State fun facts value must be an array' });
  }

  try {
    // Find the requested state in the database
    let state = await States.findOne({ stateCode: code }).exec();

    // If the state is not found, create a new record in the database
    if (!state) {
      state = new States({ stateCode: code, funfacts });
      await state.save();
    }
    // If the state is found, update its funfacts array with the new funfacts
    else {
      if (!state.funfacts || state.funfacts.length === 0) {
        state.funfacts = funfacts;
      } else {
        state.funfacts.push(...funfacts);
      }
      await state.save();
    }

    // Retrieve the updated state from the database
    state = await States.findOne({ stateCode: code }).exec();

    res.status(201).json({ state: stateName.state, _id: state._id, stateCode: state.stateCode, funfacts: state.funfacts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};




const patchfunfact = async (req, res) => {
  const code = req.params.stateCode.toUpperCase();
  const index = parseInt(req.body.index);

  // Check if the `states` array exists
  if (!data.states) {
    return res.status(404).json({ message: 'No states found' });
  }

  // Find the state object by state code
  const state = data.states.find(s => s.code === code);

  // Check if a state was found
  if (!state) {
    return res.status(404).json({ message: `No Fun Facts found for ${req.params.stateCode}` });
  }

  // Check if `funfact` is provided with a string value
  if (!req.body.funfact || typeof req.body.funfact !== 'string') {
    return res.status(400).json({ message: 'State fun fact value required' });
  }

  // Check if `index` is provided and is a positive integer
  if (!index || index < 1 || !Number.isInteger(index)) {
    return res.status(400).json({ message: 'State fun fact index value required' });
  }

  // Find the state by state code in the database
  const foundState = await States.findOne({ stateCode: code }).exec();

  if (!foundState || foundState.funfacts.length === 0) {
    return res.status(404).json({ message: `No Fun Facts found for ${state.state}` });
  }

  // Check if the index is within the range of fun facts for the state
  if (index > foundState.funfacts.length) {
    return res.status(400).json({ message: `No Fun Fact found at that index for ${state.state}` });
  }

  // Update the fun fact at the specified index
  foundState.funfacts[index - 1] = req.body.funfact;

  // Save the updated record
  const updatedState = await foundState.save();

  // Return the updated state object
  res.status(200).json({
    state: state.state,
    _id: updatedState._id,
    stateCode: updatedState.stateCode,
    funfacts: updatedState.funfacts
  });
};

const deletefunfact = async (req, res) => {

  const code = req.params.stateCode.toUpperCase();
  const name = data.states.find(state => state.code === code);
  const { index } = req.body;

  // Check if index and funfact are provided
  if (!index) {
    return res.status(400).json({ message: 'State fun fact index value required' });
  }

  // Find the state by state code
  const foundState = await States.findOne({ stateCode: code }).exec();
  if (!foundState) {
    return res.status(404).json({ message: `No Fun Facts found for ${name.state}` });
  }

  // Check if the index is valid
  if (index < 1 || index > foundState.funfacts.length) {
    return res.status(400).json({ message: `No Fun Fact found at that index for ${name.state}` });
  }

  // Remove the fun fact at the specified index
  foundState.funfacts = foundState.funfacts.filter((_, i) => i !== index - 1);

  // Save the updated record
  const updatedState = await foundState.save();

  res.status(200).json(updatedState);

};

const getCapital = async (req, res) => {
  // Destructure the request parameters for better readability
  const { code } = req.params;

  // Check if stateCode is provided in the request
  if (!code) {
    return res.status(400).json({ 'message': 'State code is required.' });
  }

  try {
    // Find the state in the data array based on stateCode
    const state = data.states.find(state => state.code === code.toUpperCase());

    if (!state) {
      return res.status(400).json({ 'message': 'Invalid state abbreviation parameter' });
    }

    // Retrieve fun facts for the state from MongoDB
    const facts = await States.findOne({ code: code });

    // Return the state and capital city, and fun facts as JSON response
    res.json({ 'state': state.state, 'capital': state.capital_city });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ 'message': 'Internal server error.' });
  }
};

const getNickname = (req, res) => {
  // Destructure the request parameters for better readability
  const { code } = req.params;

  // Check if stateCode is provided in the request
  if (!code) {
    return res.status(400).json({ 'message': 'State code is required.' });
  }

  // Find the state in the data array based on stateCode
  const state = data.states.find(state => state.code === code.toUpperCase());
  if (state) {
    const nickname = state.nickname; // Access the capital city property of the state object
    res.json({ 'state': state.state, 'nickname': `${nickname}` });
  } else {
    return res.status(400).json({ 'message': `Invalid state abbreviation parameter` });
  }

}

const getPopulation = (req, res) => {
  // Destructure the request parameters for better readability
  const { code } = req.params;

  // Check if stateCode is provided in the request
  if (!code) {
    return res.status(400).json({ 'message': 'State code is required.' });
  }

  // Find the state in the data array based on stateCode
  const state = data.states.find(state => state.code === code.toUpperCase());
  if (state) {
    const population = state.population; // Access the capital city property of the state object
    res.json({ 'state': state.state, 'population': `${population.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}` });
  } else {
    return res.status(400).json({ 'message': 'Invalid state abbreviation parameter' });
  }

}

const getAdmission = (req, res) => {
  // Destructure the request parameters for better readability
  const { code } = req.params;

  // Check if stateCode is provided in the request
  if (!code) {
    return res.status(400).json({ 'message': 'State code is required.' });
  }

  // Find the state in the data array based on stateCode
  const state = data.states.find(state => state.code === code.toUpperCase());
  if (state) {
    const admission = state.admission_date; // Access the capital city property of the state object
    res.json({ 'state': state.state, 'admitted': `${admission}` });
  } else {
    return res.status(400).json({ 'message': `Invalid state abbreviation parameter` });
  }

}

module.exports = {
  getAllStates,
  getCapital,
  getPopulation,
  getNickname,
  getAdmission,
  getfunfact,
  postfunfact,
  patchfunfact,
  deletefunfact,
  getState
}