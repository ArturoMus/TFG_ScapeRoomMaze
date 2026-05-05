
function getMainPathCoords() {
    return [
        {x:0, z:0}, {x:0, z:1}, {x:0, z:2},
        {x:1, z:2}, {x:1, z:1}, {x:1, z:0},
        {x:2, z:0}, {x:2, z:1}, {x:2, z:2}
    ];
}

AFRAME.registerComponent('map', {
    init: function () {

        // Sustituir por generación de mapa
        const layout = [
            [1,1,1],
            [1,1,1],
            [1,1,1]
        ];

        const roomSize = 10;

        const mainPathCoords = getMainPathCoords();
        const allowedConnections = createConnectionsFromPath(mainPathCoords);

        const rooms = createGraph(layout, allowedConnections);

        window.rooms = rooms; // para debugear
        window.roomSize = roomSize;

        renderMap(rooms, roomSize);

        // Creamos la navmesh después de crear las salas y puertas
        rebuildGeneratedNavMesh(rooms, roomSize);

        // Guardamos función global para reconstruirla al abrir puertas
        window.rebuildNavMesh = () => rebuildGeneratedNavMesh(rooms, roomSize);
        
        assignPuzzlesPremium(rooms);
    }
});

function renderMap(rooms, roomSize) {
    const scene = document.querySelector('a-scene');

    Object.values(rooms).forEach(room => {
        const entity = createBasicRoom(
            roomSize,
            room.id,
            `${room.x * roomSize} 0 ${room.z * roomSize}`,
            room.neighbors,
        );
        scene.appendChild(entity);
        // guardar referencia visual
        room.el = entity;
    });

    // render puertas
    Object.values(rooms).forEach(room => {
        for (let dir in room.doors) {
            const door = room.doors[dir];

            // Solo renderizamos si no se ha renderizado desde el otro lado
            if (!door.rendered) {
                // Llamamos a createDoor y capturamos el pivot que devuelve
                const doorPivot = createDoor(room.el, door.direction, roomSize);
                
                // se guarda la referencia
                door.el = doorPivot; 
                door.el.doorData = door;
                door.rendered = true;

                // Opcional: ponerle un ID único para debug
                doorPivot.setAttribute('id', `door-pivot-${room.id}-${dir}`);
            }
        }
    });
}

function assignPuzzlesPremium(rooms, pathCoords = null) {
    // 1. Definimos el orden de las celdas según tu esquema (x, z)
    pathCoords = pathCoords || getMainPathCoords();
    const usedDoors = new Set();

    for (let i = 0; i < pathCoords.length - 1; i++) {
        const currentRoom = rooms[`room-${pathCoords[i].x}-${pathCoords[i].z}`];
        const nextRoom = rooms[`room-${pathCoords[i+1].x}-${pathCoords[i+1].z}`];

        if (!currentRoom || !nextRoom) continue;

        const directionToNext = Object.keys(currentRoom.neighbors).find(
            dir => currentRoom.neighbors[dir] === nextRoom
        );

        if (!directionToNext) continue;

        const door = currentRoom.doors[directionToNext];

        // Si la puerta ya tiene puzzle (porque la procesamos desde la otra sala), saltar
        if (usedDoors.has(door)) continue;

        // Registrar y marcar
        usedDoors.add(door);
        door.hasPuzzle = true;
        currentRoom.puzzleDoor = door; // Mantenemos la referencia por si acaso

        const type = i % 3

        if (type === 0) {
            // PUZZLE DE BOTÓN
            currentRoom.el.setAttribute('puzzle-button-door', {
                doorId: door.el.id,
            });
            console.log(`[Botón] Sala ${currentRoom.id} abre ${door.el.id}`);
        } 
        else if (type === 1) {
            // PUZZLE DE ORBE + PEDESTAL
            // El orbe se spawnea en la sala anterior (pathCoords[i-1])
            const prevRoomCoords = pathCoords[i-1];
            const prevRoomId = `room-${prevRoomCoords.x}-${prevRoomCoords.z}`;
            
            currentRoom.el.setAttribute('puzzle-orb-pedestal', {
                doorId: door.el.id,
                prevRoomId: prevRoomId
            });
            console.log(`[Orbe] Sala ${currentRoom.id} necesita orbe de ${prevRoomId} para abrir ${door.el.id}`);
        }
        else if (type === 2) {
            currentRoom.el.setAttribute('puzzle-pressure-plate', {
                doorId: door.el.id,
            });

            console.log(`[Placa] Sala ${currentRoom.id} usa caja para abrir ${door.el.id}`);
        }
        console.log(`[Puzzle] Sala ${currentRoom.id} abre puerta ${directionToNext} (${door.el.id})`);
    }

    const last = pathCoords[pathCoords.length - 1];
    const goalRoomId = `room-${last.x}-${last.z}`;

    const goalRoom = rooms[goalRoomId];
    if (goalRoom) {
        goalRoom.isGoal = true;
        console.log("Sala final:", goalRoomId);
    }
}

