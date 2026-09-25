const express = require('express');
const router = express.Router();

const {
  listSources,
  createSource,
  updateSource,
  deleteSource
} = require('../controllers/sourceController');

router.get('/researches/:id/sources', listSources);
router.post('/researches/:id/sources', createSource);
router.put('/sources/:id', updateSource);
router.delete('/sources/:id', deleteSource);

module.exports = router;
