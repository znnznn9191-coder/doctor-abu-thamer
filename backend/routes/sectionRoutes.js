const express = require('express');
const router = express.Router();

const {
  listSections,
  createSection,
  updateSection,
  deleteSection
} = require('../controllers/sectionController');

router.get('/researches/:id/sections', listSections);
router.post('/researches/:id/sections', createSection);
router.put('/sections/:id', updateSection);
router.delete('/sections/:id', deleteSection);

module.exports = router;
