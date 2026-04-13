
function createBasicRoom(roomSize, id, position, neighbors = null) {
    const room = document.createElement('a-entity');
    room.setAttribute('id', id);
    room.setAttribute('position', position);
    room.setAttribute('class', 'room');

    createRoomStructure(room, roomSize, neighbors);

    // --------------------------------------------------------------
        // Debug: marcadores de paredes
        const roomBox1 = document.createElement('a-box'); //delante, norte
        roomBox1.setAttribute('position', '0 1 -3');
        roomBox1.setAttribute('color', 'red');
        roomBox1.setAttribute('depth', '0.2');
        roomBox1.setAttribute('height', '0.2');
        roomBox1.setAttribute('width', '0.2');
        room.appendChild(roomBox1);
        const roomBox2 = document.createElement('a-box'); //detrás, sur
        roomBox2.setAttribute('position', '0 1 3');
        roomBox2.setAttribute('color', 'blue');
        roomBox2.setAttribute('depth', '0.2');
        roomBox2.setAttribute('height', '0.2');
        roomBox2.setAttribute('width', '0.2');
        room.appendChild(roomBox2);
        const roomBox3 = document.createElement('a-box'); //derecha, este
        roomBox3.setAttribute('position', '3 1 0');
        roomBox3.setAttribute('color', 'green');
        roomBox3.setAttribute('depth', '0.2');
        roomBox3.setAttribute('height', '0.2');
        roomBox3.setAttribute('width', '0.2');
        room.appendChild(roomBox3);
        const roomBox4 = document.createElement('a-box'); //izquierda, oeste
        roomBox4.setAttribute('position', '-3 1 0');
        roomBox4.setAttribute('color', 'yellow');
        roomBox4.setAttribute('depth', '0.2');
        roomBox4.setAttribute('height', '0.2');
        roomBox4.setAttribute('width', '0.2');
        room.appendChild(roomBox4);
    // --------------------------------------------------------------

    return room;
}

function createRoomStructure(room, roomSize, neighbors) {

    // suelo
    const floor = document.createElement('a-plane');
    floor.setAttribute('rotation', '-90 0 0');
    floor.setAttribute('width', roomSize);
    floor.setAttribute('height', roomSize);
    floor.setAttribute('color', '#999');
    room.appendChild(floor);

    // Techo
    const ceiling = document.createElement('a-plane');
    ceiling.setAttribute('rotation', '90 0 0');
    ceiling.setAttribute('position', '0 4 0');
    ceiling.setAttribute('width', roomSize);
    ceiling.setAttribute('height', roomSize);
    ceiling.setAttribute('color', '#444');
    room.appendChild(ceiling);

    // Paredes
    if (!neighbors.north) {
        room.appendChild(createWall('0 2 -5', '10 4 0.2'));
    }
    else {
        createWallWithHole(room, 'north', roomSize);
    }
    if (!neighbors.south) {
        room.appendChild(createWall('0 2 5', '10 4 0.2'));
    } else {
        createWallWithHole(room, 'south', roomSize);
    }

    if (!neighbors.east) {
        room.appendChild(createWall('5 2 0', '0.2 4 10'));
    }
    else {
        createWallWithHole(room, 'east', roomSize);
    }
    if (!neighbors.west) {
        room.appendChild(createWall('-5 2 0', '0.2 4 10'));
    }
    else {
        createWallWithHole(room, 'west', roomSize);
    }
}

function createWall(position, size) {
    const wall = document.createElement('a-box');

    const [w, h, d] = size.split(' ').map(Number);

    wall.setAttribute('position', position);
    wall.setAttribute('width', w);
    wall.setAttribute('height', h);
    wall.setAttribute('depth', d);
    wall.setAttribute('color', '#555');

    colliders.push({
        el: wall,
        width: w,
        depth: d
    });

    return wall;
}

function createWallWithHole(room, direction, roomSize) {

    const doorW = 1.5;     
    const doorH = 2;     
    const wallH = 4;     
    const thickness = 0.2; 
    const half = roomSize / 2;

    // eje principal de la pared
    const isZ = direction === 'north' || direction === 'south';
    const sign = (direction === 'north' || direction === 'west') ? -1 : 1;

    // dimensiones segmentadas
    const sideSize = (roomSize - doorW) / 2;
    const topSize = wallH - doorH;

    // posiciones comunes
    const mainOffset = half * sign;

    const sideOffset = doorW / 2 + sideSize / 2;
    const topY = doorH + topSize / 2;

    // helpers
    const makePart = (pos, size) => createWall(pos, size);

    if (isZ) {
        // pared en Z (north/south)
        room.appendChild(makePart(
            `${-sideOffset} 2 ${mainOffset}`,
            `${sideSize} ${wallH} ${thickness}`
        ));
        room.appendChild(makePart(
            `${sideOffset} 2 ${mainOffset}`,
            `${sideSize} ${wallH} ${thickness}`
        ));
        room.appendChild(makePart(
            `0 ${topY} ${mainOffset}`,
            `${doorW} ${topSize} ${thickness}`
        ));
    } else {
        // pared en X (east/west)
        room.appendChild(makePart(
            `${mainOffset} 2 ${-sideOffset}`,
            `${thickness} ${wallH} ${sideSize}`
        ));
        room.appendChild(makePart(
            `${mainOffset} 2 ${sideOffset}`,
            `${thickness} ${wallH} ${sideSize}`
        ));
        room.appendChild(makePart(
            `${mainOffset} ${topY} 0`,
            `${thickness} ${topSize} ${doorW}`
        ));
    }
}

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
    
    const collider={
        el: door,
        width: isZ ? 1 : 0.2,
        depth: isZ ? 0.2 : 1,
        disabled: false,
    }
    colliders.push(collider);
    
    pivot.colliderRef = collider;

    return pivot;
}