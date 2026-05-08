

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

// ---------------------------------------------------------------------------------

function normalizeTargetSelectors(targetSelectors) {
    if (!Array.isArray(targetSelectors)) {
        targetSelectors = [targetSelectors];
    }

    return targetSelectors
        .filter(Boolean)
        .map(target => {
            if (typeof target !== 'string') return null;
            return target.startsWith('#') ? target : `#${target}`;
        })
        .filter(Boolean)
        .join(',');
}

// ---------------------------------------------------------------------------------
//                                   FUNCIONES DE LAS PUERTAS
// ---------------------------------------------------------------------------------

function createDoor(room, direction, roomSize) {

    var size = roomSize / 2;

    const pivot = document.createElement('a-entity');

    pivot.setAttribute('door', `direction: ${direction}`);

    const door = document.createElement('a-box');

    door.setAttribute('class', 'interactable');
    door.setAttribute('interactable', '');
    door.setAttribute('width', '1.5');
    door.setAttribute('height', '2');
    door.setAttribute('depth', '0.2');
    door.setAttribute('color', '#6b4f3a');
    door.setAttribute('castShadow', {
        cast: true,
        receive: true
    });
    door.setAttribute('static-body', '');
    door.setAttribute('class', 'interactable ray-blocker door-blocker');

    door.setAttribute('position', '0 1 0');

    switch (direction) {
        case 'north':
            pivot.setAttribute('position', `0 0 -${size}`);
            pivot.setAttribute('rotation', '0 0 0');
            break;
        case 'south':
            pivot.setAttribute('position', `0 0 ${size}`);
            pivot.setAttribute('rotation', '0 180 0');
            break;
        case 'east':
            pivot.setAttribute('position', `${size} 0 0`);
            pivot.setAttribute('rotation', '0 90 0');
            break;
        case 'west':
            pivot.setAttribute('position', `-${size} 0 0`);
            pivot.setAttribute('rotation', '0 -90 0');
            break;
    }

    pivot.appendChild(door);
    room.appendChild(pivot);

    const isZ = direction === 'north' || direction === 'south';
    
    /*const collider={
        el: pivot,
        width: isZ ? 1 : 0.2,
        depth: isZ ? 0.2 : 1,
        disabled: false,
    }
    colliders.push(collider);
    
    pivot.colliderRef = collider;*/

    return pivot;
}
// ---------------------------------------------------------------------------------


// ---------------------------------------------------------------------------------
//                                   FUNCIONES DE LOS BOTONES
// ---------------------------------------------------------------------------------
function createButton(position, targetSelector, room, options ={}) {

    const button = document.createElement('a-box');
    button.setAttribute('id', room.getAttribute('id') + '-button');

    button.setAttribute('position', position);
    button.setAttribute('width', options.width ?? 0.35);
    button.setAttribute('height', options.height ?? 0.35);
    button.setAttribute('depth', options.depth ?? 0.08);

    button.setAttribute('class', 'interactable');
    button.setAttribute('interactable', '');

    button.setAttribute('static-body', '');
    
    button.setAttribute('material', options.material || {
        src: '#wallTex',
        repeat: '0.5 0.5',
        emissive: '#ffffff',
        emissiveIntensity: 0.3
    });

    button.setAttribute('shadow', {
        cast: true,
        receive: true
    });

    // Configuramos el botón para que dispare el evento a la puerta que encontramos
    button.setAttribute('button', {
        event: 'openDoor',
        targets: normalizeTargetSelectors(targetSelector),
        pressOffset: options.pressOffset || { x: 0, y: 0, z: -0.05 }
    });
    
    return button;
}

// POR SI QUIERO HACER LA HITBOX DEL BOTÓN MAS GRANDE
// ----> Así para cambiar el color del botón he de cambiar el método interact
function createButtonWithHitbox(position, targetSelector, room) {

    const wrapper = document.createElement('a-entity');
    wrapper.setAttribute('position', position);


    const button = document.createElement('a-box');
    
    button.setAttribute('depth', '0.2');
    button.setAttribute('height', '0.3');
    button.setAttribute('width', '0.3');
    button.setAttribute('color', 'red');
    
    wrapper.appendChild(button);

    const hitbox = document.createElement('a-box');
    hitbox.setAttribute('depth', '0.6');
    hitbox.setAttribute('height', '0.6');
    hitbox.setAttribute('width', '0.6');

    hitbox.setAttribute('visible', false);
    hitbox.setAttribute('static-body', '');
    
    // Configuramos el botón para que dispare el evento a la puerta que encontramos
    hitbox.setAttribute('button', {
        event: 'openDoor',
        target: '#' + targetSelector
    });

    wrapper.appendChild(hitbox);

    wrapper.setAttribute('id', room.getAttribute('id') + '-button');
    
    return wrapper;
}

