const statsRepository = require('../repositories/stats.repository');

async function getStats() {
    return statsRepository.getGeneralStats();
}

module.exports = {
    getStats
};