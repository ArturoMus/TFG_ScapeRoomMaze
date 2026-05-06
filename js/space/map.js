

// Función camino preecho
/*function getMainPathCoords() {
    return [
        {x:0, z:0}, {x:0, z:1}, {x:0, z:2},
        {x:1, z:2}, {x:1, z:1}, {x:1, z:0},
        {x:2, z:0}, {x:2, z:1}, {x:2, z:2}
    ];
}*/

//Función para generar mapas 3x3 mas aleatorios con un par de deadends
function coordId(coord) {
    return `${coord.x}-${coord.z}`;
}

function parseCoordId(id) {
    const [x, z] = id.split('-').map(Number);
    return { x, z };
}

function shuffleArray(array) {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

function getGridNeighbors(coord, width, height) {
    const candidates = [
        { x: coord.x,     z: coord.z - 1 },
        { x: coord.x,     z: coord.z + 1 },
        { x: coord.x + 1, z: coord.z },
        { x: coord.x - 1, z: coord.z }
    ];

    return candidates.filter(c => {
        return c.x >= 0 && c.x < width && c.z >= 0 && c.z < height;
    });
}

function generateRandomMazeTree(width, height, start) {
    const visited = new Set();
    const adjacency = {};
    const edges = new Set();

    function ensureNode(id) {
        if (!adjacency[id]) {
            adjacency[id] = [];
        }
    }

    function visit(coord) {
        const id = coordId(coord);

        visited.add(id);
        ensureNode(id);

        const neighbors = shuffleArray(getGridNeighbors(coord, width, height));

        neighbors.forEach(neighbor => {
            const neighborId = coordId(neighbor);

            if (visited.has(neighborId)) return;

            ensureNode(neighborId);

            adjacency[id].push(neighborId);
            adjacency[neighborId].push(id);

            edges.add(edgeKeyFromCoords(coord, neighbor));

            visit(neighbor);
        });
    }

    visit(start);

    return {
        adjacency,
        edges
    };
}

function getPathToFarthestRoom(tree, start) {
    const startId = coordId(start);

    const queue = [startId];
    const visited = new Set([startId]);
    const parent = {};
    const distance = {};

    distance[startId] = 0;

    let farthestId = startId;

    while (queue.length > 0) {
        const current = queue.shift();

        if (distance[current] > distance[farthestId]) {
            farthestId = current;
        }

        const neighbors = tree.adjacency[current] || [];

        neighbors.forEach(next => {
            if (visited.has(next)) return;

            visited.add(next);
            parent[next] = current;
            distance[next] = distance[current] + 1;
            queue.push(next);
        });
    }

    const pathIds = [];
    let current = farthestId;

    while (current) {
        pathIds.push(current);
        current = parent[current];
    }

    pathIds.reverse();

    return pathIds.map(parseCoordId);
}

function getDeadEndBranches(tree, mainPathCoords) {
    const mainPathIds = new Set(mainPathCoords.map(coordId));
    const branches = [];

    mainPathCoords.forEach(pathCoord => {
        const pathId = coordId(pathCoord);
        const neighbors = tree.adjacency[pathId] || [];

        neighbors.forEach(neighborId => {
            if (mainPathIds.has(neighborId)) return;

            const branch = [];
            let current = neighborId;
            let previous = pathId;

            while (current && !mainPathIds.has(current)) {
                branch.push(parseCoordId(current));

                const nextCandidates = (tree.adjacency[current] || [])
                    .filter(id => id !== previous);

                previous = current;
                current = nextCandidates[0];
            }

            if (branch.length > 0) {
                branches.push([
                    pathCoord,
                    ...branch
                ]);
            }
        });
    });

    return branches;
}

function getMazeUsedCoords(mainPathCoords, deadEndBranches) {
    const used = new Map();

    mainPathCoords.forEach(coord => {
        used.set(coordKey(coord), coord);
    });

    deadEndBranches.forEach(branch => {
        branch.forEach(coord => {
            used.set(coordKey(coord), coord);
        });
    });

    return [...used.values()];
}

function createLayoutFromCoords(width, height, coords) {
    const layout = Array.from({ length: height }, () => {
        return Array.from({ length: width }, () => 0);
    });

    coords.forEach(coord => {
        if (
            coord.x >= 0 &&
            coord.x < width &&
            coord.z >= 0 &&
            coord.z < height
        ) {
            layout[coord.z][coord.x] = 1;
        }
    });

    return layout;
}

function createFullLayout(width, height) {
    return Array.from({ length: height }, () => {
        return Array.from({ length: width }, () => 1);
    });
}

function sameCoord(a, b) {
    return a.x === b.x && a.z === b.z;
}

function coordInList(coord, list) {
    return list.some(item => sameCoord(item, coord));
}

function getUnusedNeighbors(coord, width, height, usedCoords) {
    return shuffleArray(
        getGridNeighbors(coord, width, height)
            .filter(neighbor => !coordInList(neighbor, usedCoords))
    );
}

function generateRandomMainPath(width, height, start, targetLength) {
    const maxAttempts = 120;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const path = [{ ...start }];

        while (path.length < targetLength) {
            const current = path[path.length - 1];
            const candidates = getUnusedNeighbors(current, width, height, path);

            if (candidates.length === 0) {
                break;
            }

            path.push(candidates[0]);
        }

        if (path.length >= targetLength) {
            return path;
        }
    }

    console.warn("No se pudo generar camino principal largo. Usando fallback.");

    return [
        { x: 0, z: 0 },
        { x: 0, z: 1 },
        { x: 0, z: 2 },
        { x: 1, z: 2 },
        { x: 2, z: 2 }
    ].filter(coord => coord.x < width && coord.z < height);
}

