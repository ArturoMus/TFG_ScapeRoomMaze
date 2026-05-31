function getPuzzleDoorIds(data) {
    const raw = data.doorIds || data.doorId || '';

    if (Array.isArray(raw)) {
        return raw.filter(Boolean);
    }

    return String(raw)
        .split(',')
        .map(id => id.trim())
        .filter(Boolean);
}

function getFirstPuzzleDoorId(data) {
    const first = getPuzzleDoorIds(data)[0] || '';
    return first.replace('#', '');
}

function getPuzzleDoorSelectors(data) {
    return getPuzzleDoorIds(data)
        .map(id => id.startsWith('#') ? id : `#${id}`)
        .join(',');
}

function getPuzzleDoorElements(data) {
    const selectors = getPuzzleDoorSelectors(data);

    if (!selectors) return [];

    return selectors
        .split(',')
        .map(selector => document.querySelector(selector))
        .filter(Boolean);
}

function lockPuzzleDoors(data) {
    const doors = getPuzzleDoorElements(data);

    doors.forEach(doorEl => {
        if (doorEl.components?.door) {
            doorEl.components.door.isLocked = true;
        }

        if (doorEl.doorData) {
            doorEl.doorData.isLocked = true;
        }
    });

    if (doors.length === 0) {
        console.warn("No se encontraron puertas para puzzle:", data);
    }

    return doors;
}

function emitToPuzzleDoors(data, eventName = 'openDoor') {
    const doors = getPuzzleDoorElements(data);

    doors.forEach(doorEl => {
        doorEl.emit(eventName);
    });

    return doors;
}

function getRoomDataFromElement(roomEl) {
    if (!roomEl || !roomEl.id) return null;

    return window.rooms?.[roomEl.id] || null;
}

function getPuzzleMetaFromRoomElement(roomEl) {
    const roomData = getRoomDataFromElement(roomEl);

    return roomData?.puzzle || null;
}

function createPuzzleId(roomId, type) {
    return `puzzle-${roomId}-${type}`;
}

function createPuzzleMeta({ room, type, targetDoorIds, progressionPlan }) {
    const roomShortId = room.id.replace('room-', '');
    const mainPathIndex = progressionPlan
        ? getMainPathIndex(roomShortId, progressionPlan.mainPathCoords)
        : -1;

    return {
        id: createPuzzleId(room.id, type),
        type,
        roomId: room.id,

        targetDoorIds: [...targetDoorIds],
        targetCount: targetDoorIds.length,

        isMainPath: mainPathIndex !== -1,
        mainPathIndex,

        started: false,
        solved: false,
        failCount: 0,
        attemptCount: 0,

        createdAtMs: window.telemetry?.getElapsedMs?.() ?? 0,
        startedAtMs: null,
        solvedAtMs: null,
        lastAttemptStartedAtMs: null
    };
}

function buildPuzzleTelemetryPayload(roomEl, data = {}, extra = {}) {
    const meta = getPuzzleMetaFromRoomElement(roomEl);

    return {
        puzzleId: meta?.id || null,
        puzzleType: meta?.type || extra.puzzleType || null,
        roomId: meta?.roomId || roomEl?.id || null,

        targetDoorIds: meta?.targetDoorIds || getPuzzleDoorIds(data),
        targetCount: meta?.targetCount ?? getPuzzleDoorIds(data).length,

        isMainPath: meta?.isMainPath ?? null,
        mainPathIndex: meta?.mainPathIndex ?? null,

        ...extra
    };
}

function trackPuzzleCreated(roomEl, data = {}, extra = {}) {
    const payload = buildPuzzleTelemetryPayload(roomEl, data, extra);

    window.telemetry?.track('puzzle_created', payload, {
        roomId: payload.roomId
    });
}

function trackPuzzleStarted(roomEl, data = {}, extra = {}) {
    const meta = getPuzzleMetaFromRoomElement(roomEl);

    if (meta?.solved) return;

    if (meta) {
        if (meta.started) return;

        meta.started = true;
        meta.startedAtMs = window.telemetry?.getElapsedMs?.() ?? null;
    }

    const payload = buildPuzzleTelemetryPayload(roomEl, data, extra);

    window.telemetry?.track('puzzle_started', payload, {
        roomId: payload.roomId
    });
}

function trackPuzzleFailed(roomEl, data = {}, extra = {}) {
    const meta = getPuzzleMetaFromRoomElement(roomEl);

    if (meta) {
        meta.failCount = (meta.failCount || 0) + 1;
    }

    const payload = buildPuzzleTelemetryPayload(roomEl, data, {
        failCount: meta?.failCount ?? null,
        attemptCount: meta?.attemptCount ?? null,
        ...extra
    });

    window.telemetry?.track('puzzle_failed', payload, {
        roomId: payload.roomId
    });
}

function trackPuzzleSolved(roomEl, data = {}, extra = {}) {
    const meta = getPuzzleMetaFromRoomElement(roomEl);

    if (meta?.solved) return;

    if (meta) {
        meta.solved = true;
        meta.solvedAtMs = window.telemetry?.getElapsedMs?.() ?? null;

        if (!meta.started) {
            meta.started = true;
            meta.startedAtMs = meta.solvedAtMs;
        }
    }

    const payload = buildPuzzleTelemetryPayload(roomEl, data, {
        failCount: meta?.failCount ?? 0,
        attemptCount: meta?.attemptCount ?? 0,
        startedAtMs: meta?.startedAtMs ?? null,
        solvedAtMs: meta?.solvedAtMs ?? null,
        ...extra
    });

    window.telemetry?.track('puzzle_solved', payload, {
        roomId: payload.roomId
    });
}

function trackPuzzleAttemptStarted(roomEl, data = {}, extra = {}) {
    const meta = getPuzzleMetaFromRoomElement(roomEl);

    if (meta?.solved) return;

    if (meta) {
        meta.attemptCount = (meta.attemptCount || 0) + 1;
        meta.lastAttemptStartedAtMs = window.telemetry?.getElapsedMs?.() ?? null;

        if (!meta.started) {
            meta.started = true;
            meta.startedAtMs = meta.lastAttemptStartedAtMs;
        }
    }

    const payload = buildPuzzleTelemetryPayload(roomEl, data, {
        attemptCount: meta?.attemptCount ?? null,
        lastAttemptStartedAtMs: meta?.lastAttemptStartedAtMs ?? null,
        ...extra
    });

    window.telemetry?.track('puzzle_attempt_started', payload, {
        roomId: payload.roomId
    });
}

function createSeededRandom(seedText) {
    let hash = 2166136261;

    for (let i = 0; i < seedText.length; i++) {
        hash ^= seedText.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }

    return function () {
        hash += hash << 13;
        hash ^= hash >>> 7;
        hash += hash << 3;
        hash ^= hash >>> 17;
        hash += hash << 5;

        return (hash >>> 0) / 4294967296;
    };
}