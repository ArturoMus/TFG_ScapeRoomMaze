const { query } = require('../config/database');

async function createEvent(event) {
    const sql = `
        INSERT INTO events (
            id,
            run_id,
            type,
            timestamp,
            elapsed_ms,
            room_id,
            payload_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await query(sql, [
        event.id,
        event.runId,
        event.type,
        event.timestamp,
        event.elapsedMs,
        event.roomId,
        event.payloadJson
    ]);

    return event;
}

async function findEventsByRunId(runId) {
    const sql = `
        SELECT *
        FROM events
        WHERE run_id = ?
        ORDER BY timestamp ASC
    `;

    return query(sql, [runId]);
}

module.exports = {
    createEvent,
    findEventsByRunId
};