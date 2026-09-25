const express = require('express');
const router = express.Router();
const asyncHandler = require('./asyncHandler');

const {
  listSections,
  createSection,
  updateSection,
  deleteSection
} = require('../controllers/sectionController');

router.get('/researches/:id/sections', asyncHandler(listSections));
router.post('/researches/:id/sections', asyncHandler(createSection));
router.put('/sections/:id', asyncHandler(updateSection));
router.delete('/sections/:id', asyncHandler(deleteSection));

module.exports = router;