function generateDeadEndBranchesFromMainPath(width, height, mainPathCoords, options = {}) {
    const branchCount = options.branchCount ?? 2;
    const maxBranchLength = options.maxBranchLength ?? 2;

    const branches = [];
    const usedCoords = [...mainPathCoords];

    // No generamos ramas desde inicio ni desde meta.
    const possibleRoots = shuffleArray(mainPathCoords.slice(1, -1));

    for (const root of possibleRoots) {
        if (branches.length >= branchCount) break;

        const branch = [root];

        let current = root;

        for (let depth = 0; depth < maxBranchLength; depth++) {
            const candidates = getUnusedNeighbors(current, width, height, usedCoords);

            if (candidates.length === 0) {
                break;
            }

            const next = candidates[0];

            branch.push(next);
            usedCoords.push(next);
            current = next;
        }

        // Solo cuenta como rama si realmente sale del camino principal.
        if (branch.length > 1) {
            branches.push(branch);
        }
    }

    return branches;
}

function createConnectionsFromMazeParts(mainPathCoords, deadEndBranches) {
    const connections = createConnectionsFromPath(mainPathCoords);

    deadEndBranches.forEach(branch => {
        const branchConnections = createConnectionsFromPath(branch);

        branchConnections.forEach(connection => {
            connections.add(connection);
        });
    });

    return connections;
}


function getRandomBetaMazePlan(config = {}) {
    const width = config.width ?? 3;
    const height = config.height ?? 3;

    const mainPathLength = config.mainPathLength ?? Math.min(
        width * height,
        Math.ceil(width * height * 0.55)
    );

    const branchCount = config.branchCount ?? Math.max(
        1,
        Math.floor((width * height - mainPathLength) / 2)
    );

    const maxBranchLength = config.maxBranchLength ?? 2;

    let layout = null;

    const start = config.start ?? { x: 0, z: 0 };

    const mainPathCoords = generateRandomMainPath(
        width,
        height,
        start,
        mainPathLength
    );

    const deadEndBranches = generateDeadEndBranchesFromMainPath(
        width,
        height,
        mainPathCoords,
        {
            branchCount,
            maxBranchLength
        }
    );

    const usedCoords = getMazeUsedCoords(mainPathCoords, deadEndBranches);
    layout = createLayoutFromCoords(width, height, usedCoords);

    const allowedConnections = createConnectionsFromMazeParts(
        mainPathCoords,
        deadEndBranches
    );

    return {
        layout,
        width,
        height,
        mainPathCoords,
        deadEndBranches,
        allowedConnections
    };
}

