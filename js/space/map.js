
AFRAME.registerComponent('map', {
    init: function () {

        // Sustituir por generación de mapa
        const layout = [
            [1,1,1],
            [1,1,1],
            [1,1,1]
        ];

        const roomSize = 10;

        const rooms = createGraph(layout);

        window.rooms = rooms; // para debugear

        renderMap(rooms, roomSize);
        
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
                door.rendered = true;

                // Opcional: ponerle un ID único para debug
                doorPivot.setAttribute('id', `door-pivot-${room.id}-${dir}`);
            }
        }
    });
}

function assignPuzzlesPremium(rooms) {
    // 1. Definimos el orden de las celdas según tu esquema (x, z)
    const pathCoords = [
        {x:0, z:0}, {x:0, z:1}, {x:0, z:2}, // Columna 0 (Baja)
        {x:1, z:2}, {x:1, z:1}, {x:1, z:0}, // Columna 1 (Sube)
        {x:2, z:0}, {x:2, z:1}, {x:2, z:2}  // Columna 2 (Baja)
    ];

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