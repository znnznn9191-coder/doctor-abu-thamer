const express = require('express');
const router = express.Router();
const asyncHandler = require('./asyncHandler');

const {
  listSources,
  createSource,
  updateSource,
  deleteSource
} = require('../controllers/sourceController');

router.get('/researches/:id/sources', asyncHandler(listSources));
router.post('/researches/:id/sources', asyncHandler(createSource));
router.put('/sources/:id', asyncHandler(updateSource));
router.delete('/sources/:id', asyncHandler(deleteSource));

module.exports = router;
