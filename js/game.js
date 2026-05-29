
window.gameState = {
    finished: false,
    started: false,
    mapGenerated: false,
    startTime: null,
    endTime: null
};

window.playerState = {
    hasOrb: false
};

window.performanceConfig = {
    lowSpecMode: false,
    disableTorchLights: false,
    disableShadows: false,
    maxActiveTorchLights: 4
};

window.addEventListener('load', () => {
    setPlayerMovementEnabled(false);
});

function applyPerformanceMode() {
    const scene = document.querySelector('a-scene');

    if (window.performanceConfig.disableShadows && scene) {
        scene.setAttribute('shadow', 'enabled: false');
    }

    if (window.performanceConfig.disableTorchLights) {
        const pointLights = [...document.querySelectorAll('[light]')].filter(el => {
            const light = el.getAttribute('light');
            return light && light.type === 'point';
        });

        pointLights.forEach((lightEl, index) => {
            if (index >= window.performanceConfig.maxActiveTorchLights) {
                lightEl.setAttribute('visible', false);
            }
        });

        console.log(`[Performance] Luces puntuales activas limitadas a ${window.performanceConfig.maxActiveTorchLights}`);
    }
}

function setPlayerMovementEnabled(enabled) {
    const player = document.querySelector('#player');
    if (!player) return;

    const speed = enabled ? 0.2 : 0;

    player.setAttribute(
        'movement-controls',
        `controls: gamepad, keyboard; speed: ${speed}; fly: false; constrainToNavMesh: true`
    );
}

function generateMapOnce() {
    if (window.gameState.mapGenerated) return;

    const mapRoot = document.querySelector('#map-root');
    if (!mapRoot) {
        console.warn('No existe #map-root en index.html');
        return;
    }

    mapRoot.setAttribute('map', '');

    setTimeout(() => {
        applyPerformanceMode();
    }, 0);

    window.gameState.mapGenerated = true;
}

window.startGameFromMenu = function () {
    if (window.gameState.started) return;

    window.gameState.started = true;
    window.gameState.startTime = performance.now();

    const mainMenu = document.querySelector('#main-menu');
    const loadingScreen = document.querySelector('#loading-screen');

    if (mainMenu) {
        mainMenu.setAttribute('visible', false);
    }

    if (loadingScreen?.components['vr-loading-screen']) {
        loadingScreen.components['vr-loading-screen'].setContent(
            'Preparando mazmorra...',
            'Objetivo:\nEncuentra la sala final.\nResuelve mecanismos, abre puertas y busca la salida.',
            'Cargando...'
        );

        loadingScreen.components['vr-loading-screen'].show();
    }

    // Pantalla de carga fake.
    setTimeout(() => {
        generateMapOnce();

        if (loadingScreen?.components['vr-loading-screen']) {
            loadingScreen.components['vr-loading-screen'].setContent(
                'Objetivo',
                'Busca la salida.\nAlgunas puertas requieren botones, orbes o placas de presión.',
                'Buena suerte.'
            );
        }

        setTimeout(() => {
            if (loadingScreen?.components['vr-loading-screen']) {
                loadingScreen.components['vr-loading-screen'].hide();
            }

            setPlayerMovementEnabled(true);
        }, 1800);

    }, 1200);
};

function endGame() {
    if (window.gameState.finished) return;

    window.gameState.finished = true;
    window.gameState.endTime = performance.now();

    console.log("Juego terminado");

    setPlayerMovementEnabled(false);

    const elapsed = window.gameState.startTime
        ? window.gameState.endTime - window.gameState.startTime
        : 0;

    const formattedTime = formatGameTime(elapsed);

    const endScreen = document.querySelector('#end-screen');

    console.log('endScreen:', endScreen);
    console.log('components:', endScreen?.components);
    console.log('vr-end-screen:', endScreen?.components?.['vr-end-screen']);

    if (endScreen?.components['vr-end-screen']) {
        endScreen.components['vr-end-screen'].setTime(formattedTime);

        placeEntityInFrontOfCamera(endScreen, 2.2);

        endScreen.components['vr-end-screen'].show();
        console.log("Mostrando pantalla final VR:", formattedTime);
    }
}

function formatGameTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function placeEntityInFrontOfCamera(entity, distance = 2.2) {
    const camera = document.querySelector('#camera');

    if (!camera || !entity) {
        console.warn('No se pudo colocar la pantalla final delante de la cámara');
        return;
    }

    entity.setAttribute('position', `0 0 -${distance}`);
    entity.setAttribute('rotation', '0 0 0');
    entity.setAttribute('visible', 'true');

    console.log('Pantalla final colocada delante de la cámara');
}


AFRAME.registerComponent('end-room-trigger', {
    schema: {
        radius: { type: 'number', default: 2.8 }
    },

    init: function () {
        this.hasTriggered = false;
        this.player = document.querySelector('#player');

        this.triggerPos = new THREE.Vector3();
        this.playerPos = new THREE.Vector3();
    },

    tick: function () {
        if (this.hasTriggered) return;
        if (!window.gameState?.started) return;
        if (window.gameState?.finished) return;
        if (!this.player) return;

        this.el.object3D.getWorldPosition(this.triggerPos);
        this.player.object3D.getWorldPosition(this.playerPos);

        const dx = this.playerPos.x - this.triggerPos.x;
        const dz = this.playerPos.z - this.triggerPos.z;

        const distanceXZ = Math.sqrt(dx * dx + dz * dz);

        if (distanceXZ <= this.data.radius) {
            this.hasTriggered = true;
            endGame();
        }
    }
});

AFRAME.registerComponent('fps-watchdog', {
    schema: {
        minFps: { type: 'number', default: 22 },
        checkEveryMs: { type: 'number', default: 1500 }
    },

    init: function () {
        this.samples = [];
        this.lastCheck = 0;
        this.lowModeApplied = false;
    },

    tick: function (time, delta) {
        if (!delta || delta <= 0) return;

        const fps = 1000 / delta;
        this.samples.push(fps);

        if (this.samples.length > 60) {
            this.samples.shift();
        }

        if (time - this.lastCheck < this.data.checkEveryMs) return;
        this.lastCheck = time;

        const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;

        if (avg < this.data.minFps && !this.lowModeApplied) {
            //this.lowModeApplied = true;
            console.warn(`[FPS Watchdog] FPS bajos detectados: ${avg.toFixed(1)}. Aplicando modo rendimiento.`);
            //applyPerformanceMode();
        }
    }
});

// ============================================================
// Debug console
// ============================================================

window.debugStats = {
    enabled: true,
    seed: null,
    fps: 0,
    currentRoom: '-',
    puzzlesTotal: 0,
    solvedPuzzleRoomIds: new Set(),
    doorsTotal: 0,
    doorsOpened: 0
};

window.debugSetPuzzleTotal = function (total) {
    window.debugStats.puzzlesTotal = total;
};

function debugGetUniqueDoors(rooms = window.rooms) {
    if (!rooms) return [];

    const used = new Set();
    const doors = [];

    Object.values(rooms).forEach(room => {
        Object.values(room.doors || {}).forEach(door => {
            if (!door || used.has(door)) return;

            used.add(door);
            doors.push(door);
        });
    });

    return doors;
}

