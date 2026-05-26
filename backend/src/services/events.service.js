const crypto = require('crypto');
const eventsRepository = require('../repositories/events.repository');

function stringify(value) {
    return JSON.stringify(value ?? {});
}

async function createEvent(data) {
    if (!data.runId) {
        const error = new Error('runId es obligatorio');
        error.statusCode = 400;
        throw error;
    }

    if (!data.type) {
        const error = new Error('type es obligatorio');
        error.statusCode = 400;
        throw error;
    }

    const event = {
        id: crypto.randomUUID(),
        runId: data.runId,
        type: data.type,
        timestamp: new Date(),
        elapsedMs: data.elapsedMs ?? null,
        roomId: data.roomId || null,
        payloadJson: stringify(data.payload)
    };

    await eventsRepository.createEvent(event);

    return {
        id: event.id
    };
}

async function getEventsByRunId(runId) {
    return eventsRepository.findEventsByRunId(runId);
}

module.exports = {
    createEvent,
    getEventsByRunId
};