function assignPuzzles(rooms) {
    
    Object.values(rooms).forEach(room => {

        // Buscar una puerta sin puzzle asignado
        const doorKey = Object.keys(room.doors).find(key => !room.doors[key].hasPuzzle);

        if (doorKey) {
            const targetDoor = room.doors[doorKey];

            targetDoor.hasPuzzle = true; // marcar puerta como asignada a puzzle

            room.puzzle = 'puzzle-button-door';
            room.puzzleDoor = targetDoor;

            //Añadir el componente de puzzle a la habitación, pasando el ID de la puerta como parámetro
            room.el.setAttribute('puzzle-button-door', {
                doorId: targetDoor.el.id
            });

            console.log(`Puzzle asignado a ${room.id} controlando puerta ${targetDoor.el.id}`);
        }

        // ejemplo: 30% rooms tienen puzzle
        if (Object.keys(room.doors).length > 0) {

            room.puzzle = 'puzzle-button-door';

            const doorKey = Object.keys(room.doors)[0];
            const targetDoor = room.doors[doorKey];
            room.puzzleDoor = targetDoor;

            // Pasamos el ID de la puerta como un parámetro al componente
            room.el.setAttribute('puzzle-button-door', {
                doorId: targetDoor.el.id
            });
        }
    });
}

