const States = require('../model/States');

const getAllStates = async (req, res) => {
  let states = req.states;


  if (req.query.contig === 'true') {
    states = states.filter(state => state.code !== 'AK' && state.code !== 'HI');
  } else if (req.query.contig === 'false') {
    states = states.filter(state => state.code === 'AK' || state.code === 'HI');
  }

  const statesData = await States.find();
  for (let i = 0; i < states.length; i++) {
    let find = statesData.find(state => state.stateCode === states[i].code);
    if (find) {
      states[i].funfacts = find['funfacts'];
    }
  }

  res.status(200).json(states);
}

const getState = async (req, res) => {
  const stateData = await States.findOne({ stateCode: req.code }).exec();
  if (stateData) {
    req.state.funfacts = stateData.funfacts;
  }
  res.status(200).json(req.state);
}

const getFunfact = async (req, res) => {
  const stateData = await States.findOne({ stateCode: req.code });

  if (!stateData) {
    return res.status(404).json({ 'message': 'No Fun Facts found for ' + req.state.state });
  }

  const result = {
    funfact: stateData.funfacts[Math.floor(Math.random() * stateData.funfacts.length)]
  }

  res.status(200).json(result);
}


const getCapital = (req, res) => {
  const result = {
    "state": req.state.state,
    "capital": req.state.capital_city
  }
  res.json(result);
}

const getNickname = (req, res) => {
  const result = {
    "state": req.state.state,
    "nickname": req.state.nickname
  }
  res.json(result);
}

const getPopulation = (req, res) => {
  const result = {
    "state": req.state.state,
    "population": req.state.population.toLocaleString('en-US')
  }
  res.json(result);
}

const getAdmission = (req, res) => {
  const result = {
    "state": req.state.state,
    "admitted": req.state.admission_date.toLocaleString('en-US')
  }
  res.json(result);
}

const postFunfact = async (req, res) => {
  if (!req.body?.funfacts) {
    return res.status(400).json({ 'message': 'State fun facts value required' });
  } else if (!Array.isArray(req.body.funfacts)) {
    return res.status(400).json({ 'message': 'State fun facts value must be an array' });
  }

  // Does state have any fun facts
  const state = await States.findOne({ stateCode: req.code });

  if (!state) {
    try {
      const result = await States.create({
        stateCode: req.code,
        funfacts: req.body.funfacts
      })
      res.status(201).json(result);
    } catch (err) {
      console.error(err);
    }
  } else {
    try {
      state.funfacts = state.funfacts.concat(req.body.funfacts);
      const result = await state.save();
      res.status(201).json(result);
    } catch (err) {
      console.error(err);
    }
  }
}

const updateFunfact = async (req, res) => {
  if (!req.body?.index) {
    return res.status(400).json({ 'message': 'State fun fact index value required' });
  } else if (!req.body?.funfact) {
    return res.status(400).json({ 'message': 'State fun fact value required' });
  }

  const stateData = await States.findOne({ stateCode: req.code });
  const index = req.body.index - 1;

  if (!stateData) {
    return res.status(404).json({
      'message': 'No Fun Facts found for '
        + req.state.state
    });
  }

  if (req.body.index > stateData.funfacts.length) {
    return res.status(404).json({
      'message': 'No Fun Fact found at that index for '
        + req.state.state
    });
  }

  stateData.funfacts.splice(index, 1, req.body.funfact);
  const result = await stateData.save();
  res.status(200).json(result);
}


const deleteFunfact = async (req, res) => {
  if (!req.body?.index) {
    return res.status(400).json({ 'message': 'State fun fact index value required' });
  }

  const stateData = await States.findOne({ stateCode: req.code });
  const index = req.body.index - 1;

  if (!stateData) {
    return res.status(404).json({
      'message': 'No Fun Facts found for '
        + req.state.state
    });
  }

  if (req.body.index > stateData.funfacts.length) {
    return res.status(404).json({
      'message': 'No Fun Fact found at that index for '
        + req.state.state
    });
  }

  stateData.funfacts.splice(index, 1);
  const result = await stateData.save();
  res.status(200).json(result);
}

module.exports = {
  getAllStates,
  getState,
  getCapital,
  getNickname,
  getPopulation,
  getAdmission,
  getFunfact,
  postFunfact,
  updateFunfact,
  deleteFunfact
}