function createCamouflagedWallButton(room, targetSelector, roomSize = 10) {
    const roomId = room.getAttribute('id');
    const roomData = window.rooms?.[roomId];

    const neighbors = roomData?.neighbors || {};

    const allDirections = ['north', 'south', 'east', 'west'];

    // Selecciono preferiblemente paredes sin huecos, para evitar problemas
    const solidWalls = allDirections.filter(dir => !neighbors[dir]);
    const possibleWalls = solidWalls.length > 0 ? solidWalls : allDirections;

    const direction = randomChoice(possibleWalls);
    const hasDoor = !!neighbors[direction];

    const half = roomSize / 2;
    const wallInnerFace = half - 0.1;
    const buttonDepth = 0.08;

    const lateral = randomWallLateral(hasDoor, roomSize);
    const y = randomRange(1.1, 2.3);

    const material = {
        src: '#wallTex',
        repeat: '0.45 0.45',
        emissive: '#9b9b9b',
        emissiveIntensity: 0.005
    };

    let position;
    let width;
    let height = 0.35;
    let depth;
    let pressOffset;

    switch (direction) {
        case 'north':
            position = `${lateral} ${y} ${-wallInnerFace + buttonDepth / 2}`;
            width = 0.35;
            depth = buttonDepth;
            pressOffset = { x: 0, y: 0, z: -0.05 };
            break;

        case 'south':
            position = `${lateral} ${y} ${wallInnerFace - buttonDepth / 2}`;
            width = 0.35;
            depth = buttonDepth;
            pressOffset = { x: 0, y: 0, z: 0.05 };
            break;

        case 'east':
            position = `${wallInnerFace - buttonDepth / 2} ${y} ${lateral}`;
            width = buttonDepth;
            depth = 0.35;
            pressOffset = { x: 0.05, y: 0, z: 0 };
            break;

        case 'west':
            position = `${-wallInnerFace + buttonDepth / 2} ${y} ${lateral}`;
            width = buttonDepth;
            depth = 0.35;
            pressOffset = { x: -0.05, y: 0, z: 0 };
            break;
    }

    const button = createButton(position, targetSelector, room, {
        width,
        height,
        depth,
        material,
        pressOffset
    });

    console.log(`Botón camuflado en ${roomId}, pared ${direction}, posición ${position}`);

    return button;
}
// ---------------------------------------------------------------------------------


// ---------------------------------------------------------------------------------
//                                   FUNCIONES DE LAS ANTORCHAS
// ---------------------------------------------------------------------------------
function createTorch(position) {

    const torch = document.createElement('a-entity');
    torch.setAttribute('position', position);

    // Estructura antorcha
    const stick = document.createElement('a-cylinder');
    stick.setAttribute('height', '1');
    stick.setAttribute('radius', '0.05');
    stick.setAttribute('color', '#5a3e2b');
    torch.appendChild(stick);
    const flame = document.createElement('a-sphere');
    flame.setAttribute('radius', '0.2');
    flame.setAttribute('position', '0 0.6 0');
    flame.setAttribute('material', {
        shader: 'flat',
        src: '#fireballEmissive',
        color: '#ffffff',
        blending: 'additive',
        fog: false
    });
    flame.setAttribute('animation', {
        property: 'scale',
        dir: 'alternate',
        dur: 1000,
        loop: true,
        to: '1.2 1.4 1.2'
    });
    /*flame.setAttribute('sound', {
        src: '#fireTorch',
        autoplay: true
    });*/

    torch.appendChild(flame);

    // luz
    const light = document.createElement('a-entity');
    light.setAttribute('light', {
        type: 'point',
        color: '#ffcc88',
        intensity: 1.2,
        distance: 6,
        decay: 2,
        castShadow: false,
    });

    light.setAttribute('animation', {
        property: 'light.intensity',
        dir: 'alternate',
        dur: 1000,
        loop: true,
        to: 2.5
    });

    light.setAttribute('position', '0 1 0');

    torch.appendChild(light);

    return torch;
}

