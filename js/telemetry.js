window.telemetry = {
    enabled: true,
    // ESTO CAMBIARLO POR LA DEL SERVIDOR, ES DECIR, ESCAPEROOM.ltm.uib O LO QUE SEA
    apiUrl: 'http://localhost:3000/api',

    runId: null,
    startedAt: null,
    pendingEvents: [],
    lastRoomId: null,

    getElapsedMs() {
        if (!window.gameState?.startTime) return 0;
        return Math.floor(performance.now() - window.gameState.startTime);
    },

    getCurrentRoomId() {
        const player = document.querySelector('#player');

        if (!player || !window.rooms || !window.roomSize) {
            return null;
        }

        const playerPos = new THREE.Vector3();
        player.object3D.getWorldPosition(playerPos);

        let bestRoom = null;
        let bestDistance = Infinity;

        Object.values(window.rooms).forEach(room => {
            const roomX = room.x * window.roomSize;
            const roomZ = room.z * window.roomSize;

            const dx = playerPos.x - roomX;
            const dz = playerPos.z - roomZ;

            const distance = dx * dx + dz * dz;

            if (distance < bestDistance) {
                bestDistance = distance;
                bestRoom = room;
            }
        });

        return bestRoom?.id || null;
    },

    getUniqueDoors() {
        if (!window.rooms) return [];

        const used = new Set();
        const doors = [];

        Object.values(window.rooms).forEach(room => {
            Object.values(room.doors || {}).forEach(door => {
                if (!door || used.has(door)) return;

                used.add(door);
                doors.push(door);
            });
        });

        return doors;
    },

    getPuzzleDistribution() {
        if (!window.rooms) return {};

        const distribution = {};

        Object.values(window.rooms).forEach(room => {
            const type = room.puzzle?.type;

            if (!type) return;

            distribution[type] = (distribution[type] || 0) + 1;
        });

        return distribution;
    },

    getDeadEndCount() {
        if (!window.rooms) return 0;

        return Object.values(window.rooms).filter(room => {
            const doorCount = Object.keys(room.doors || {}).length;
            return doorCount === 1 && !room.isGoal;
        }).length;
    },

    buildMapPayload() {
        const plan = window.progressionPlan || {};
        const rooms = window.rooms || {};
        const doors = this.getUniqueDoors();

        return {
            seed: window.mapSeed || plan.seed || null,
            width: plan.width || null,
            height: plan.height || null,
            roomCount: Object.keys(rooms).length,
            doorCount: doors.length,
            deadendCount: this.getDeadEndCount(),
            finalRoom: plan.finalCoord
                ? `room-${plan.finalCoord.x}-${plan.finalCoord.z}`
                : null,
            mainPath: plan.mainPathCoords || [],
            puzzleDistribution: this.getPuzzleDistribution()
        };
    },

    async startRun(options = {}) {
        if (!this.enabled) return;
        if (this.runId) return;

        const playerAlias = options.playerAlias || 'anon';

        const payload = {
            playerAlias,
            map: this.buildMapPayload()
        };

        try {
            const response = await fetch(`${this.apiUrl}/runs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            this.runId = data.id;
            this.startedAt = data.startedAt;

            console.log('[Telemetry] Partida creada:', this.runId);

            await this.track('run_started', {
                map: payload.map
            });

            await this.flushPendingEvents();

        } catch (error) {
            console.warn('[Telemetry] No se pudo crear la partida:', error);
        }
    },

    async track(type, payload = {}) {
        if (!this.enabled) return;

        const event = {
            runId: this.runId,
            type,
            elapsedMs: this.getElapsedMs(),
            roomId: this.getCurrentRoomId(),
            payload
        };

        if (!this.runId) {
            this.pendingEvents.push(event);
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

        } catch (error) {
            console.warn('[Telemetry] No se pudo enviar evento:', type, error);
        }
    },

    async flushPendingEvents() {
        const events = [...this.pendingEvents];
        this.pendingEvents = [];

        for (const event of events) {
            event.runId = this.runId;
            await this.track(event.type, event.payload);
        }
    },

    async finishRun(result = 'completed') {
        if (!this.enabled) return;
        if (!this.runId) return;

        const durationMs = this.getElapsedMs();

        await this.track('run_finished', {
            result,
            durationMs
        });

        try {
            const response = await fetch(`${this.apiUrl}/runs/${this.runId}/finish`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    result,
                    durationMs
                }),
                keepalive: true
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            console.log('[Telemetry] Partida finalizada:', result, durationMs);

        } catch (error) {
            console.warn('[Telemetry] No se pudo finalizar la partida:', error);
        }
    },

    async abandonRun(reason = 'manual_exit') {
        if (!this.enabled) return;
        if (!this.runId) return;
        if (window.gameState?.finished) return;

        await this.track('run_abandoned', {
            reason
        });

        await this.finishRun('abandoned');
    }
};


AFRAME.registerComponent('telemetry-room-tracker', {
    schema: {
        checkEveryMs: { type: 'number', default: 500 }
    },

    init: function () {
        this.lastCheck = 0;
    },

    tick: function (time) {
        if (!window.telemetry?.enabled) return;
        if (!window.gameState?.started) return;
        if (window.gameState?.finished) return;

        if (time - this.lastCheck < this.data.checkEveryMs) return;
        this.lastCheck = time;

        const roomId = window.telemetry.getCurrentRoomId();

        if (!roomId) return;

        if (roomId !== window.telemetry.lastRoomId) {
            const previousRoomId = window.telemetry.lastRoomId;

            window.telemetry.lastRoomId = roomId;

            window.telemetry.track('room_entered', {
                roomId,
                previousRoomId
            });
        }
    }
});



// NO ME FURULA, REVISAR
window.addEventListener('beforeunload', () => {
    if (!window.telemetry?.enabled) return;
    if (!window.telemetry.runId) return;
    if (window.gameState?.finished) return;

    const event = {
        runId: window.telemetry.runId,
        type: 'run_abandoned',
        elapsedMs: window.telemetry.getElapsedMs(),
        roomId: window.telemetry.getCurrentRoomId(),
        payload: {
            reason: 'page_unload'
        }
    };

    const blob = new Blob(
        [JSON.stringify(event)],
        { type: 'application/json' }
    );

    navigator.sendBeacon(
        `${window.telemetry.apiUrl}/events`,
        blob
    );
});