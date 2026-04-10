
function createBasicRoom(id, position, puzzleType = null) {
    const room = document.createElement('a-entity');
    room.setAttribute('id', id);
    room.setAttribute('position', position);
    room.setAttribute('class', 'room');

    createRoomStructure(room);

    // Creamos puzzle si lo hay
    if (puzzleType) {
        room.setAttribute(puzzleType, '');
    }

    return room;
}

function createRoomStructure(room) {
    // suelo
    const floor = document.createElement('a-plane');
    floor.setAttribute('rotation', '-90 0 0');
    floor.setAttribute('width', '10');
    floor.setAttribute('height', '10');
    floor.setAttribute('color', '#999');
    room.appendChild(floor);

    // Paredes
    const wallNorth = document.createElement('a-box');
    wallNorth.setAttribute('position', '0 2 5');
    wallNorth.setAttribute('width', 10);
    wallNorth.setAttribute('height', 4);
    wallNorth.setAttribute('depth', 0.2);
    wallNorth.setAttribute('color', '#666');

    const wallSouth = document.createElement('a-box');
    wallSouth.setAttribute('position', '0 2 -5');
    wallSouth.setAttribute('width', 10);
    wallSouth.setAttribute('height', 4);
    wallSouth.setAttribute('depth', 0.2);
    wallSouth.setAttribute('color', '#666');

    const wallEast = document.createElement('a-box');
    wallEast.setAttribute('position', '5 2 0');
    wallEast.setAttribute('width', 0.2);
    wallEast.setAttribute('height', 4);
    wallEast.setAttribute('depth', 10);
    wallEast.setAttribute('color', '#555');

    const wallWest = document.createElement('a-box');
    wallWest.setAttribute('position', '-5 2 0');
    wallWest.setAttribute('width', 0.2);
    wallWest.setAttribute('height', 4);
    wallWest.setAttribute('depth', 10);
    wallWest.setAttribute('color', '#555');

    room.appendChild(wallNorth);
    room.appendChild(wallSouth);
    room.appendChild(wallEast);
    room.appendChild(wallWest);

    // Techo
    const ceiling = document.createElement('a-plane');
    ceiling.setAttribute('rotation', '90 0 0');
    ceiling.setAttribute('position', '0 4 0');
    ceiling.setAttribute('width', 10);
    ceiling.setAttribute('height', 10);
    ceiling.setAttribute('color', '#444');
    room.appendChild(ceiling);
}