// ---------------------------------------------------------------------------------
//                                   FUNCIONES DE LOS ORBES
// ---------------------------------------------------------------------------------

function createOrb(position) {
    const orb = document.createElement('a-sphere');
    orb.setAttribute('position', position);
    orb.setAttribute('radius', '0.2');
    orb.setAttribute('color', '#00ffff');
    orb.setAttribute('material', 'emissive: #00ffff; emissiveIntensity: 0.5');
    orb.setAttribute('dynamic-body', {
        mass: 1,
        shape: 'sphere',
        linearDamping: 0.4,
        angularDamping: 0.4
    })
    orb.setAttribute('orb', ''); // Añade el componente
    orb.setAttribute('class', 'grabbable');
    return orb;
}
// ---------------------------------------------------------------------------------


// ---------------------------------------------------------------------------------
//                                   FUNCIONES DE LOS PEDESTALES
// ---------------------------------------------------------------------------------

function createPedestal(position, doorSelector, options = {}) {

    const base = document.createElement('a-cylinder');

    base.setAttribute('position', position);
    base.setAttribute('radius', '0.3');
    base.setAttribute('height', '1');
    base.setAttribute('color', '#444');
    base.setAttribute('static-body', '');

    base.setAttribute('class', 'interactable');
    base.setAttribute('interactable', '');

    const targets = normalizeTargetSelectors(doorSelector);
    const puzzleID = options.puzzleID || getFirstTargetId(doorSelector);

    base.setAttribute('pedestal', {
        targets: targets,
        puzzleID: puzzleID
    });

    return base;
}
// ---------------------------------------------------------------------------------


// ---------------------------------------------------------------------------------
//                                   FUNCIONES DE LAS PLACAS DE PRESIÓN
// ---------------------------------------------------------------------------------
function createPressurePlate(position, doorSelector, options={}) {

    const plate = document.createElement('a-box');
    plate.setAttribute('position', position);
    plate.setAttribute('width', options.width ?? 1.2);
    plate.setAttribute('height', options.height ?? 0.2);
    plate.setAttribute('depth', options.depth ?? 1.2);
    
    plate.setAttribute('material', options.material || {
        src: '#floorTex',
        repeat: '0.6 0.6',
    });

    plate.setAttribute('shadow', {
        cast: true,
        receive: true
    });

    //plate.setAttribute('static-body', '');
    
    plate.setAttribute('pressure-plate', {
        targets: normalizeTargetSelectors(doorSelector),
        pressDepth: options.pressDepth ?? 0.025
    });
    return plate;
}

function createCamouflagedPressurePlate(room, doorSelector, roomSize = 10) {
    const margin = 1.8;

    const platePos = randomFloorPoint(roomSize, margin);

    const plate = createPressurePlate(`${platePos.x} 0.2 ${platePos.z}`, doorSelector, {
        width: 1.2,
        height: 0.08,
        depth: 1.2,
        pressDepth: 0.025,
        material: {
            src: '#floorTex',
            repeat: '0.6 0.6',
        }
    });

    const boxPos = getObjectSpawnAwayFromPoint(platePos, roomSize, {
        margin: 1.8,
        minDistance: 2.4
    });

    console.log(
        `Placa camuflada en ${room.getAttribute('id')}, posición ${platePos.x.toFixed(2)} ${platePos.z.toFixed(2)}`
    );

    console.log(
        `Spawn de la caja en posición ${boxPos.x.toFixed(2)} ${boxPos.z.toFixed(2)}`
    );

    return {
        plate,
        boxPosition: `${boxPos.x} 0.7 ${boxPos.z}`
    };
}
// ---------------------------------------------------------------------------------

function createTestBox(position) {
    const box = document.createElement('a-box');
    box.setAttribute('position', position);

    box.setAttribute('width', '0.5');
    box.setAttribute('height', '0.5');
    box.setAttribute('depth', '0.5');

    box.setAttribute('color', '#FF00FF');

    box.setAttribute('box', '');
    box.setAttribute('class', 'grabbable');

    box.setAttribute('dynamic-body', {
        mass: 1,
        shape: 'box',
        linearDamping: 0.15,
        angularDamping: 0.4
    });

    return box;
}


