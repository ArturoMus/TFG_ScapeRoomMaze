const MAP_GENERATION_CONFIG = {
    width: 5,
    height: 5,
    roomCount: 14,
    extraConnectionChance: 0.18,
    minMainPathRooms: 7,
    maxAttempts: 40
};

const CARDINAL_DIRECTIONS = [
    { name: 'north', dx: 0, dz: -1 },
    { name: 'south', dx: 0, dz: 1 },
    { name: 'east',  dx: 1, dz: 0 },
    { name: 'west',  dx: -1, dz: 0 }
];

function coordKey(coord) {
    return `${coord.x}-${coord.z}`;
}

function roomIdFromCoord(coord) {
    return `room-${coord.x}-${coord.z}`;
}

function coordFromRoomId(roomId) {
    const parts = roomId.replace('room-', '').split('-').map(Number);
    return { x: parts[0], z: parts[1] };
}

function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function shuffle(array) {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

function isInsideMap(x, z, width, height) {
    return x >= 0 && x < width && z >= 0 && z < height;
}

function getAdjacentCoords(coord, width, height) {
    return CARDINAL_DIRECTIONS
        .map(dir => ({ x: coord.x + dir.dx, z: coord.z + dir.dz }))
        .filter(next => isInsideMap(next.x, next.z, width, height));
}

function createConnectedRoomSet(width, height, roomCount) {
    const maxRooms = width * height;
    roomCount = Math.max(2, Math.min(roomCount, maxRooms));

    const selected = new Map();
    const start = { x: 0, z: 0 };
    selected.set(coordKey(start), start);

    while (selected.size < roomCount) {
        const frontier = [];
        const frontierKeys = new Set();

        selected.forEach(room => {
            getAdjacentCoords(room, width, height).forEach(next => {
                const key = coordKey(next);

                if (!selected.has(key) && !frontierKeys.has(key)) {
                    frontier.push(next);
                    frontierKeys.add(key);
                }
            });
        });

        if (frontier.length === 0) break;

        const nextRoom = pickRandom(frontier);
        selected.set(coordKey(nextRoom), nextRoom);
    }

    return selected;
}

function createLayoutFromRoomSet(roomSet, width, height) {
    const layout = Array.from({ length: height }, () => Array(width).fill(0));

    roomSet.forEach(room => {
        layout[room.z][room.x] = 1;
    });

    return layout;
}

function createRandomSpanningTree(roomSet, width, height) {
    const selectedKeys = new Set(roomSet.keys());
    const start = roomSet.get('0-0');

    const visited = new Set([coordKey(start)]);
    const stack = [start];
    const treeConnections = new Set();

    const parentById = {
        [roomIdFromCoord(start)]: null
    };

    const depthById = {
        [roomIdFromCoord(start)]: 0
    };

    const discoveryOrder = [roomIdFromCoord(start)];

    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const currentId = roomIdFromCoord(current);

        const candidates = shuffle(getAdjacentCoords(current, width, height))
            .filter(next => selectedKeys.has(coordKey(next)) && !visited.has(coordKey(next)));

        if (candidates.length === 0) {
            stack.pop();
            continue;
        }

        const next = candidates[0];
        const nextKey = coordKey(next);
        const nextId = roomIdFromCoord(next);

        visited.add(nextKey);
        stack.push(next);

        treeConnections.add(edgeKeyFromCoords(current, next));

        parentById[nextId] = currentId;
        depthById[nextId] = depthById[currentId] + 1;
        discoveryOrder.push(nextId);
    }

    return {
        treeConnections,
        parentById,
        depthById,
        discoveryOrder
    };
}

function addExtraConnections(roomSet, width, height, baseConnections, extraConnectionChance) {
    const selectedKeys = new Set(roomSet.keys());
    const allowedConnections = new Set(baseConnections);

    roomSet.forEach(room => {
        [
            { x: room.x + 1, z: room.z },
            { x: room.x, z: room.z + 1 }
        ].forEach(next => {
            if (!isInsideMap(next.x, next.z, width, height)) return;
            if (!selectedKeys.has(coordKey(next))) return;

            const edgeKey = edgeKeyFromCoords(room, next);
            if (allowedConnections.has(edgeKey)) return;

            if (Math.random() < extraConnectionChance) {
                allowedConnections.add(edgeKey);
            }
        });
    });

    return allowedConnections;
}

function getFarthestRoomId(depthById) {
    let farthestId = null;
    let farthestDepth = -1;

    Object.entries(depthById).forEach(([roomId, depth]) => {
        if (depth > farthestDepth) {
            farthestId = roomId;
            farthestDepth = depth;
        }
    });

    return farthestId;
}