AFRAME.registerComponent('map', {
    /*init: function () {

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
        createEndRoomTrigger(rooms, mainPathCoords, roomSize);
    }*/
    init: function () {

        const mazePlan = getRandomBetaMazePlan({
            width: 3,
            height: 3,
            mainPathLength: 5,
            branchCount: 2,
            maxBranchLength: 2,
            start: { x: 0, z: 0 }
        });

        const layout = mazePlan.layout;
        const roomSize = 10;

        const mainPathCoords = mazePlan.mainPathCoords;
        const deadEndBranches = mazePlan.deadEndBranches;
        const allowedConnections = mazePlan.allowedConnections;

        const rooms = createGraph(layout, allowedConnections);

        window.rooms = rooms;
        window.roomSize = roomSize;
        window.mainPathCoords = mainPathCoords;
        window.deadEndBranches = deadEndBranches;

        renderMap(rooms, roomSize);

        rebuildGeneratedNavMesh(rooms, roomSize);
        window.rebuildNavMesh = () => rebuildGeneratedNavMesh(rooms, roomSize);

        assignProgressionPuzzles(rooms, mainPathCoords, deadEndBranches);

        console.log("Mapa aleatorio generado");
        console.log("Camino principal:", mainPathCoords);
        console.log("Deadends:", deadEndBranches);
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

function getDirectionBetween(a, b) {
    if (b.x === a.x && b.z === a.z - 1) return 'north';
    if (b.x === a.x && b.z === a.z + 1) return 'south';
    if (b.x === a.x + 1 && b.z === a.z) return 'east';
    if (b.x === a.x - 1 && b.z === a.z) return 'west';

    return null;
}

function getDoorBetweenCoords(rooms, a, b) {
    const room = rooms[`room-${a.x}-${a.z}`];

    if (!room) return null;

    const dir = getDirectionBetween(a, b);

    if (!dir) return null;

    return room.doors[dir] || null;
}

function ensureDoorId(door) {
    if (!door || !door.el) return null;

    if (!door.el.id) {
        const idA = door.roomA.id;
        const idB = door.roomB.id;
        door.el.setAttribute('id', `door-${idA}-${idB}`);
    }

    return door.el.id;
}

/*function assignDeadEndPuzzles(rooms, mainPathCoords, deadEndBranches) {
    if (!deadEndBranches || deadEndBranches.length === 0) return;

    const usedMainDoors = new Set();

    deadEndBranches.forEach((branch, branchIndex) => {
        if (branch.length < 2) return;

        const branchStart = branch[0];
        const deadEndRoomCoord = branch[branch.length - 1];

        const deadEndRoom = rooms[`room-${deadEndRoomCoord.x}-${deadEndRoomCoord.z}`];

        if (!deadEndRoom || !deadEndRoom.el) return;

        const mainPathIndex = mainPathCoords.findIndex(coord => {
            return coord.x === branchStart.x && coord.z === branchStart.z;
        });

        if (mainPathIndex === -1) return;
        if (mainPathIndex >= mainPathCoords.length - 1) return;

        const mainDoor = getDoorBetweenCoords(
            rooms,
            mainPathCoords[mainPathIndex],
            mainPathCoords[mainPathIndex + 1]
        );

        if (!mainDoor) return;
        if (usedMainDoors.has(mainDoor)) return;

        usedMainDoors.add(mainDoor);

        mainDoor.hasPuzzle = true;

        const mainDoorId = ensureDoorId(mainDoor);

        if (!mainDoorId) return;

        // Las puertas de la rama se desbloquean para poder llegar al puzzle.
        for (let i = 0; i < branch.length - 1; i++) {
            const branchDoor = getDoorBetweenCoords(
                rooms,
                branch[i],
                branch[i + 1]
            );

            if (!branchDoor) continue;

            branchDoor.isLocked = false;

            if (branchDoor.el?.components?.door) {
                branchDoor.el.components.door.isLocked = false;
            }
        }

        const targetsToOpen = [mainDoorId];

        if (branchIndex % 2 === 0) {
            const button = createCamouflagedWallButton(
                deadEndRoom.el,
                targetsToOpen,
                window.roomSize || 10
            );

            deadEndRoom.el.appendChild(button);
        } else {
            const setup = createCamouflagedPressurePlate(
                deadEndRoom.el,
                targetsToOpen,
                window.roomSize || 10
            );

            deadEndRoom.el.appendChild(setup.plate);

            const box = createTestBox(setup.boxPosition);
            deadEndRoom.el.appendChild(box);
        }

        console.log(
            "Puzzle de deadend en",
            deadEndRoom.id,
            "abre:",
            targetsToOpen
        );
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
        if (door.hasPuzzle) continue;

        // Registrar y marcar
        usedDoors.add(door);
        door.hasPuzzle = true;
        currentRoom.puzzleDoor = door; // Mantenemos la referencia por si acaso

        const doorId = ensureDoorId(door);

        if (!doorId) {
            console.warn("Puerta sin ID, no se puede asignar puzzle:", door);
            continue;
        }

        const targetsToOpen = [doorId];


        const type = i % 4

        if (type === 0) {
            // PUZZLE DE BOTÓN
            currentRoom.el.setAttribute('puzzle-button-door', {
                doorIds: targetsToOpen.join(',')
            });
            console.log(`[Botón] Sala ${currentRoom.id} abre ${door.el.id}`);
        } 
        else if (type === 1) {
            // PUZZLE DE ORBE + PEDESTAL
            // El orbe se spawnea en la sala anterior (pathCoords[i-1])
            const prevRoomCoords = pathCoords[i-1];
            const prevRoomId = `room-${prevRoomCoords.x}-${prevRoomCoords.z}`;
            
            currentRoom.el.setAttribute('puzzle-orb-pedestal', {
                doorIds: targetsToOpen.join(','),
                prevRoomId: prevRoomId
            });
            console.log(`[Orbe] Sala ${currentRoom.id} necesita orbe de ${prevRoomId} para abrir ${door.el.id}`);
        }
        else if (type === 2) {
            currentRoom.el.setAttribute('puzzle-pressure-plate', {
                doorIds: targetsToOpen.join(',')
            });

            console.log(`[Placa] Sala ${currentRoom.id} usa caja para abrir ${door.el.id}`);
        }
        else if (type == 3){
            currentRoom.el.setAttribute('puzzle-memory-match', {
                doorIds: targetsToOpen.join(','),
                length: 4,
                showSpeed: 650
            });

            console.log(`[Memory] Sala ${currentRoom.id} usa patrón de memoria para abrir ${door.el.id}`);
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
}*/

function coordKey(coord) {
    return `${coord.x}-${coord.z}`;
}

function buildBranchesByRoot(deadEndBranches) {
    const map = new Map();

    deadEndBranches.forEach(branch => {
        if (!branch || branch.length < 2) return;

        const root = branch[0];
        const key = coordKey(root);

        if (!map.has(key)) {
            map.set(key, []);
        }

        map.get(key).push(branch);
    });

    return map;
}

function unlockBranchDoors(rooms, branch) {
    for (let i = 0; i < branch.length - 1; i++) {
        const branchDoor = getDoorBetweenCoords(
            rooms,
            branch[i],
            branch[i + 1]
        );

        if (!branchDoor) continue;

        branchDoor.isLocked = false;
        branchDoor.isOpen = true;

        if (branchDoor.el?.components?.door) {
            branchDoor.el.components.door.isLocked = false;
            branchDoor.el.components.door.isOpen = true;
        }

        if (branchDoor.el?.doorData) {
            branchDoor.el.doorData.isLocked = false;
            branchDoor.el.doorData.isOpen = true;
        }

        // Opcional: abrir visualmente la puerta de entrada al deadend
        branchDoor.el?.emit('openDoor');
    }
}

function lockDoorForPuzzle(door) {
    door.isLocked = true;
    door.isOpen = false;

    if (door.el?.components?.door) {
        door.el.components.door.isLocked = true;
        door.el.components.door.isOpen = false;
    }

    if (door.el?.doorData) {
        door.el.doorData.isLocked = true;
        door.el.doorData.isOpen = false;
    }
}

function placePuzzleForDoor(options) {
    const {
        room,
        doorIds,
        type,
        prevRoomId = null
    } = options;

    if (!room || !room.el) return;

    const targetString = doorIds.join(',');

    if (type === 'button') {
        room.el.setAttribute('puzzle-button-door', {
            doorIds: targetString
        });

        console.log(`[Puzzle botón] ${room.id} abre ${targetString}`);
    }

    else if (type === 'pressure') {
        room.el.setAttribute('puzzle-pressure-plate', {
            doorIds: targetString
        });

        console.log(`[Puzzle placa] ${room.id} abre ${targetString}`);
    }

    else if (type === 'memory') {
        room.el.setAttribute('puzzle-memory-match', {
            doorIds: targetString,
            length: 4,
            showSpeed: 650
        });

        console.log(`[Puzzle memory] ${room.id} abre ${targetString}`);
    }

    else if (type === 'orb') {
        if (!prevRoomId) {
            console.warn("Puzzle de orbe sin prevRoomId. Usando botón como fallback.");

            room.el.setAttribute('puzzle-button-door', {
                doorIds: targetString
            });

            return;
        }

        room.el.setAttribute('puzzle-orb-pedestal', {
            doorIds: targetString,
            prevRoomId: prevRoomId
        });

        console.log(`[Puzzle orbe] ${room.id} abre ${targetString}, orbe en ${prevRoomId}`);
    }
}

function getMainPuzzleType(index) {
    const types = ['button', 'pressure', 'memory', 'orb'];

    // En el primer tramo evitamos orbe porque necesita sala anterior.
    if (index === 0) {
        return types[index % 3];
    }

    return types[index % types.length];
}

function getDeadEndPuzzleType(index) {
    // Para deadends recomiendo puzzles simples y claros.
    // Orbe en deadend puede volverse confuso.
    const types = ['button', 'pressure', 'memory'];

    return types[index % types.length];
}

function addUnique(array, value) {
    if (!value) return;
    if (!array.includes(value)) array.push(value);
}

function getRoomByCoord(rooms, coord) {
    return rooms[`room-${coord.x}-${coord.z}`] || null;
}

function getPreviousRoomIdFromPathOrBranch(pathCoords, index) {
    const prev = pathCoords[index - 1];
    return prev ? `room-${prev.x}-${prev.z}` : null;
}

function lockAndGetDoorId(door) {
    if (!door) return null;

    lockDoorForPuzzle(door);

    door.hasPuzzle = true;

    return ensureDoorId(door);
}

function addPuzzleJob(jobs, room, doorIds, options = {}) {
    if (!room || !room.el) return;

    const cleanDoorIds = doorIds.filter(Boolean);
    if (cleanDoorIds.length === 0) return;

    if (!jobs.has(room.id)) {
        jobs.set(room.id, {
            room,
            doorIds: [],
            prevRoomId: options.prevRoomId || null
        });
    }

    const job = jobs.get(room.id);

    cleanDoorIds.forEach(id => addUnique(job.doorIds, id));

    if (!job.prevRoomId && options.prevRoomId) {
        job.prevRoomId = options.prevRoomId;
    }
}

function getBranchRootMap(deadEndBranches) {
    const map = new Map();

    deadEndBranches.forEach(branch => {
        if (!branch || branch.length < 2) return;

        const rootKey = coordKey(branch[0]);

        if (!map.has(rootKey)) {
            map.set(rootKey, []);
        }

        map.get(rootKey).push(branch);
    });

    return map;
}

function createFinalPuzzleTarget(room, roomSize) {
    const targetId = `final-exit-target-${room.id}`;

    if (document.getElementById(targetId)) {
        return targetId;
    }

    const target = document.createElement('a-entity');
    target.setAttribute('id', targetId);

    target.addEventListener('openDoor', () => {
        if (target.dataset.opened === 'true') return;

        target.dataset.opened = 'true';

        const trigger = document.createElement('a-cylinder');

        trigger.setAttribute('radius', '2.5');
        trigger.setAttribute('height', '0.08');
        trigger.setAttribute('position', '0 0.05 0');
        trigger.setAttribute('material', {
            color: '#00ffcc',
            opacity: 0.18,
            transparent: true
        });

        trigger.setAttribute('visible', 'false');
        trigger.setAttribute('end-room-trigger', {
            radius: 2.8
        });

        room.el.appendChild(trigger);

        console.log(`[Final] Trigger final activado en ${room.id}`);
    });

    room.el.appendChild(target);

    return targetId;
}

function assignProgressionPuzzles(rooms, mainPathCoords, deadEndBranches) {
    if (!mainPathCoords || mainPathCoords.length < 2) {
        console.warn("No hay camino principal para asignar puzzles.");
        return;
    }

    const jobs = new Map();
    const branchesByRoot = getBranchRootMap(deadEndBranches);
    const mainPathIndexByCoord = new Map();

    mainPathCoords.forEach((coord, index) => {
        mainPathIndexByCoord.set(coordKey(coord), index);
    });

    // 1. Puertas de ramas:
    // root -> branch[1], branch[1] -> branch[2], etc.
    // El último cuarto de la rama abre la siguiente puerta del camino principal.
    deadEndBranches.forEach((branch, branchIndex) => {
        if (!branch || branch.length < 2) return;

        const root = branch[0];
        const rootKey = coordKey(root);
        const rootMainIndex = mainPathIndexByCoord.get(rootKey);

        if (rootMainIndex === undefined) {
            console.warn("Rama con root fuera del camino principal:", branch);
            return;
        }

        // Cada sala de la rama abre la siguiente puerta de la rama.
        for (let i = 0; i < branch.length - 1; i++) {
            const currentCoord = branch[i];
            const nextCoord = branch[i + 1];

            const currentRoom = getRoomByCoord(rooms, currentCoord);
            const door = getDoorBetweenCoords(rooms, currentCoord, nextCoord);
            const doorId = lockAndGetDoorId(door);

            const prevRoomId = i === 0
                ? getPreviousRoomIdFromPathOrBranch(mainPathCoords, rootMainIndex)
                : `room-${branch[i - 1].x}-${branch[i - 1].z}`;

            addPuzzleJob(jobs, currentRoom, [doorId], {
                prevRoomId
            });
        }

        // El deadend abre la siguiente puerta del camino principal.
        const nextMainCoord = mainPathCoords[rootMainIndex + 1];

        if (nextMainCoord) {
            const mainDoor = getDoorBetweenCoords(rooms, root, nextMainCoord);
            const mainDoorId = lockAndGetDoorId(mainDoor);

            const deadEndCoord = branch[branch.length - 1];
            const deadEndRoom = getRoomByCoord(rooms, deadEndCoord);

            const prevBranchCoord = branch[branch.length - 2];
            const prevRoomId = `room-${prevBranchCoord.x}-${prevBranchCoord.z}`;

            addPuzzleJob(jobs, deadEndRoom, [mainDoorId], {
                prevRoomId
            });

            console.log(
                `[Deadend] ${deadEndRoom?.id} abre puerta de progresión ${mainDoorId}`
            );
        }
    });

    // 2. Puertas normales del camino principal.
    // Si una sala principal tiene rama, NO abre la siguiente puerta principal directamente:
    // primero obliga al jugador a ir al deadend.
    for (let i = 0; i < mainPathCoords.length - 1; i++) {
        const currentCoord = mainPathCoords[i];
        const nextCoord = mainPathCoords[i + 1];

        const currentRoom = getRoomByCoord(rooms, currentCoord);
        const rootKey = coordKey(currentCoord);
        const branchesFromThisRoom = branchesByRoot.get(rootKey) || [];

        if (branchesFromThisRoom.length > 0) {
            continue;
        }

        const door = getDoorBetweenCoords(rooms, currentCoord, nextCoord);
        const doorId = lockAndGetDoorId(door);

        const prevRoomId = getPreviousRoomIdFromPathOrBranch(mainPathCoords, i);

        addPuzzleJob(jobs, currentRoom, [doorId], {
            prevRoomId
        });
    }

    // 3. Puzzle final: la última habitación también tiene puzzle.
    const finalCoord = mainPathCoords[mainPathCoords.length - 1];
    const finalRoom = getRoomByCoord(rooms, finalCoord);

    if (finalRoom) {
        finalRoom.isGoal = true;

        const finalTargetId = createFinalPuzzleTarget(
            finalRoom,
            window.roomSize || 10
        );

        const prevFinalCoord = mainPathCoords[mainPathCoords.length - 2];
        const prevRoomId = prevFinalCoord
            ? `room-${prevFinalCoord.x}-${prevFinalCoord.z}`
            : null;

        addPuzzleJob(jobs, finalRoom, [finalTargetId], {
            prevRoomId
        });

        console.log("Sala final con puzzle:", finalRoom.id);
    }

    // 4. Colocar físicamente los puzzles.
    let puzzleIndex = 0;

    jobs.forEach(job => {
        const type = job.prevRoomId
            ? getMainPuzzleType(puzzleIndex)
            : getMainPuzzleType(0);

        placePuzzleForDoor({
            room: job.room,
            doorIds: job.doorIds,
            type,
            prevRoomId: job.prevRoomId
        });

        job.room.puzzle = {
            type,
            doorIds: job.doorIds
        };

        console.log(
            `[Puzzle asignado] ${job.room.id} abre ${job.doorIds.join(', ')}`
        );

        puzzleIndex++;
    });

    // 5. Debug: comprobar habitaciones reales sin puzzle.
    Object.values(rooms).forEach(room => {
        if (!room.puzzle) {
            console.warn(`[Puzzle faltante] ${room.id} no tiene puzzle asignado.`);
        }
    });
}

function rebuildGeneratedNavMesh(rooms, roomSize) {
    const scene = document.querySelector('a-scene');

    const oldNavMesh = document.querySelector('#generated-navmesh');
    if (oldNavMesh) {
        oldNavMesh.parentNode.removeChild(oldNavMesh);
    }

    const NAVMESH_DEBUG = true;

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