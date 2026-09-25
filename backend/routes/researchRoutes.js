const express = require('express');
const router = express.Router();

const {
  listResearches,
  createResearch,
  getResearchById,
  updateResearch,
  deleteResearch,
  getResearchDetails
} = require('../controllers/researchController');

router.get('/researches', listResearches);
router.post('/researches', createResearch);
router.get('/researches/:id', getResearchById);
router.put('/researches/:id', updateResearch);
router.delete('/researches/:id', deleteResearch);
router.get('/researches/:id/details', getResearchDetails);

module.exports = router;
