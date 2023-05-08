const express = require("express");
const router = express.Router();
const statesController = require("../../controllers/statesController.js");
router.route("/").get(statesController.getAllStates);

router.route("/:stateCode").get(statesController.getOneState);

router
  .route("/:stateCode/:something")
  .get(statesController.getOneStateThing)
  .post(statesController.createNewFunfact)
  .patch(statesController.patchFunfact)
  .delete(statesController.deleteFunfact);

module.exports = router;