function getMemoryPuzzleWallTransform(room, roomSize = 10) {
    const roomId = room.getAttribute('id');
    const roomData = window.rooms?.[roomId];
    const neighbors = roomData?.neighbors || {};

    const allDirections = ['north', 'south', 'east', 'west'];

    // Preferimos paredes sin puerta.
    const solidWalls = allDirections.filter(dir => !neighbors[dir]);
    const possibleWalls = solidWalls.length > 0 ? solidWalls : allDirections;

    const direction = randomChoice(possibleWalls);
    const hasDoor = !!neighbors[direction];

    const half = roomSize / 2;
    const wallInnerFace = half - 0.14;

    const lateral = randomWallLateral(hasDoor, roomSize);

    switch (direction) {
        case 'north':
            return {
                direction,
                position: `${lateral} 1.55 ${-wallInnerFace}`,
                rotation: '0 0 0'
            };

        case 'south':
            return {
                direction,
                position: `${lateral} 1.55 ${wallInnerFace}`,
                rotation: '0 180 0'
            };

        case 'east':
            return {
                direction,
                position: `${wallInnerFace} 1.55 ${lateral}`,
                rotation: '0 -90 0'
            };

        case 'west':
            return {
                direction,
                position: `${-wallInnerFace} 1.55 ${lateral}`,
                rotation: '0 90 0'
            };
    }
}

function createMemoryPuzzlePanel(room, roomSize = 10, options = {}) {
    const transform = getMemoryPuzzleWallTransform(room, roomSize);

    const puzzle = document.createElement('a-entity');
    puzzle.setAttribute('position', transform.position);
    puzzle.setAttribute('rotation', transform.rotation);

    const panel = document.createElement('a-box');
    panel.setAttribute('width', '2');
    panel.setAttribute('height', '1.25');
    panel.setAttribute('depth', '0.08');
    panel.setAttribute('position', '0 0 0');
    panel.setAttribute('material', {
        color: '#222222',
        opacity: 0.9
    });
    panel.setAttribute('class', 'ray-blocker');

    puzzle.appendChild(panel);

    const title = document.createElement('a-text');
    title.setAttribute('value', 'Memoriza el patron');
    title.setAttribute('align', 'center');
    title.setAttribute('width', '2.4');
    title.setAttribute('position', '0 0.46 0.08');
    title.setAttribute('color', '#dddddd');

    puzzle.appendChild(title);

    const pads = [];

    const padData = [
        {
            color: '#b83232',
            activeColor: '#ff5555',
            position: '-0.45 0.12 0.09'
        },
        {
            color: '#2e5aac',
            activeColor: '#5599ff',
            position: '0.45 0.12 0.09'
        },
        {
            color: '#2f8f46',
            activeColor: '#55ff77',
            position: '-0.45 -0.35 0.09'
        },
        {
            color: '#b8a132',
            activeColor: '#ffee55',
            position: '0.45 -0.35 0.09'
        }
    ];

    padData.forEach((data, index) => {
        const pad = document.createElement('a-box');

        pad.setAttribute('width', '0.42');
        pad.setAttribute('height', '0.32');
        pad.setAttribute('depth', '0.08');
        pad.setAttribute('position', data.position);

        pad.setAttribute('class', 'interactable');
        pad.setAttribute('interactable', '');

        pad.setAttribute('material', {
            color: data.color,
            emissive: data.color,
            emissiveIntensity: 0.05
        });

        pad.dataset.index = index;
        pad.baseColor = data.color;
        pad.activeColor = data.activeColor;

        pad.addEventListener('mouseenter', () => {
            if (options.canHover && !options.canHover()) return;
            pad.setAttribute('scale', '1.08 1.08 1.08');
        });

        pad.addEventListener('mouseleave', () => {
            pad.setAttribute('scale', '1 1 1');
        });

        pad.addEventListener('click', () => {
            if (options.onPadClick) {
                options.onPadClick(index);
            }
        });

        pads.push(pad);
        puzzle.appendChild(pad);
    });

    room.appendChild(puzzle);

    console.log(
        `[Memory] Puzzle creado en ${room.getAttribute('id')}, pared ${transform.direction}`
    );

    return {
        puzzle,
        pads,
        transform
    };
}


