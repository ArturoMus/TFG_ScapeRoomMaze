const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const statsController = require('../controllers/stats.controller');

const router = express.Router();

router.get('/', asyncHandler(statsController.getStats));

module.exports = router;