const qs = require('qs');
const express = require('express');
const router = express.Router();
const statesController = require('../../controllers/statesController');



router.use((req, res, next) => {
    req.query = qs.parse(req.querystring);
    next();
  });

//   router.get('/states/contig', statesController.contigStates);
router.param('contig', function(req, res, next, contig) {
    req.contig = contig;
    next();
  });

//   router.get('/', statesController.contigStates);


  router.route('/') 
    .get(statesController.getAllStates);


router.route('/:code')
    .get(statesController.getState);

router.route('/:stateCode/funfact')
    .get(statesController.getfunfact)
    .post(statesController.postfunfact)
    .patch(statesController.patchfunfact)
    .delete(statesController.deletefunfact);

router.route('/:code/capital')
    .get(statesController.getCapital);

router.route('/:code/nickname')
    .get(statesController.getNickname);

router.route('/:code/population')
    .get(statesController.getPopulation);

router.route('/:code/admission')
    .get(statesController.getAdmission);


module.exports = router;