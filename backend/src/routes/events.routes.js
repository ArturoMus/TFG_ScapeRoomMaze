const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const eventsController = require('../controllers/events.controller');

const router = express.Router();

router.post('/', asyncHandler(eventsController.createEvent));
router.get('/run/:runId', asyncHandler(eventsController.getEventsByRunId));

module.exports = router;