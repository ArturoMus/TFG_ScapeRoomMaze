const crypto = require('crypto');
const runsRepository = require('../repositories/runs.repository');

function stringify(value) {
    return JSON.stringify(value ?? null);
}

async function createRun(data) {
    const map = data.map || {};

    const run = {
        id: crypto.randomUUID(),

        playerAlias: data.playerAlias || 'guest',
        startedAt: new Date(),
        result: 'started',

        mapSeed: map.seed ? String(map.seed) : null,
        mapWidth: map.width ?? null,
        mapHeight: map.height ?? null,
        roomCount: map.roomCount ?? null,
        doorCount: map.doorCount ?? null,
        deadendCount: map.deadendCount ?? null,
        finalRoom: map.finalRoom ?? null,

        mainPathJson: stringify(map.mainPath || []),
        puzzleDistributionJson: stringify(map.puzzleDistribution || {}),
        mapJson: stringify(map)
    };

    await runsRepository.createRun(run);

    return {
        id: run.id,
        startedAt: run.startedAt
    };
}

async function finishRun(runId, data) {
    const affectedRows = await runsRepository.finishRun(runId, {
        finishedAt: new Date(),
        durationMs: data.durationMs ?? null,
        result: data.result || 'completed'
    });

    if (affectedRows === 0) {
        const error = new Error('Partida no encontrada');
        error.statusCode = 404;
        throw error;
    }

    return {
        ok: true
    };
}

async function getRecentRuns() {
    return runsRepository.findRecentRuns(50);
}

module.exports = {
    createRun,
    finishRun,
    getRecentRuns
};