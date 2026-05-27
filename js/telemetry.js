window.telemetry = {
    enabled: true,
    // ESTO CAMBIARLO POR LA DEL SERVIDOR, ES DECIR, ESCAPEROOM.ltm.uib O LO QUE SEA
    apiUrl: 'http://localhost:3000/api',

    runId: null,
    startedAt: null,
    pendingEvents: [],
    lastRoomId: null,

    // Devuelve el tiempo desde que empezó la partida en ms
    getElapsedMs() {
        if (!window.gameState?.startTime) return 0;
        return Math.floor(performance.now() - window.gameState.startTime);
    },

    // Sirve para calcular en que sala está actualmente el jugador
    // Obtiene posición global del jugador y busca la hab más cercana
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

    // Sirve para contar cuantas puertas únicas hay, evitando contar dos veces puertas compartidas entre salas
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

    // Calcula la cantidad de puzzles de cada tipo que hay en el mapa
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

    // Cuenta el número de salas que solo son una puerta y no son la final
    // Callejones sin salida vaya
    getDeadEndCount() {
        if (!window.rooms) return 0;

        return Object.values(window.rooms).filter(room => {
            const doorCount = Object.keys(room.doors || {}).length;
            return doorCount === 1 && !room.isGoal;
        }).length;
    },


    // Construye el objeto con toda la información del mapa que se enviará al backend al crear la partida: 
    // seed, tamaño, algoritmo, métricas, camino principal, sala final y distribución de puzzles.
    buildMapPayload() {
        const plan = window.progressionPlan || {};
        const rooms = window.rooms || {};
        const doors = this.getUniqueDoors();

        return {
            seed: window.mapSeed || plan.seed || null,

            algorithm: plan.algorithm || plan.config?.algorithm || null,
            difficulty: plan.difficulty || plan.config?.difficulty || null,

            width: plan.width || null,
            height: plan.height || null,

            roomCount: plan.metrics?.roomCount ?? Object.keys(rooms).length,
            doorCount: plan.metrics?.doorCount ?? doors.length,
            deadendCount: plan.metrics?.deadEndCount ?? this.getDeadEndCount(),

            mainPathLength: plan.metrics?.mainPathLength ?? null,
            branchCount: plan.metrics?.branchCount ?? null,
            branchRoomCount: plan.metrics?.branchRoomCount ?? null,
            loopCount: plan.metrics?.loopCount ?? 0,

            finalRoom: plan.finalCoord
                ? `room-${plan.finalCoord.x}-${plan.finalCoord.z}`
                : null,

            mainPath: plan.mainPathCoords || [],
            puzzleDistribution: this.getPuzzleDistribution(),

            metrics: plan.metrics || {},
            config: plan.config || {}
        };
    },

    // Crea una nueva partida en el backend, guardando su id paraluego asociarle los eventos que puedan
    // ocurrir en esta
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

    // Registra un evento de la partida, si esta no existe la deja en una cola temporal
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

    // Envia todos los eventos en la cola temporal al backend
    async flushPendingEvents() {
        const events = [...this.pendingEvents];
        this.pendingEvents = [];

        for (const event of events) {
            event.runId = this.runId;
            await this.track(event.type, event.payload);
        }
    },

    // Finaliza la partida, registra el evento final y actualiza su duración y resultado en backend.
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

    // Marca la partida como abandonomanual, no se si funciona 
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

// Sirve para revisar cada x tiempo en que sala esta el jugador, para notificar si este ha cambiado de sala
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