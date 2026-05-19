// ---------------------------------------------------------------------------------
//                                   FUNCIONES DE LAS PUERTAS
// ---------------------------------------------------------------------------------

function createDoor(room, direction, roomSize) {

    var size = roomSize / 2;

    const pivot = document.createElement('a-entity');

    pivot.setAttribute('door', `direction: ${direction}`);

    const door = document.createElement('a-box');

    door.setAttribute('class', 'interactable');
    door.setAttribute('interactable', '');
    door.setAttribute('width', '1.5');
    door.setAttribute('height', '2');
    door.setAttribute('depth', '0.2');
    door.setAttribute('color', '#6b4f3a');
    door.setAttribute('castShadow', {
        cast: true,
        receive: true
    });
    door.setAttribute('static-body', '');
    door.setAttribute('class', 'interactable ray-blocker door-blocker');

    door.setAttribute('position', '0 1 0');

    switch (direction) {
        case 'north':
            pivot.setAttribute('position', `0 0 -${size}`);
            pivot.setAttribute('rotation', '0 0 0');
            break;
        case 'south':
            pivot.setAttribute('position', `0 0 ${size}`);
            pivot.setAttribute('rotation', '0 180 0');
            break;
        case 'east':
            pivot.setAttribute('position', `${size} 0 0`);
            pivot.setAttribute('rotation', '0 90 0');
            break;
        case 'west':
            pivot.setAttribute('position', `-${size} 0 0`);
            pivot.setAttribute('rotation', '0 -90 0');
            break;
    }

    pivot.appendChild(door);
    room.appendChild(pivot);

    const isZ = direction === 'north' || direction === 'south';

    return pivot;
}