function buildPathCoordsToStart(goalRoomId, parentById) {
    const path = [];
    let currentId = goalRoomId;

    while (currentId) {
        path.push(coordFromRoomId(currentId));
        currentId = parentById[currentId];
    }

    return path.reverse();
}

function generateRandomDungeon(options = {}) {
    const config = {
        ...MAP_GENERATION_CONFIG,
        ...options
    };

    let bestDungeon = null;

    for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
        const roomSet = createConnectedRoomSet(
            config.width,
            config.height,
            config.roomCount
        );

        const tree = createRandomSpanningTree(roomSet, config.width, config.height);
        const goalRoomId = getFarthestRoomId(tree.depthById);
        const mainPathCoords = buildPathCoordsToStart(goalRoomId, tree.parentById);

        const allowedConnections = addExtraConnections(
            roomSet,
            config.width,
            config.height,
            tree.treeConnections,
            config.extraConnectionChance
        );

        const dungeon = {
            layout: createLayoutFromRoomSet(roomSet, config.width, config.height),
            allowedConnections,
            treeConnections: tree.treeConnections,
            parentById: tree.parentById,
            depthById: tree.depthById,
            discoveryOrder: tree.discoveryOrder,
            mainPathCoords,
            goalRoomId
        };

        if (!bestDungeon || mainPathCoords.length > bestDungeon.mainPathCoords.length) {
            bestDungeon = dungeon;
        }

        if (mainPathCoords.length >= config.minMainPathRooms) {
            return dungeon;
        }
    }

    return bestDungeon;
}

AFRAME.registerComponent('map', {
    init: function () {
        const roomSize = 10;

        const dungeon = generateRandomDungeon();
        const rooms = createGraph(dungeon.layout, dungeon.allowedConnections);

        window.rooms = rooms;
        window.roomSize = roomSize;
        window.dungeon = dungeon;

        renderMap(rooms, roomSize);

        assignPuzzlesRandom(rooms, dungeon, roomSize);
        createEndRoomTrigger(rooms, dungeon.mainPathCoords, roomSize);

        rebuildGeneratedNavMesh(rooms, roomSize);
        window.rebuildNavMesh = () => rebuildGeneratedNavMesh(rooms, roomSize);

        console.log('Dungeon generada:', dungeon);
    }
});

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

            if (door.rendered) continue;

            const doorPivot = createDoor(room.el, door.direction, roomSize);
            doorPivot.setAttribute('id', `door-pivot-${room.id}-${dir}`);

            door.el = doorPivot;
            door.el.doorData = door;
            door.rendered = true;
        }
    });
}

function getDoorBetween(roomA, roomB) {
    for (let dir in roomA.doors) {
        if (roomA.neighbors[dir] === roomB) {
            return roomA.doors[dir];
        }
    }

    return null;
}

function getUniqueDoors(rooms) {
    const usedDoors = new Set();
    const uniqueDoors = [];

    Object.values(rooms).forEach(room => {
        Object.values(room.doors).forEach(door => {
            if (usedDoors.has(door)) return;

            usedDoors.add(door);
            uniqueDoors.push(door);
        });
    });

    return uniqueDoors;
}

function buildPuzzleTargetMap(rooms, dungeon) {
    const targetMap = new Map();
    Object.values(rooms).forEach(room => targetMap.set(room.id, new Set()));

    const assignedDoors = new Set();

    Object.entries(dungeon.parentById).forEach(([childId, parentId]) => {
        if (!parentId) return;

        const parentRoom = rooms[parentId];
        const childRoom = rooms[childId];
        if (!parentRoom || !childRoom) return;

        const door = getDoorBetween(parentRoom, childRoom);
        if (!door) return;

        targetMap.get(parentRoom.id).add(door);
        assignedDoors.add(door);
    });

    getUniqueDoors(rooms).forEach(door => {
        if (assignedDoors.has(door)) return;

        const depthA = dungeon.depthById[door.roomA.id] ?? 0;
        const depthB = dungeon.depthById[door.roomB.id] ?? 0;

        const owner = depthA <= depthB ? door.roomA : door.roomB;

        targetMap.get(owner.id).add(door);
        assignedDoors.add(door);
    });

    Object.values(rooms).forEach(room => {
        const targets = targetMap.get(room.id);

        if (targets.size > 0) return;

        const parentId = dungeon.parentById[room.id];
        const parentRoom = parentId ? rooms[parentId] : null;

        const fallbackDoor = parentRoom
            ? getDoorBetween(room, parentRoom)
            : Object.values(room.doors)[0];

        if (fallbackDoor) {
            targets.add(fallbackDoor);
        }
    });

    return targetMap;
}

