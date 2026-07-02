const { query } = require('../config/database');

function toNumber(value) {
    if (typeof value === 'bigint') {
        return Number(value);
    }

    if (value === null || value === undefined) {
        return null;
    }

    return Number(value);
}

function normalizeRows(rows) {
    return rows.map(row => {
        const normalized = {};

        Object.entries(row).forEach(([key, value]) => {
            normalized[key] = typeof value === 'bigint'
                ? Number(value)
                : value;
        });

        return normalized;
    });
}

async function getGeneralStats() {
    const runsTotal = await query(`
        SELECT COUNT(*) AS total
        FROM runs
    `);

    const completedRuns = await query(`
        SELECT COUNT(*) AS total
        FROM runs
        WHERE result = 'completed'
    `);

    const avgDuration = await query(`
        SELECT AVG(duration_ms) AS avgDurationMs
        FROM runs
        WHERE duration_ms IS NOT NULL
    `);

    const eventsByType = await query(`
        SELECT type, COUNT(*) AS total
        FROM events
        GROUP BY type
        ORDER BY total DESC
    `);

    const puzzleFails = await query(`
        SELECT
            JSON_UNQUOTE(JSON_EXTRACT(payload_json, '$.puzzleType')) AS puzzleType,
            COUNT(*) AS total
        FROM events
        WHERE type = 'puzzle_failed'
        GROUP BY puzzleType
        ORDER BY total DESC
    `);

    return {
        runsTotal: toNumber(runsTotal[0].total),
        completedRuns: toNumber(completedRuns[0].total),
        avgDurationMs: avgDuration[0].avgDurationMs === null
            ? null
            : Number(avgDuration[0].avgDurationMs),
        eventsByType: normalizeRows(eventsByType),
        puzzleFails: normalizeRows(puzzleFails)
    };
}

module.exports = {
    getGeneralStats
};