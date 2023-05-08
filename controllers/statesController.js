const data = {};

// Import statesData.json file and assign to data.states
data.states = require("../model/statesData.json");

// Import State model and verifyState middleware
const State = require("../model/States");
const verifyState = require("../middleware/verifyState");

// Define getAllStates function to retrieve all states from data.states
const getAllStates = async (req, res) => {
  let stateArray = new Array();

  // Check if query for contiguous states
  if (!req?.query?.contig) {
    // Loop through each element in data.states and get funfacts from State model
    for (const element of data.states) {
      const stateCode = element.code;
      const funFact = await State.findOne({ stateCode: stateCode })
        .select("funfacts -_id")
        .exec();

      // If funfact exists, add it to the element in stateArray
      if (funFact) {
        element.funfacts = funFact.funfacts;
      }

      // Add the element to the stateArray
      stateArray.push(element);
    }
  } else {
    if (req?.query?.contig === "true") {
      // Loop through each element in data.states and skip AK and HI, then get funfacts from State model
      for (const element of data.states) {
        if (element.code === "AK" || element.code === "HI") continue;
        else {
          const stateCode = element.code;
          const funFact = await State.findOne({ stateCode: stateCode })
            .select("funfacts -_id")
            .exec();

          // If funfact exists, add it to the element in stateArray
          if (funFact) {
            element.funfacts = funFact.funfacts;
          }

          // Add the element to the stateArray
          stateArray.push(element);
        }
      }
    } else {
      // Loop through each element in data.states and only include AK and HI, then get funfacts from State model
      for (const element of data.states) {
        if (element.code === "AK" || element.code === "HI") {
          const stateCode = element.code;
          const funFact = await State.findOne({ stateCode: stateCode })
            .select("funfacts -_id")
            .exec();

          // If funfact exists, add it to the element in stateArray
          if (funFact) {
            element.funfacts = funFact.funfacts;
          }

          // Add the element to the stateArray
          stateArray.push(element);
        } else {
          continue;
        }
      }
    }
  }

  // Send the stateArray in the response
  res.json(stateArray);
};

// Define getOneState function to retrieve one state from data.states
const getOneState = async (req, res) => {
  if (!req?.params?.stateCode) {
    res.status(400).json({ message: "Statecode required" });
    return;
  }

  // Verify that stateCode is valid
  const stateCode = req.params.stateCode.toUpperCase();
  if (!verifyState(stateCode)) {
    res.status(400).json({ message: "Invalid state abbreviation parameter" });
    return;
  }

  // Find the state in data.states with the given stateCode
  const state = data.states.find((s) => s.code === stateCode);

  // Get funfacts for the state from State model, if it exists
  const funFact = await State.findOne({ stateCode: stateCode })
    .select("funfacts -_id")
    .exec();
  // Get all states and their fun facts
  if (!funFact) {
    res.json(state);
  } else {
    state.funfacts = funFact.funfacts;
    res.json(state);
  }
};

// Get specific information about one state
const getOneStateThing = async (req, res) => {
  // Check if stateCode is provided
  if (!req?.params?.stateCode) {
    res.status(400).json({ message: "Statecode required" });
    return;
  }

  // Verify that stateCode is valid
  const stateCode = req.params.stateCode.toUpperCase();
  if (!verifyState(stateCode)) {
    res.status(400).json({ message: "Invalid state abbreviation parameter" });
    return;
  }

  const state = data.states.find((s) => s.code === stateCode);

  let fact;
  // Determine which information to return based on the request parameter
  switch (req.params.something) {
    case "funfact":
      const funFact = await State.findOne({ stateCode: stateCode })
        .select("funfacts -_id")
        .exec();
      if (!funFact) {
        return res.json({ message: `No Fun Facts found for \${state.state}` });
      } else {
        const randomIndex = Math.floor(Math.random() * funFact.funfacts.length);
        fact = { funfact: `${funFact.funfacts[randomIndex]}` };
      }
      break;
    // Other cases for different information about the state
    case "capital":
      fact = { state: `\${state.state}`, capital: `\${state.capital_city}` };
      break;
    case "nickname":
      fact = { state: `\${state.state}`, nickname: `\${state.nickname}` };
      break;
    case "population":
      fact = {
        state: `\${state.state}`,
        population: `\${state.population.toLocaleString()}`,
      };
      break;
    case "admission":
      fact = { state: `\${state.state}`, admitted: `\${state.admission_date}` };
      break;
  }

  res.json(fact);
};

