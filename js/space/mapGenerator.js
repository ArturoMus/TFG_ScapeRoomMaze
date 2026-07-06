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

function hashSeed(seed) {
    const str = String(seed);
    let h = 2166136261 >>> 0; // FNV-1a 32-bit offset basis

    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }

    return h >>> 0;
}

function createSeededRandom(seed) {
    let state = hashSeed(seed);

    console.log('[RNG init]', {
        seed,
        state
    });

    return function () {
        state = (state + 0x6D2B79F5) >>> 0;

        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function createMapConfig(options = {}) {
    return {
        width: options.width ?? 3,
        height: options.height ?? 3,

        start: options.start ?? { x: 0, z: 0 },

        seed: options.seed ?? Date.now(),

        algorithm: options.algorithm ?? 'dfsBacktracker',
        difficulty: options.difficulty ?? 'normal', // NO SE SI TERMINARÉ IMPLEMENTANDO DIFICULTAD

        roomSize: options.roomSize ?? 10,

        //loopChance: options.loopChance ?? 0, POR SI QUISIERA HACER LOOPS PERONO CREO
        minMainPathLength: options.minMainPathLength ?? 4,
        mainPathStrategy: options.mainPathStrategy ?? 'farthest',
        mainPathTargetRatio: options.mainPathTargetRatio ?? 0.6,

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

function buildDfsBacktrackerTree(width, height, startCoord, rng = Math.random) {
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

        // Esto es el core del dfs
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

// Con esto recojo todos los IDs de las salas que existen en el árbol
function getTreeRoomIds(tree) {
    const ids = new Set();

    Object.keys(tree.childrenByRoom || {}).forEach(id => {
        ids.add(id);

        const children = tree.childrenByRoom[id] || [];
        children.forEach(childId => ids.add(childId));
    });

    Object.keys(tree.parentByRoom || {}).forEach(id => {
        ids.add(id);
        ids.add(tree.parentByRoom[id]);
    });

    return [...ids];
}

// Si la sala no tiene hijos en childrenByRoom entonces es hoja
function getLeafRoomIds(tree) {
    return getTreeRoomIds(tree).filter(id => {
        const children = tree.childrenByRoom[id] || [];
        return children.length === 0;
    });
}

// Con esto construyo el camino desde el inicio hasta una sala concreta, subiendo por parentByRoom
function getPathIdsToRoom(tree, targetId) {
    const path = [];
    let current = targetId;

    while (current) {
        path.push(current);
        current = tree.parentByRoom[current];
    }

    path.reverse();

    return path;
}

// Dado un camino, cuenta cuántas salas quedarán fuera de ese camino
function getBranchStatsForPath(tree, pathIds) {
    const pathSet = new Set(pathIds);
    const allRoomIds = getTreeRoomIds(tree);

    let branchRoomCount = 0;
    const branchRoots = new Set();

    allRoomIds.forEach(roomId => {
        if (pathSet.has(roomId)) return;

        branchRoomCount++;

        const parentId = tree.parentByRoom[roomId];

        if (parentId && pathSet.has(parentId)) {
            branchRoots.add(parentId);
        }
    });

    return {
        branchRoomCount,
        branchCount: branchRoots.size
    };
}

/* Cosas que hace esta función
    - Busca todas las hojas del árbol
    - Para cada hoja calcula el camino desde el inicio
    - Calcula cuantas ramas quedarían fuera de ese camino
    - Puntua cada posible camino
    - Elige el camino más equilibrado --> longitud suficiente, ramas disponibles, salas fuera del camino principal
*/
function findBalancedExplorationPathFromStart(tree, startCoord, config = {}) {
    const startId = coordId(startCoord);
    const allRoomIds = getTreeRoomIds(tree);
    const leafIds = getLeafRoomIds(tree).filter(id => id !== startId);

    const minLength = config.minMainPathLength ?? 4;

    const targetLength = Math.max(
        minLength,
        Math.floor(allRoomIds.length * (config.mainPathTargetRatio ?? 0.6))
    );

    let bestCandidate = null;

    leafIds.forEach(leafId => {
        const pathIds = getPathIdsToRoom(tree, leafId);

        if (pathIds[0] !== startId) return;
        if (pathIds.length < minLength) return;

        const branchStats = getBranchStatsForPath(tree, pathIds);

        const distanceToTarget = Math.abs(pathIds.length - targetLength);

        const score =
            branchStats.branchCount * 4 +
            branchStats.branchRoomCount * 0.75 +
            pathIds.length * 0.25 -
            distanceToTarget * 1.5;

        const candidate = {
            leafId,
            pathIds,
            score,
            branchStats
        };

        if (!bestCandidate || candidate.score > bestCandidate.score) {
            bestCandidate = candidate;
        }
    });

    if (!bestCandidate) {
        return findFarthestPathFromStart(tree, startCoord);
    }

    return bestCandidate.pathIds.map(parseCoordId);
}

// Sirve para elegir si crear un camino balanceado o favorecer la habitación más lejana
function findMainPathFromStart(tree, startCoord, config = {}) {
    if (config.mainPathStrategy === 'balanced-exploration') {
        return findBalancedExplorationPathFromStart(tree, startCoord, config);
    }

    return findFarthestPathFromStart(tree, startCoord);
}

function getRandomBetaMazePlan(config = {}) {
    const mapConfig = createMapConfig(config);

    const width = mapConfig.width;
    const height = mapConfig.height;
    const startCoord = mapConfig.start;
    const seed = mapConfig.seed;

    const previewRng = createSeededRandom(seed);
    const preview = [
        previewRng(),
        previewRng(),
        previewRng(),
        previewRng(),
        previewRng()
    ];

    console.log('seed:', seed);
    console.log('rng preview:', preview);

    const rng = createSeededRandom(seed);

    const layout = createFullLayout(width, height);

    let tree;

    if (mapConfig.algorithm === 'dfsBacktracker') {
        tree = buildDfsBacktrackerTree(width, height, startCoord, rng);
    } else {
        console.warn(
            `[MapGenerator] Algoritmo desconocido "${mapConfig.algorithm}". Usando dfsBacktracker.`
        );

        tree = buildDfsBacktrackerTree(width, height, startCoord, rng);
    }

    const mainPathCoords = findMainPathFromStart(tree, startCoord, mapConfig);
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