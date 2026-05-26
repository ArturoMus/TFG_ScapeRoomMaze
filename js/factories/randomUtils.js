// ---------------------------------------------------------------------------------
//                                   FUNCIONES DE GENERACIONES ALEATORIAS
// ---------------------------------------------------------------------------------

// Estas funciones las uso para crear los elementos en posiciones aleatorias relativas de las salas

function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function randomWallLateral(hasDoor, roomSize) {
    const max = roomSize / 2 - 1.2;

    // Si la pared tiene puerta, evito el centro para no poner el botón en el hueco.
    if (hasDoor) {
        const sign = Math.random() < 0.5 ? -1 : 1;
        return sign * randomRange(1.4, max);
    }

    return randomRange(-max, max);
}

function randomFloorPoint(roomSize, margin = 1.8) {
    return {
        x: randomRange(-roomSize / 2 + margin, roomSize / 2 - margin),
        z: randomRange(-roomSize / 2 + margin, roomSize / 2 - margin)
    };
}

function distanceXZ(a, b) {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
}

function getObjectSpawnAwayFromPoint(origin, roomSize, options = {}) {
    const margin = options.margin ?? 1.8;
    const minDistance = options.minDistance ?? 2.2;

    // Intento varias posiciones aleatorias.
    for (let i = 0; i < 40; i++) {
        const candidate = randomFloorPoint(roomSize, margin);

        if (distanceXZ(candidate, origin) >= minDistance) {
            return candidate;
        }
    }

    // Fallback: elegir la esquina más lejana dentro de la sala.
    const limit = roomSize / 2 - margin;

    const corners = [
        { x: -limit, z: -limit },
        { x:  limit, z: -limit },
        { x: -limit, z:  limit },
        { x:  limit, z:  limit }
    ];

    corners.sort((a, b) => distanceXZ(b, origin) - distanceXZ(a, origin));

    return corners[0];
}