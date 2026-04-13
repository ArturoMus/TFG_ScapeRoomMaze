

AFRAME.registerComponent('puzzle-button-door', {
    init: function () {
        const room = this.el;

        // 1. Buscamos la puerta que el mapa ya creó en esta habitación.
        // Como en room.js las puertas son hijas de la habitación, las buscamos:
        const existingDoorPivot = room.querySelector('[door]');

        if (existingDoorPivot) {
            // Le asignamos un ID único para que el botón sepa a quién llamar
            const doorId = room.getAttribute('id') + '-doorPivot';
            existingDoorPivot.setAttribute('id', doorId);
            
            // Bloqueamos la puerta al inicio para que el puzzle tenga sentido
            // (Asegúrate de que tu componente door.js soporte 'isLocked' en el esquema o init)
            existingDoorPivot.components.door.isLocked = true;

            // 2. Creamos el botón
            const button = document.createElement('a-box');
            button.setAttribute('id', room.getAttribute('id') + '-button');
            button.setAttribute('position', '1 0.5 -4.5'); // Cerca de la pared norte
            button.setAttribute('class', 'interactable');
            button.setAttribute('depth', '0.2');
            button.setAttribute('height', '0.3');
            button.setAttribute('width', '0.3');
            button.setAttribute('color', 'red');
            
            // Configuramos el botón para que dispare el evento a la puerta que encontramos
            button.setAttribute('button', {
                event: 'openDoor',
                target: '#' + doorId
            });
            button.setAttribute('interactable', '');
            room.appendChild(button);
        } else {
            console.warn("No se encontró una puerta en esta habitación para el puzzle.");
        }
    }
});

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
