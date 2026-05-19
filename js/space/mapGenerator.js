function coordId(coord) {
    return `${coord.x}-${coord.z}`;
}

function parseCoordId(id) {
    const [x, z] = id.split('-').map(Number);
    return { x, z };
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