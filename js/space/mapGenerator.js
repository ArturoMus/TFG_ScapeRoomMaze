function coordId(coord) {
    return `${coord.x}-${coord.z}`;
}

function parseCoordId(id) {
    const [x, z] = id.split('-').map(Number);
    return { x, z };
}

function shuffleArray(array, rng = Math.random) {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
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

function createMapConfig(options = {}) {
    return {
        width: options.width ?? 3,
        height: options.height ?? 3,

        start: options.start ?? { x: 0, z: 0 },

        seed: options.seed ?? Date.now(),

        algorithm: options.algorithm ?? 'spanning-tree',
        difficulty: options.difficulty ?? 'normal', // NO SE SI TERMINARÉ IMPLEMENTANDO DIFICULTAD

        roomSize: options.roomSize ?? 10,

        //loopChance: options.loopChance ?? 0, POR SI QUISIERA HACER LOOPS PERONO CREO
        minMainPathLength: options.minMainPathLength ?? 4,
        maxGenerationAttempts: options.maxGenerationAttempts ?? 30
    };
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

function calculateMapMetrics(progressionPlan) {
    const tree = progressionPlan.tree;
    const mainPathCoords = progressionPlan.mainPathCoords;

    const allRoomIds = new Set();

    Object.keys(tree.childrenByRoom).forEach(id => {
        allRoomIds.add(id);

        const children = tree.childrenByRoom[id] || [];
        children.forEach(child => allRoomIds.add(child));
    });

    const mainPathIds = new Set(mainPathCoords.map(coordId));

    const branchRoomIds = [...allRoomIds].filter(id => {
        return !mainPathIds.has(id);
    });

    const deadEndIds = [...allRoomIds].filter(id => {
        const children = tree.childrenByRoom[id] || [];
        return children.length === 0 && !mainPathIds.has(id);
    });

    const branchRoots = new Set();

    branchRoomIds.forEach(roomId => {
        const parentId = tree.parentByRoom[roomId];

        if (parentId && mainPathIds.has(parentId)) {
            branchRoots.add(parentId);
        }
    });

    return {
        algorithm: progressionPlan.algorithm,
        difficulty: progressionPlan.difficulty,

        roomCount: allRoomIds.size,
        doorCount: progressionPlan.allowedConnections.size,

        mainPathLength: mainPathCoords.length,
        branchRoomCount: branchRoomIds.length,
        branchCount: branchRoots.size,
        deadEndCount: deadEndIds.length,

        loopCount: 0
    };
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
    
    const mapConfig = createMapConfig(config);

    const width = mapConfig.width;
    const height = mapConfig.height;
    const startCoord = mapConfig.start;
    const seed = mapConfig.seed;

    const rng = createSeededRandom(seed);

    const layout = createFullLayout(width, height);

    let tree;

    if (mapConfig.algorithm === 'spanning-tree') {
        tree = buildRandomSpanningTree(width, height, startCoord, rng);
    } else {
        console.warn(
            `[MapGenerator] Algoritmo desconocido "${mapConfig.algorithm}". Usando spanning-tree.`
        );

        tree = buildRandomSpanningTree(width, height, startCoord, rng);
    }

    const mainPathCoords = findFarthestPathFromStart(tree, startCoord);
    const finalCoord = mainPathCoords[mainPathCoords.length - 1];

    const progressionPlan = {
        seed,
        algorithm: mapConfig.algorithm,
        difficulty: mapConfig.difficulty,

        config: mapConfig,

        layout,
        width,
        height,
        startCoord,
        finalCoord,
        mainPathCoords,

        allowedConnections: tree.edges,
        tree
    };

    progressionPlan.metrics = calculateMapMetrics(progressionPlan);

    return progressionPlan;
}