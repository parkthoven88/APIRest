const express = require('express');
const router = express.Router();
const statesController = require('../../controllers/statesController');
const { verifyState, getStatesJSON } = require('../../middleware/verifyState');

router.route('/')
  .get(getStatesJSON, statesController.getAllStates);

router.route('/:state')
  .get(verifyState, getStatesJSON, statesController.getState);

router.route('/:state/funfact')
  .get(verifyState, getStatesJSON, statesController.getFunfact)
  .post(verifyState, getStatesJSON, statesController.postFunfact)
  .patch(verifyState, getStatesJSON, statesController.updateFunfact)
  .delete(verifyState, getStatesJSON, statesController.deleteFunfact);

router.route('/:state/capital')
  .get(verifyState, getStatesJSON, statesController.getCapital);

router.route('/:state/nickname')
  .get(verifyState, getStatesJSON, statesController.getNickname);

router.route('/:state/population')
  .get(verifyState, getStatesJSON, statesController.getPopulation);

router.route('/:state/admission')
  .get(verifyState, getStatesJSON, statesController.getAdmission);


module.exports = router;