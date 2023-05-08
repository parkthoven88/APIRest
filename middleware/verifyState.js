const states = require("../model/statesData.json");
const stateAbbreviations = new Array(50);

for (i = 0; i < 50; i++) {
  stateAbbreviations.push(states[i].code);
}

const verifyState = (state) => {
  return stateAbbreviations.includes(state.toUpperCase());
};

module.exports = verifyState;