// Create a new fun fact for a state
const createNewFunfact = async (req, res) => {
  // Check if funfacts are provided
  if (!req?.body?.funfacts) {
    res.status(400).json({ message: "State fun facts value required" });
    return;
  }

  // Verify stateCode
  const stateCode = req.params.stateCode.toUpperCase();
  if (!verifyState(stateCode)) {
    res.status(400).json({ message: "Invalid state abbreviation parameter" });
    return;
  }

  // Verify that funfacts is an array
  if (!Array.isArray(req.body.funfacts)) {
    return res
      .status(400)
      .json({ message: "State fun facts value must be an array" });
  }

  // Update the state with the new fun facts
  try {
    const result = await State.findOneAndUpdate(
      { stateCode },
      { $push: { funfacts: req.body.funfacts } },
      { new: true, upsert: true }
    );
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update a specific fun fact for a state
const patchFunfact = async (req, res) => {
  // Check if index and funfact properties are present in request body
  if (!req?.body?.index) {
    res.status(400).json({ message: "State fun fact index value required" });
    return;
  }
  if (!req?.body?.funfact) {
    res.status(400).json({ message: "State fun fact value required" });
    return;
  }

  // Adjust index for zero-based data array
  const adjustedIndex = req.body.index - 1;

  // Verify that stateCode
  const stateCode = req.params.stateCode.toUpperCase();
  if (!verifyState(stateCode)) {
    res.status(400).json({ message: "Invalid state abbreviation parameter" });
    return;
  }

  // Update the fun fact at the specified index and save the state
  try {
    const state = await State.findOne({ stateCode: stateCode }).exec();

    const stateName = data.states.find((s) => s.code === stateCode);
    if (!state) {
      return res
        .status(404)
        .json({ message: `No Fun Facts found for \${stateName.state}` });
    }

    if (adjustedIndex < 0 || adjustedIndex >= state.funfacts.length) {
      res.status(400).json({
        message: `No Fun Fact found at that index for ${stateName.state}`,
      });
      return;
    }

    state.funfacts[adjustedIndex] = req.body.funfact; // update funfact at given index with new funfact from request body
    await state.save(); // save state after updating funfact

    res.json(state); // return updated state as JSON response
  } catch (err) {
    console.error(err); // log error to console
    res.status(500).json({ message: "Internal server error" }); // return 500 status code and error message as JSON response
  }
};

const deleteFunfact = async (req, res) => {
  if (!req?.body?.index)
    return res
      .status(400)
      .json({ message: "State fun fact index value required" }); // return 400 status code and error message if index is not provided in request body

  const adjustedIndex = req.body.index - 1; // adjust index to match array index

  const stateCode = req.params.stateCode.toUpperCase(); // get state code from request parameter and convert to uppercase

  if (!verifyState(stateCode))
    return res
      .status(400)
      .json({ message: "Invalid state abbreviation parameter" }); // return 400 status code and error message if state code is invalid
  try {
    const state = await State.findOne({ stateCode: stateCode }).exec(); // find state with given state code

    const stateName = data.states.find((s) => s.code === stateCode); // get state name from data using state code
    if (!state) {
      return res
        .status(404)
        .json({ message: `No Fun Facts found for \${stateName.state}` }); // return 404 status code and error message if no fun facts are found for the given state code
    }

    if (adjustedIndex < 0 || adjustedIndex >= state.funfacts.length) {
      res.status(400).json({
        message: `No Fun Fact found at that index for \${stateName.state}`,
      }); // return 400 status code and error message if no fun fact is found at the given index
      return;
    }

    state.funfacts.splice(adjustedIndex, 1); // remove funfact at given index from state
    await state.save(); // save state after removing funfact

    res.json(state); // return updated state as JSON response
  } catch (err) {
    console.error(err); // log error to console
    res.status(500).json({ message: "Internal server error" }); // return 500 status code and error message as JSON response
  }
};

module.exports = {
  getAllStates,
  getOneState,
  getOneStateThing,
  createNewFunfact,
  patchFunfact,
  deleteFunfact,
};