function debugGetCurrentRoomId() {
    const player = document.querySelector('#player');

    if (!player || !window.rooms || !window.roomSize) {
        return '-';
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

    if (!bestRoom) return '-';

    return `${bestRoom.id} (${bestRoom.x},${bestRoom.z})`;
}

function debugRefreshDoorStats() {
    const doors = debugGetUniqueDoors();

    const opened = doors.filter(door => {
        const componentOpen = door.el?.components?.door?.isOpen === true;
        const logicalOpen = door.isOpen === true;
        const doorDataOpen = door.el?.doorData?.isOpen === true;

        return componentOpen || logicalOpen || doorDataOpen;
    });

    window.debugStats.doorsTotal = doors.length;
    window.debugStats.doorsOpened = opened.length;
}

window.debugMarkPuzzleSolved = function (roomId) {
    if (!roomId) return;

    window.debugStats.solvedPuzzleRoomIds.add(roomId);

    const room = window.rooms?.[roomId];

    if (room?.puzzle) {
        room.puzzle.solved = true;
    }
};

window.debugInitMap = function (progressionPlan, rooms) {
    window.debugStats.seed = progressionPlan.seed ?? window.mapSeed ?? '-';

    const doors = debugGetUniqueDoors(rooms);

    window.debugStats.doorsTotal = doors.length;
    window.debugStats.doorsOpened = 0;

    doors.forEach(door => {
        if (!door.el) return;
        if (door.debugListenerAttached) return;

        door.debugListenerAttached = true;

        door.el.addEventListener('openDoor', () => {
            door.isOpen = true;

            if (door.el.doorData) {
                door.el.doorData.isOpen = true;
            }

            if (door.debugPuzzleRoomIds) {
                door.debugPuzzleRoomIds.forEach(roomId => {
                    window.debugMarkPuzzleSolved(roomId);
                });
            }

            debugRefreshDoorStats();
        });
    });

    debugRefreshDoorStats();

    console.log('[Debug] Inicializado:', {
        seed: window.debugStats.seed,
        totalDoors: window.debugStats.doorsTotal,
        totalPuzzles: window.debugStats.puzzlesTotal
    });
};

AFRAME.registerComponent('debug-panel', {
    schema: {
        enabled: { type: 'boolean', default: true },
        updateEveryMs: { type: 'number', default: 250 }
    },

    init: function () {
        this.visible = this.data.enabled;
        this.lastUpdate = 0;

        this.fpsSamples = [];

        this.createPanel();

        this.onKeyDown = this.onKeyDown.bind(this);
        window.addEventListener('keydown', this.onKeyDown);

        this.el.setAttribute('visible', this.visible);
    },

    remove: function () {
        window.removeEventListener('keydown', this.onKeyDown);
    },

    createPanel: function () {
        const background = document.createElement('a-plane');
        background.setAttribute('width', '1.55');
        background.setAttribute('height', '0.75');
        background.setAttribute('position', '0 0 0');
        background.setAttribute('material', {
            color: '#000000',
            opacity: 0.65,
            transparent: true,
            shader: 'flat'
        });

        const title = document.createElement('a-text');
        title.setAttribute('value', 'DEBUG');
        title.setAttribute('align', 'center');
        title.setAttribute('width', '1.4');
        title.setAttribute('position', '0 0.27 0.01');
        title.setAttribute('color', '#00ffcc');

        const text = document.createElement('a-text');
        text.setAttribute('value', 'Cargando debug...');
        text.setAttribute('align', 'left');
        text.setAttribute('width', '1.45');
        text.setAttribute('position', '-0.7 0.12 0.01');
        text.setAttribute('color', '#ffffff');

        this.text = text;

        this.el.appendChild(background);
        this.el.appendChild(title);
        this.el.appendChild(text);
    },

    onKeyDown: function (event) {
        if (event.key !== 'F3') return;

        this.visible = !this.visible;
        this.el.setAttribute('visible', this.visible);
    },

    tick: function (time, delta) {
        if (!delta || delta <= 0) return;

        const fps = 1000 / delta;

        this.fpsSamples.push(fps);

        if (this.fpsSamples.length > 30) {
            this.fpsSamples.shift();
        }

        const avgFps = this.fpsSamples.reduce((a, b) => a + b, 0) / this.fpsSamples.length;

        window.debugStats.fps = avgFps;

        if (time - this.lastUpdate < this.data.updateEveryMs) return;
        this.lastUpdate = time;

        debugRefreshDoorStats();

        window.debugStats.currentRoom = debugGetCurrentRoomId();

        const seed = window.debugStats.seed ?? '-';
        const currentRoom = window.debugStats.currentRoom;
        const solved = window.debugStats.solvedPuzzleRoomIds.size;
        const totalPuzzles = window.debugStats.puzzlesTotal;
        const openedDoors = window.debugStats.doorsOpened;
        const totalDoors = window.debugStats.doorsTotal;

        const textValue =
            `Seed: ${seed}\n` +
            `Sala: ${currentRoom}\n` +
            `Puzzles: ${solved}/${totalPuzzles}\n` +
            `Puertas: ${openedDoors}/${totalDoors}\n` +
            `FPS: ${avgFps.toFixed(1)}\n` +
            `F3: ocultar/mostrar`;

        if (this.text) {
            this.text.setAttribute('value', textValue);
        }
    }
});