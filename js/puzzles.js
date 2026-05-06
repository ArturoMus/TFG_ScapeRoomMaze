
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

AFRAME.registerComponent('puzzle-button-door', {

    schema: {
        doorId: { type: 'string', default: '' },
        doorIds: { type: 'string', default: '' }
    },

    init: function () {
        const room = this.el;

        const doors = lockPuzzleDoors(this.data);

        if (doors.length === 0) {
            console.warn("No se encontró ninguna puerta para puzzle-button-door:", this.data);
            return;
        }

        const targetSelectors = getPuzzleDoorSelectors(this.data);

        const button = createCamouflagedWallButton(
            room,
            targetSelectors,
            window.roomSize || 10
        );

        room.appendChild(button);

        console.log("[Botón] Puzzle creado. Abre:", targetSelectors);
    }
});

AFRAME.registerComponent('puzzle-orb-pedestal', {
    schema: {
        doorId: { type: 'string', default: '' },
        doorIds: { type: 'string', default: '' },
        prevRoomId: { type: 'string' }
    },

    init: function () {
        const currentRoom = this.el;
        const prevRoom = document.getElementById(this.data.prevRoomId);

        const targets = getPuzzleDoorSelectors(this.data);
        const puzzleID = getFirstPuzzleDoorId(this.data);

        if (!targets || !puzzleID) {
            console.warn('[Orbe] Puzzle sin targets válidos:', this.data);
            return;
        }

        // Bloquear todas las puertas objetivo
        getPuzzleDoorElements(this.data).forEach(doorEl => {
            if (doorEl.components?.door) {
                doorEl.components.door.isLocked = true;
            }

            if (doorEl.doorData) {
                doorEl.doorData.isLocked = true;
            }
        });

        // El orbe aparece en la habitación anterior
        if (prevRoom) {
            const orb = createOrb('0 1.6 0');

            // El orbe y el pedestal comparten este mismo puzzleID
            orb.setAttribute('data-puzzle-id', puzzleID);

            prevRoom.appendChild(orb);

            console.log('[Orbe] Creado en', this.data.prevRoomId, 'con puzzleID:', puzzleID);
        } else {
            console.warn('[Orbe] No se encontró la habitación anterior:', this.data.prevRoomId);
        }

        // Pedestal en la habitación actual
        const pedestal = createPedestal('0 0 0', targets, {
            puzzleID: puzzleID
        });

        currentRoom.appendChild(pedestal);

        console.log('[Pedestal] Creado en', currentRoom.id, 'abre:', targets, 'puzzleID:', puzzleID);
    }
});

AFRAME.registerComponent('puzzle-pressure-plate', {
    schema: {
        doorId: { type: 'string', default: '' },
        doorIds: { type: 'string', default: '' }
    },

    init: function () {
        const room = this.el;

        const doors = lockPuzzleDoors(this.data);

        if (doors.length === 0) {
            console.warn("No se encontró ninguna puerta para puzzle-pressure-plate:", this.data);
            return;
        }

        const targetSelectors = getPuzzleDoorSelectors(this.data);

        const plateSetup = createCamouflagedPressurePlate(
            room,
            targetSelectors,
            window.roomSize || 10
        );

        room.appendChild(plateSetup.plate);

        const box = createTestBox(plateSetup.boxPosition);
        room.appendChild(box);

        console.log("[Placa] Puzzle creado. Abre:", targetSelectors);
    }
});

