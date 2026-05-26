const runsService = require('../services/runs.service');

async function createRun(req, res) {
    const result = await runsService.createRun(req.body);

    res.status(201).json(result);
}

async function finishRun(req, res) {
    const result = await runsService.finishRun(req.params.id, req.body);

    res.json(result);
}

async function getRecentRuns(req, res) {
    const runs = await runsService.getRecentRuns();

    res.json(runs);
}

module.exports = {
    createRun,
    finishRun,
    getRecentRuns
};