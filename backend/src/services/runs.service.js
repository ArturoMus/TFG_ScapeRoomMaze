const crypto = require('crypto');
const runsRepository = require('../repositories/runs.repository');

function stringify(value) {
    return JSON.stringify(value ?? null);
}

async function createRun(data) {
    const map = data.map || {};

    const validDominantHands = ['R', 'L', 'U'];
    const validAgeRanges = ['<12', '12-15', '16-18', '19-35', '36-50', '>51', '-1'];
    const validGenderIdentities = ['M', 'F', 'N', 'U'];

    const dominantHand = validDominantHands.includes(data.dominantHand)
        ? data.dominantHand
        : 'U';

    const ageRange = validAgeRanges.includes(data.ageRange)
        ? data.ageRange
        : '-1';

    const genderIdentity = validGenderIdentities.includes(data.genderIdentity)
        ? data.genderIdentity
        : 'U';

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
        mapJson: stringify(map),

        dominantHand,
        ageRange,
        genderIdentity
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