AFRAME.registerComponent('puzzle-memory-match', {
    schema: {
        doorId: { type: 'string', default: '' },
        doorIds: { type: 'string', default: '' },
        length: { type: 'number', default: 4 },
        showSpeed: { type: 'number', default: 650 }
    },

    init: function () {
        this.room = this.el;
        this.roomSize = window.roomSize || 10;

        this.sequence = [];
        this.input = [];
        this.pads = [];

        this.isShowing = false;
        this.isSolved = false;

        this.doors = lockPuzzleDoors(this.data);

        if (this.doors.length === 0) {
            console.warn("No se encontró ninguna puerta para puzzle-memory-match:", this.data);
            return;
        }

        const panelSetup = createMemoryPuzzlePanel(this.room, this.roomSize, {
            canHover: () => {
                return !this.isShowing && !this.isSolved;
            },
            onPadClick: (index) => {
                this.handlePadPress(index);
            }
        });

        this.pads = panelSetup.pads;

        this.generateSequence();

        setTimeout(() => {
            this.showSequence();
        }, 700);
    },

    generateSequence: function () {
        this.sequence = [];

        for (let i = 0; i < this.data.length; i++) {
            const index = Math.floor(Math.random() * this.pads.length);
            this.sequence.push(index);
        }

        console.log('[Memory] Secuencia:', this.sequence);
    },

    handlePadPress: function (index) {
        if (this.isSolved) return;
        if (this.isShowing) return;

        this.flashPad(index);

        this.input.push(index);

        const currentIndex = this.input.length - 1;

        if (this.input[currentIndex] !== this.sequence[currentIndex]) {
            this.fail();
            return;
        }

        if (this.input.length === this.sequence.length) {
            this.solve();
        }
    },

    showSequence: function () {
        if (this.isSolved) return;

        this.isShowing = true;
        this.input = [];

        let delay = 400;

        this.sequence.forEach((padIndex) => {
            setTimeout(() => {
                this.flashPad(padIndex);
            }, delay);

            delay += this.data.showSpeed;
        });

        setTimeout(() => {
            this.isShowing = false;
            console.log('[Memory] Turno del jugador');
        }, delay + 150);
    },

    flashPad: function (index) {
        const pad = this.pads[index];
        if (!pad) return;

        pad.setAttribute('material', {
            color: pad.activeColor,
            emissive: pad.activeColor,
            emissiveIntensity: 1
        });

        pad.setAttribute('scale', '1.15 1.15 1.15');

        setTimeout(() => {
            if (this.isSolved) return;

            pad.setAttribute('material', {
                color: pad.baseColor,
                emissive: pad.baseColor,
                emissiveIntensity: 0.05
            });

            pad.setAttribute('scale', '1 1 1');
        }, 300);
    },

    fail: function () {
        console.log('[Memory] Patrón incorrecto. Reiniciando.');

        this.input = [];
        this.isShowing = true;

        this.el.setAttribute('animation__memory_fail', {
            property: 'scale',
            to: '1.03 1.03 1.03',
            dur: 120,
            dir: 'alternate',
            loop: 2
        });

        setTimeout(() => {
            this.resetPuzzle();
        }, 900);
    },

    resetPuzzle: function(){
        this.input = [];
        this.generateSequence();
        this.showSequence();
    },

    solve: function () {
        this.isSolved = true;
        this.isShowing = false;

        console.log('[Memory] Puzzle resuelto. Abriendo puertas:', getPuzzleDoorSelectors(this.data));

        this.pads.forEach(pad => {
            pad.setAttribute('material', {
                color: '#ffffff',
                emissive: '#ffffff',
                emissiveIntensity: 0.5
            });

            pad.setAttribute('scale', '1 1 1');
        });

        emitToPuzzleDoors(this.data, 'openDoor');
    }
});




//acabar esta funcion
function checkDoorPivotExists(doorId) {}
/*AFRAME.registerComponent('puzzle-button-door', {
    init: function () {
        const room = this.el;

        // botón
        const button = document.createElement('a-box');
        button.setAttribute('id', room.getAttribute('id') + '-button');
        button.setAttribute('position', '1 1 -3');
        button.setAttribute('class', 'interactable');
        button.setAttribute('depth', '0.3');
        button.setAttribute('height', '0.3');
        button.setAttribute('width', '0.3');
        button.setAttribute('color', 'red');
        button.setAttribute('button', {
            event: 'openDoor',
            target: '#' + room.getAttribute('id') + '-doorPivot'
        });
        button.setAttribute('interactable', '');
        room.appendChild(button);

        // puerta
        const doorPivot = document.createElement('a-entity');
        doorPivot.setAttribute('id', room.getAttribute('id') + '-doorPivot');
        doorPivot.setAttribute('position', '0 0 -4');
        doorPivot.setAttribute('door', '');
        const door = document.createElement('a-box');
        door.setAttribute('id', room.getAttribute('id') + '-door');
        door.setAttribute('position', '-0.5 1 0');
        door.setAttribute('class', 'interactable');
        door.setAttribute('interactable', '');
        door.setAttribute('depth', '0.2');
        door.setAttribute('height', '2');
        door.setAttribute('width', '1');
        door.setAttribute('color', 'brown');
        doorPivot.appendChild(door);
        room.appendChild(doorPivot);
    }
});*/
