const { query } = require('../config/database');

async function createRun(run) {
    const sql = `
        INSERT INTO runs (
            id,
            player_alias,
            started_at,
            result,

            map_seed,
            map_width,
            map_height,
            room_count,
            door_count,
            deadend_count,
            final_room,

            main_path_json,
            puzzle_distribution_json,
            map_json,

            dominant_hand,
            age_range,
            gender_identity
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await query(sql, [
        run.id,
        run.playerAlias,
        run.startedAt,
        run.result,

        run.mapSeed,
        run.mapWidth,
        run.mapHeight,
        run.roomCount,
        run.doorCount,
        run.deadendCount,
        run.finalRoom,

        run.mainPathJson,
        run.puzzleDistributionJson,
        run.mapJson,

        run.dominantHand,
        run.ageRange,
        run.genderIdentity
    ]);

    return run;
}

async function finishRun(runId, data) {
    const sql = `
        UPDATE runs
        SET
            finished_at = ?,
            duration_ms = ?,
            result = ?
        WHERE id = ?
    `;

    const result = await query(sql, [
        data.finishedAt,
        data.durationMs,
        data.result,
        runId
    ]);

    return result.affectedRows;
}

async function findRecentRuns(limit = 50) {
    const sql = `
        SELECT *
        FROM runs
        ORDER BY started_at DESC
        LIMIT ?
    `;

    return query(sql, [Number(limit)]);
}

module.exports = {
    createRun,
    finishRun,
    findRecentRuns
};