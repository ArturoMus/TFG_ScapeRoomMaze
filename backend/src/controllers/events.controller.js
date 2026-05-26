const eventsService = require('../services/events.service');

async function createEvent(req, res) {
    const result = await eventsService.createEvent(req.body);

    res.status(201).json(result);
}

async function getEventsByRunId(req, res) {
    const events = await eventsService.getEventsByRunId(req.params.runId);

    res.json(events);
}

module.exports = {
    createEvent,
    getEventsByRunId
};