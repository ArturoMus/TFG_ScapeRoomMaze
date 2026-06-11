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
 * 
 * REVISAR MUY BIEN TODAS LSA CLASES DE ESTA CARPETA
 */


// ============================================================
// Componente principal del mapa
// ============================================================

AFRAME.registerComponent('map', {
    init: function () {

        const mapConfig = createMapConfig({
            width: 5,
            height: 5,
            start: { x: 0, z: 0 },

            seed: 1235,

            algorithm: 'dfsBacktracker',
            difficulty: 'normal',

            roomSize: 10,

            //loopChance: 0,
            mainPathStrategy: 'balanced-exploration',
            mainPathTargetRatio: 0.55,

            minMainPathLength: 8
        });

        const progressionPlan = getRandomBetaMazePlan(mapConfig);

        const roomSize = mapConfig.roomSize;

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
        
        console.log("Config:", progressionPlan.config);
        console.log("Métricas:", progressionPlan.metrics);
    }
});


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