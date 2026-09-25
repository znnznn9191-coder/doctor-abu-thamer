const express = require('express');
const router = express.Router();
const asyncHandler = require('./asyncHandler');

const { runReview } = require('../controllers/reviewController');

router.post('/researches/:id/run-review', asyncHandler(runReview));

module.exports = router;