function rebuildGeneratedNavMesh(rooms, roomSize) {
    const scene = document.querySelector('a-scene');

    const oldNavMesh = document.querySelector('#generated-navmesh');
    if (oldNavMesh) {
        oldNavMesh.parentNode.removeChild(oldNavMesh);
    }

    const NAVMESH_DEBUG = false;

    // true = para probar, todas las puertas dejan pasar.
    // false = solo deja pasar por puertas abiertas.
    const ALLOW_CLOSED_DOORS = true;

    const playerMargin = 0.45;
    const doorWidth = 1.25;

    const halfRoom = roomSize / 2;
    const innerHalf = halfRoom - playerMargin;
    const halfDoor = doorWidth / 2;

    const y = 0.03;
    const EPS = 0.0001;

    const rects = [];

    function addArea(minX, minZ, maxX, maxZ) {
        rects.push({
            minX: Math.min(minX, maxX),
            maxX: Math.max(minX, maxX),
            minZ: Math.min(minZ, maxZ),
            maxZ: Math.max(minZ, maxZ)
        });
    }

    function rectContainsPoint(rect, x, z) {
        return (
            x >= rect.minX - EPS &&
            x <= rect.maxX + EPS &&
            z >= rect.minZ - EPS &&
            z <= rect.maxZ + EPS
        );
    }

    function isInsideAnyArea(x, z) {
        return rects.some(rect => rectContainsPoint(rect, x, z));
    }

    // 1. Añadir zonas navegables de salas
    Object.values(rooms).forEach(room => {
        const cx = room.x * roomSize;
        const cz = room.z * roomSize;

        addArea(
            cx - innerHalf,
            cz - innerHalf,
            cx + innerHalf,
            cz + innerHalf
        );
    });

    // 2. Añadir conectores de puertas
    const usedDoors = new Set();

    Object.values(rooms).forEach(room => {
        const cx = room.x * roomSize;
        const cz = room.z * roomSize;

        for (let dir in room.doors) {
            const door = room.doors[dir];

            if (usedDoors.has(door)) continue;
            usedDoors.add(door);

            const visualDoorOpen = door.el?.components?.door?.isOpen === true;
            const logicalDoorOpen = door.isOpen === true;

            if (!ALLOW_CLOSED_DOORS && !visualDoorOpen && !logicalDoorOpen) {
                continue;
            }

            switch (dir) {
                case 'north':
                    addArea(
                        cx - halfDoor,
                        cz - roomSize + innerHalf,
                        cx + halfDoor,
                        cz - innerHalf
                    );
                    break;

                case 'south':
                    addArea(
                        cx - halfDoor,
                        cz + innerHalf,
                        cx + halfDoor,
                        cz + roomSize - innerHalf
                    );
                    break;

                case 'east':
                    addArea(
                        cx + innerHalf,
                        cz - halfDoor,
                        cx + roomSize - innerHalf,
                        cz + halfDoor
                    );
                    break;

                case 'west':
                    addArea(
                        cx - roomSize + innerHalf,
                        cz - halfDoor,
                        cx - innerHalf,
                        cz + halfDoor
                    );
                    break;
            }
        }
    });

    // 3. Crear una retícula usando todos los cortes de las zonas.
    // Esto hace que salas y conectores compartan aristas exactas.
    const xs = [];
    const zs = [];

    rects.forEach(rect => {
        xs.push(rect.minX, rect.maxX);
        zs.push(rect.minZ, rect.maxZ);
    });

    function uniqueSorted(values) {
        return [...new Set(values.map(v => Number(v.toFixed(4))))].sort((a, b) => a - b);
    }

    const gridX = uniqueSorted(xs);
    const gridZ = uniqueSorted(zs);

    const vertices = [];
    const indices = [];
    const vertexMap = new Map();

    function getVertexIndex(x, z) {
        const key = `${x.toFixed(4)},${z.toFixed(4)}`;

        if (vertexMap.has(key)) {
            return vertexMap.get(key);
        }

        const index = vertices.length / 3;
        vertices.push(x, y, z);
        vertexMap.set(key, index);
        return index;
    }

    function addCell(minX, minZ, maxX, maxZ) {
        const v00 = getVertexIndex(minX, minZ);
        const v10 = getVertexIndex(maxX, minZ);
        const v11 = getVertexIndex(maxX, maxZ);
        const v01 = getVertexIndex(minX, maxZ);

        indices.push(
            v00, v11, v10,
            v00, v01, v11
        );
    }

    for (let ix = 0; ix < gridX.length - 1; ix++) {
        for (let iz = 0; iz < gridZ.length - 1; iz++) {
            const minX = gridX[ix];
            const maxX = gridX[ix + 1];
            const minZ = gridZ[iz];
            const maxZ = gridZ[iz + 1];

            if (Math.abs(maxX - minX) < EPS || Math.abs(maxZ - minZ) < EPS) {
                continue;
            }

            const midX = (minX + maxX) / 2;
            const midZ = (minZ + maxZ) / 2;

            if (isInsideAnyArea(midX, midZ)) {
                addCell(minX, minZ, maxX, maxZ);
            }
        }
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices, 3)
    );

    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: NAVMESH_DEBUG ? 0.25 : 0,
        side: THREE.DoubleSide,
        depthWrite: false
    });

    const mesh = new THREE.Mesh(geometry, material);

    const navEntity = document.createElement('a-entity');
    navEntity.setAttribute('id', 'generated-navmesh');
    navEntity.setObject3D('mesh', mesh);

    scene.appendChild(navEntity);

    // Importante: después de setObject3D
    navEntity.setAttribute('nav-mesh', '');

    console.log(
        'Navmesh reconstruida:',
        vertices.length / 3,
        'vértices,',
        indices.length / 3,
        'triángulos'
    );
}

/*
function createMap(width, height) {
    const scene = document.querySelector('a-scene');

    const layout = [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1]
    ];

    const roomSize = 10;

    layout.forEach((row, z) => {
        row.forEach((cell, x) => {
            if (cell === 1) {

                const neighbors = {
                    north: layout[z - 1]?.[x],
                    south: layout[z + 1]?.[x],
                    east:  layout[z]?.[x + 1],
                    west:  layout[z]?.[x - 1],
                };

                const room = createBasicRoom(roomSize, `room-${x}-${z}`, `${x * roomSize} 0 ${z * roomSize}`, 'puzzle-button-door', neighbors);
                scene.appendChild(room);

                /*if (layout[z][x + 1] === 1) {
                    createDoor(room, 'east', roomSize);
                }

                if (layout[z + 1]?.[x] === 1) {
                    createDoor(room, 'south', roomSize);
                }*/
                /*
            }
        });
    });
    
    /*const room1 = createBasicRoom('room1', '0 0 0', 'puzzle-button-door');
    const room2 = createBasicRoom('room2', '10 0 0', 'puzzle-button-door');
    const room3 = createBasicRoom('room3', '0 0 -10', null);

    scene.appendChild(room1);
    scene.appendChild(room2);
    scene.appendChild(room3);
}*/