

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

        // CONVERTIR A METODO EN ELEMENTS.JS!!!!!!!!!!
        const button = createButton('1 1 -3', this.data.doorId, room);
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

        const plate = createPressurePlate('0 0 -2', this.data.doorId);
        room.appendChild(plate);

        const box = createTestBox('1 1 -2', this.data.doorId);
        room.appendChild(box);
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
