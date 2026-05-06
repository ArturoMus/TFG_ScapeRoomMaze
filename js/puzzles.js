

AFRAME.registerComponent('puzzle-button-door', {

    schema: {
        doorId: { type: 'string' }
    },

    init: function () {
        const room = this.el;

        const existingDoorPivot = document.querySelector('#' + this.data.doorId);

        console.log("YAAAAAAS.");

        if(!existingDoorPivot) {
            console.warn("No se encontró la puerta con ID:", this.data.doorId);
            return;
        }

        console.log("Se encontró la puerta con ID:", this.data.doorId);
        
        existingDoorPivot.components.door.isLocked = true;

        const button = createCamouflagedWallButton(room, this.data.doorId, window.roomSize || 10);

        room.appendChild(button);
        
    }
});

AFRAME.registerComponent('puzzle-orb-pedestal', {
    schema: {
        doorId: { type: 'string' },
        prevRoomId: { type: 'string' }
    },

    init: function () {
        const currentRoom = this.el;
        const prevRoom = document.getElementById(this.data.prevRoomId);


        const existingDoorPivot = document.querySelector('#' + this.data.doorId);

        console.log("YAAAAAAS.");

        if(!existingDoorPivot) {
            console.warn("No se encontró la puerta con ID:", this.data.doorId);
            return;
        }

        console.log("Se encontró la puerta con ID:", this.data.doorId);
        
        existingDoorPivot.components.door.isLocked = true;

        // 2. Crear Orbe en la sala anterior (posicionado de forma que se vea)
        if (prevRoom) {
            const orb = createOrb('0 1.6 0'); 
            orb.setAttribute('data-puzzle-id', this.data.doorId); // asociamos el orbe con la puerta que abre
            prevRoom.appendChild(orb);
        }

        // 3. Crear Pedestal en la sala actual
        // El pedestal le pasa el ID de la puerta que debe abrir
        const pedestal = createPedestal('0 0 0', this.data.doorId);
        currentRoom.appendChild(pedestal);
    }
});

AFRAME.registerComponent('puzzle-pressure-plate', {
    schema: {
        doorId: { type: 'string' }
    },

    init: function () {

        const room = this.el;

        const door = document.querySelector('#' + this.data.doorId);
        if (!door) {
            console.warn("No se encontró la puerta:", this.data.doorId);
            return;
        }

        door.components.door.isLocked = true;

        const plateSetup = createCamouflagedPressurePlate(room, this.data.doorId, window.roomSize || 10);
        room.appendChild(plateSetup.plate);

        const box = createTestBox(plateSetup.boxPosition);
        room.appendChild(box);
    }
});

AFRAME.registerComponent('puzzle-memory-match', {
    schema: {
        doorId: { type: 'string' },
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

        this.door = document.querySelector('#' + this.data.doorId);

        if (!this.door) {
            console.warn("No se encontró la puerta:", this.data.doorId);
            return;
        }

        this.door.components.door.isLocked = true;

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
            this.showSequence();
        }, 900);
    },

    solve: function () {
        this.isSolved = true;
        this.isShowing = false;

        console.log('[Memory] Puzzle resuelto. Abriendo puerta:', this.data.doorId);

        this.pads.forEach(pad => {
            pad.setAttribute('material', {
                color: '#ffffff',
                emissive: '#ffffff',
                emissiveIntensity: 0.5
            });

            pad.setAttribute('scale', '1 1 1');
        });

        this.door.emit('openDoor');
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
