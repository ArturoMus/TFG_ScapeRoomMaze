const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const runsController = require('../controllers/runs.controller');

const router = express.Router();

router.post('/', asyncHandler(runsController.createRun));
router.get('/', asyncHandler(runsController.getRecentRuns));
router.patch('/:id/finish', asyncHandler(runsController.finishRun));

module.exports = router;