function getRandomPuzzleFloorPoint(roomSize, margin = 2) {
    return {
        x: -roomSize / 2 + margin + Math.random() * (roomSize - margin * 2),
        z: -roomSize / 2 + margin + Math.random() * (roomSize - margin * 2)
    };
}

function selectPuzzleType(room, previousRoom, orderIndex) {
    if (!previousRoom) {
        return orderIndex % 2 === 0 ? 'button' : 'pressure';
    }

    const cycle = [
        'button',
        'orb-pedestal',
        'pressure',
        'button',
        'orb-pedestal',
        'pressure'
    ];

    return cycle[orderIndex % cycle.length];
}

function attachButtonPuzzle(room, targetDoorIds, roomSize) {
    const button = createCamouflagedWallButton(room.el, targetDoorIds, roomSize);
    room.el.appendChild(button);
}

function attachPressurePlatePuzzle(room, targetDoorIds, roomSize) {
    const puzzle = createCamouflagedPressurePlate(room.el, targetDoorIds, roomSize);

    room.el.appendChild(puzzle.plate);
    room.el.appendChild(createTestBox(puzzle.boxPosition));
}

function attachOrbPedestalPuzzle(room, previousRoom, targetDoorIds, roomSize) {
    if (!previousRoom) {
        attachButtonPuzzle(room, targetDoorIds, roomSize);
        return;
    }

    const targetSelector = targetDoorIds
        .map(id => id.startsWith('#') ? id : `#${id}`)
        .join(',');

    const pedestalPos = getRandomPuzzleFloorPoint(roomSize, 2.2);
    const pedestal = createPedestal(`${pedestalPos.x} 0.5 ${pedestalPos.z}`, targetSelector);

    pedestal.setAttribute('id', `${room.id}-pedestal`);
    room.el.appendChild(pedestal);

    const orbPos = getRandomPuzzleFloorPoint(roomSize, 2.2);
    const orb = createOrb(`${orbPos.x} 1.2 ${orbPos.z}`);

    orb.setAttribute('id', `${room.id}-orb-key`);
    orb.setAttribute('data-puzzle-id', targetSelector);

    previousRoom.el.appendChild(orb);

    console.log(`[Orbe] ${room.id}: orbe colocado en ${previousRoom.id}`);
}

function assignPuzzlesRandom(rooms, dungeon, roomSize) {
    const targetMap = buildPuzzleTargetMap(rooms, dungeon);

    const orderedRooms = Object.values(rooms).sort((a, b) => {
        const da = dungeon.depthById[a.id] ?? 0;
        const db = dungeon.depthById[b.id] ?? 0;

        return da - db || a.id.localeCompare(b.id);
    });

    orderedRooms.forEach((room, index) => {
        const targetDoors = [...targetMap.get(room.id)];

        const targetDoorIds = targetDoors
            .map(door => door.el?.id)
            .filter(Boolean);

        if (targetDoorIds.length === 0) {
            console.warn(`[Puzzle] ${room.id} no tiene puertas objetivo.`);
            return;
        }

        targetDoors.forEach(door => {
            door.hasPuzzle = true;
        });

        const previousRoomId = dungeon.parentById[room.id];
        const previousRoom = previousRoomId ? rooms[previousRoomId] : null;

        const type = selectPuzzleType(room, previousRoom, index);

        room.puzzle = {
            type,
            targetDoorIds,
            previousRoomId: previousRoom?.id || null
        };

        room.puzzleDoors = targetDoors;

        if (type === 'button') {
            attachButtonPuzzle(room, targetDoorIds, roomSize);
        } else if (type === 'pressure') {
            attachPressurePlatePuzzle(room, targetDoorIds, roomSize);
        } else if (type === 'orb-pedestal') {
            attachOrbPedestalPuzzle(room, previousRoom, targetDoorIds, roomSize);
        }

        console.log(
            `[Puzzle] ${room.id} (${type}) abre ${targetDoorIds.join(', ')}`
        );
    });

    const goalRoom = rooms[dungeon.goalRoomId];

    if (goalRoom) {
        goalRoom.isGoal = true;
        console.log('Sala final:', goalRoom.id);
    }
}

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

    trigger.setAttribute('visible', 'false');

    trigger.setAttribute('end-room-trigger', {
        radius: 2.8
    });

    lastRoom.el.appendChild(trigger);

    console.log('Trigger final creado en', lastRoomId);
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