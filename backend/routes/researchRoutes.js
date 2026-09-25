const express = require('express');
const router = express.Router();
const asyncHandler = require('./asyncHandler');

const {
  listResearches,
  createResearch,
  getResearchById,
  updateResearch,
  deleteResearch,
  getResearchDetails
} = require('../controllers/researchController');

router.get('/researches', asyncHandler(listResearches));
router.post('/researches', asyncHandler(createResearch));
router.get('/researches/:id', asyncHandler(getResearchById));
router.put('/researches/:id', asyncHandler(updateResearch));
router.delete('/researches/:id', asyncHandler(deleteResearch));
router.get('/researches/:id/details', asyncHandler(getResearchDetails));

module.exports = router;
