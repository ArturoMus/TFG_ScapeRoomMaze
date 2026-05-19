/* map.js
 *
 * Reglas de diseño:
 * - El mapa empieza en room-0-0.
 * - Se genera un árbol conectado de habitaciones.
 * - La sala final es la más lejana desde el inicio.
 * - La sala final NO tiene puzzle.
 * - Toda sala no-final tiene puzzle.
 * - Una sala puede tener varias puertas.
 * - Un puzzle puede abrir una o varias puertas.
 * - Si una sala del camino principal tiene deadends, su puzzle abre la entrada a esos deadends,
 *   y el último puzzle del deadend abre la puerta principal bloqueada.
 * - Si una sala no tiene deadend, su puzzle abre la siguiente puerta de progresión.
 */


// ============================================================
// Helpers de coordenadas / aleatoriedad
// ============================================================

function coordId(coord) {
    return `${coord.x}-${coord.z}`;
}

function parseCoordId(id) {
    const [x, z] = id.split('-').map(Number);
    return { x, z };
}

function sameCoord(a, b) {
    return a.x === b.x && a.z === b.z;
}

function createSeededRandom(seed) {
    let value = Number(seed) || Date.now();

    return function () {
        value |= 0;
        value = value + 0x6D2B79F5 | 0;

        let t = Math.imul(value ^ value >>> 15, 1 | value);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;

        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

function shuffleArray(array, rng = Math.random) {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

function createFullLayout(width, height) {
    return Array.from({ length: height }, () => {
        return Array.from({ length: width }, () => 1);
    });
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


// ============================================================
// Generación del árbol del mapa
// ============================================================

function buildRandomSpanningTree(width, height, startCoord, rng = Math.random) {
    const visited = new Set();

    const parentByRoom = {};
    const childrenByRoom = {};
    const edges = new Set();

    function ensureChildren(id) {
        if (!childrenByRoom[id]) {
            childrenByRoom[id] = [];
        }
    }

    function visit(coord) {
        const currentId = coordId(coord);

        visited.add(currentId);
        ensureChildren(currentId);

        const neighbors = shuffleArray(getGridNeighbors(coord, width, height), rng);

        neighbors.forEach(neighbor => {
            const neighborId = coordId(neighbor);

            if (visited.has(neighborId)) return;

            parentByRoom[neighborId] = currentId;

            ensureChildren(currentId);
            ensureChildren(neighborId);

            childrenByRoom[currentId].push(neighborId);

            edges.add(edgeKeyFromCoords(coord, neighbor));

            visit(neighbor);
        });
    }

    visit(startCoord);

    return {
        parentByRoom,
        childrenByRoom,
        edges
    };
}

function findFarthestPathFromStart(tree, startCoord) {
    const startId = coordId(startCoord);

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

        const children = tree.childrenByRoom[current] || [];

        children.forEach(child => {
            if (visited.has(child)) return;

            visited.add(child);
            parent[child] = current;
            distance[child] = distance[current] + 1;

            queue.push(child);
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

function getRandomBetaMazePlan(config = {}) {
    const width = config.width ?? 3;
    const height = config.height ?? 3;

    const startCoord = config.start ?? { x: 0, z: 0 };

    const seed = config.seed ?? Date.now();
    const rng = createSeededRandom(seed);

    const layout = createFullLayout(width, height);

    const tree = buildRandomSpanningTree(width, height, startCoord);

    const mainPathCoords = findFarthestPathFromStart(tree, startCoord);
    const finalCoord = mainPathCoords[mainPathCoords.length - 1];

    return {
        seed,
        layout,
        width,
        height,
        startCoord,
        finalCoord,
        mainPathCoords,
        allowedConnections: tree.edges,
        tree
    };
}


// ============================================================
// Componente principal del mapa
// ============================================================

AFRAME.registerComponent('map', {
    init: function () {

        const mapSeed = Date.now();

        const progressionPlan = getRandomBetaMazePlan({
            width: 3,
            height: 3,
            start: { x: 0, z: 0 },
            seed: mapSeed
        });

        const roomSize = 10;

        const rooms = createGraph(
            progressionPlan.layout,
            progressionPlan.allowedConnections
        );

        window.rooms = rooms;
        window.roomSize = roomSize;
        window.progressionPlan = progressionPlan;
        window.mainPathCoords = progressionPlan.mainPathCoords;
        window.mapSeed = progressionPlan.seed;

        renderMap(rooms, roomSize);

        rebuildGeneratedNavMesh(rooms, roomSize);
        window.rebuildNavMesh = () => rebuildGeneratedNavMesh(rooms, roomSize);

        assignProgressionPuzzles(rooms, progressionPlan);

        if (window.debugInitMap) {
            window.debugInitMap(progressionPlan, rooms);
        }

        createEndRoomTrigger?.(
            rooms,
            progressionPlan.mainPathCoords,
            roomSize
        );

        console.log("Mapa generado");
        console.log("Inicio:", progressionPlan.startCoord);
        console.log("Final:", progressionPlan.finalCoord);
        console.log("Camino principal:", progressionPlan.mainPathCoords);
        console.log("Árbol:", progressionPlan.tree);
        console.log("Conexiones:", [...progressionPlan.allowedConnections]);
    }
});


// ============================================================
// Render de salas y puertas
// ============================================================

function renderMap(rooms, roomSize) {
    const scene = document.querySelector('a-scene');

    Object.values(rooms).forEach(room => {
        const entity = createBasicRoom(
            roomSize,
            room.id,
            `${room.x * roomSize} 0 ${room.z * roomSize}`,
            room.neighbors
        );

        scene.appendChild(entity);

        room.el = entity;
    });

    Object.values(rooms).forEach(room => {
        for (let dir in room.doors) {
            const door = room.doors[dir];

            if (!door.rendered) {
                const doorPivot = createDoor(room.el, door.direction, roomSize);

                door.el = doorPivot;
                door.el.doorData = door;
                door.rendered = true;

                doorPivot.setAttribute('id', `door-pivot-${room.id}-${dir}`);
            }
        }
    });
}


// ============================================================
// Helpers de puertas
// ============================================================

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

function lockDoorForPuzzle(door) {
    if (!door) return;

    door.hasPuzzle = true;
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


// ============================================================
// Lógica de progresión y puzzles
// ============================================================

function isRoomOnMainPath(roomShortId, mainPathCoords) {
    return mainPathCoords.some(coord => coordId(coord) === roomShortId);
}

function getMainPathIndex(roomShortId, mainPathCoords) {
    return mainPathCoords.findIndex(coord => coordId(coord) === roomShortId);
}

function getMainChildId(roomShortId, mainPathCoords) {
    const index = getMainPathIndex(roomShortId, mainPathCoords);

    if (index === -1) return null;
    if (index >= mainPathCoords.length - 1) return null;

    return coordId(mainPathCoords[index + 1]);
}

function getBranchRootInfo(roomShortId, progressionPlan) {
    const {
        tree,
        mainPathCoords
    } = progressionPlan;

    let current = roomShortId;

    while (current) {
        const parent = tree.parentByRoom[current];

        if (!parent) return null;

        const parentIsMain = isRoomOnMainPath(parent, mainPathCoords);
        const currentIsMain = isRoomOnMainPath(current, mainPathCoords);

        if (parentIsMain && !currentIsMain) {
            return {
                rootId: parent,
                firstBranchRoomId: current
            };
        }

        current = parent;
    }

    return null;
}

function getMainGateDoorForBranchRoom(rooms, roomShortId, progressionPlan) {
    const branchInfo = getBranchRootInfo(roomShortId, progressionPlan);

    if (!branchInfo) return null;

    const mainChildId = getMainChildId(
        branchInfo.rootId,
        progressionPlan.mainPathCoords
    );

    if (!mainChildId) return null;

    return getDoorBetweenCoords(
        rooms,
        parseCoordId(branchInfo.rootId),
        parseCoordId(mainChildId)
    );
}

function getDoorToChild(rooms, parentShortId, childShortId) {
    return getDoorBetweenCoords(
        rooms,
        parseCoordId(parentShortId),
        parseCoordId(childShortId)
    );
}

function getPuzzleTargetDoorsForRoom(rooms, room, progressionPlan) {
    const {
        tree,
        mainPathCoords,
        finalCoord
    } = progressionPlan;

    const roomShortId = room.id.replace('room-', '');
    const finalShortId = coordId(finalCoord);

    if (roomShortId === finalShortId) {
        return [];
    }

    const children = tree.childrenByRoom[roomShortId] || [];
    const isMain = isRoomOnMainPath(roomShortId, mainPathCoords);

    const targetDoors = [];

    if (isMain) {
        const mainChildId = getMainChildId(roomShortId, mainPathCoords);

        const branchChildren = children.filter(childId => {
            return childId !== mainChildId;
        });

        if (branchChildren.length > 0) {
            // Si hay deadends desde esta habitación, el puzzle abre las puertas hacia esos deadends.
            // La puerta principal queda bloqueada y la abrirá el último puzzle del deadend.
            branchChildren.forEach(childId => {
                const door = getDoorToChild(rooms, roomShortId, childId);

                if (door) {
                    targetDoors.push(door);
                }
            });

            if (mainChildId) {
                const mainGateDoor = getDoorToChild(rooms, roomShortId, mainChildId);

                if (mainGateDoor) {
                    lockDoorForPuzzle(mainGateDoor);
                }
            }
        } else if (mainChildId) {
            // Si no hay deadend, el puzzle abre la siguiente puerta del camino principal.
            const door = getDoorToChild(rooms, roomShortId, mainChildId);

            if (door) {
                targetDoors.push(door);
            }
        }
    } else {
        // Sala de rama/deadend.
        // Si tiene hijos, su puzzle abre esas puertas.
        if (children.length > 0) {
            children.forEach(childId => {
                const door = getDoorToChild(rooms, roomShortId, childId);

                if (door) {
                    targetDoors.push(door);
                }
            });
        } else {
            // Si es hoja/deadend, su puzzle abre la puerta principal del root de esa rama.
            const mainGateDoor = getMainGateDoorForBranchRoom(
                rooms,
                roomShortId,
                progressionPlan
            );

            if (mainGateDoor) {
                targetDoors.push(mainGateDoor);
            }
        }
    }

    return targetDoors;
}

function getPreviousRoomIdForOrb(room, progressionPlan) {
    const roomShortId = room.id.replace('room-', '');
    const parentId = progressionPlan.tree.parentByRoom[roomShortId];

    if (!parentId) return null;

    return `room-${parentId}`;
}

function choosePuzzleTypeForRoom(room, progressionPlan, puzzleIndex) {
    const prevRoomId = getPreviousRoomIdForOrb(room, progressionPlan);

    const types = ['button', 'pressure', 'memory', 'orb'];
    let type = types[puzzleIndex % types.length];

    if (type === 'orb' && !prevRoomId) {
        type = 'button';
    }

    return type;
}

function placePuzzleInRoom({ room, type, targetDoorIds, prevRoomId }) {
    const targetString = targetDoorIds.join(',');

    if (type === 'button') {
        room.el.setAttribute('puzzle-button-door', {
            doorIds: targetString
        });
    }

    else if (type === 'pressure') {
        room.el.setAttribute('puzzle-pressure-plate', {
            doorIds: targetString
        });
    }

    else if (type === 'memory') {
        room.el.setAttribute('puzzle-memory-match', {
            doorIds: targetString,
            length: 4,
            showSpeed: 650
        });
    }

    else if (type === 'orb') {
        if (!prevRoomId) {
            room.el.setAttribute('puzzle-button-door', {
                doorIds: targetString
            });

            return;
        }

        room.el.setAttribute('puzzle-orb-pedestal', {
            doorIds: targetString,
            prevRoomId: prevRoomId
        });
    }
}

function assignProgressionPuzzles(rooms, progressionPlan) {
    const finalShortId = coordId(progressionPlan.finalCoord);
    let puzzleIndex = 0;

    Object.values(rooms).forEach(room => {
        if (!room || !room.el) return;

        const roomShortId = room.id.replace('room-', '');

        if (roomShortId === finalShortId) {
            room.isGoal = true;
            console.log("Sala final sin puzzle:", room.id);
            return;
        }

        const targetDoors = getPuzzleTargetDoorsForRoom(
            rooms,
            room,
            progressionPlan
        );

        const targetDoorIds = [];

        targetDoors.forEach(door => {
            const doorId = ensureDoorId(door);

            if (!doorId) return;

            lockDoorForPuzzle(door);
            targetDoorIds.push(doorId);
        });

        if (targetDoorIds.length === 0) {
            console.warn("Habitación sin puertas objetivo para puzzle:", room.id);
            return;
        }

        const type = choosePuzzleTypeForRoom(
            room,
            progressionPlan,
            puzzleIndex
        );

        const prevRoomId = getPreviousRoomIdForOrb(room, progressionPlan);

        placePuzzleInRoom({
            room,
            type,
            targetDoorIds,
            prevRoomId
        });

        console.log(
            `[Puzzle] ${room.id} tipo ${type} abre:`,
            targetDoorIds
        );

        room.puzzle = {
            type,
            targetDoorIds: [...targetDoorIds],
            solved: false
        };

        targetDoors.forEach(door => {
            if (!door.debugPuzzleRoomIds) {
                door.debugPuzzleRoomIds = new Set();
            }

            door.debugPuzzleRoomIds.add(room.id);
        });

        puzzleIndex++;
    });

    if (window.debugSetPuzzleTotal) {
        window.debugSetPuzzleTotal(puzzleIndex);
    }
}


// ============================================================
// Trigger final
// ============================================================

function createEndRoomTrigger(rooms, pathCoords, roomSize) {
    const lastCoord = pathCoords[pathCoords.length - 1];
    const lastRoomId = `room-${lastCoord.x}-${lastCoord.z}`;
    const lastRoom = rooms[lastRoomId];

    if (!lastRoom || !lastRoom.el) {
        console.warn('No se pudo crear trigger final. Sala no encontrada:', lastRoomId);
        return;
    }

    const trigger = document.createElement('a-cylinder');

    trigger.setAttribute('radius', '2.5');
    trigger.setAttribute('height', '0.08');
    trigger.setAttribute('position', '0 0.05 0');
    trigger.setAttribute('material', {
        color: '#00ffcc',
        opacity: 0.18,
        transparent: true
    });

    // Debug:
    // trigger.setAttribute('visible', 'true');

    trigger.setAttribute('visible', 'false');

    trigger.setAttribute('end-room-trigger', {
        radius: 2.8
    });

    lastRoom.el.appendChild(trigger);

    console.log('Trigger final creado en', lastRoomId);
}


// ============================================================
// Navmesh procedural
// ============================================================

function rebuildGeneratedNavMesh(rooms, roomSize) {
    const scene = document.querySelector('a-scene');

    const oldNavMesh = document.querySelector('#generated-navmesh');
    if (oldNavMesh) {
        oldNavMesh.parentNode.removeChild(oldNavMesh);
    }

    // Deja de verde la navmesh
    const NAVMESH_DEBUG = true;

    // Sirve para que pueda ir por las habitaciones de chill
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

    // Zonas de salas
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

    // Conectores de puertas
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

    navEntity.setAttribute('nav-mesh', '');

    console.log(
        'Navmesh reconstruida:',
        vertices.length / 3,
        'vértices,',
        indices.length / 3,
        'triángulos'
    );
}