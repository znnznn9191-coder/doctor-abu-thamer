const express = require('express');
const router = express.Router();

const { runReview } = require('../controllers/reviewController');

router.post('/researches/:id/run-review', runReview);

module.exports = router;
