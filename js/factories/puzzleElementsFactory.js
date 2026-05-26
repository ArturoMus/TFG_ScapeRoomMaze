

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

    
    button.setAttribute('material', options.material || {
        src: '#wallTex',
        repeat: '0.5 0.5',
        emissive: '#ffffff',
        emissiveIntensity: 0.3
    });


    // Configuramos el botón para que dispare el evento a la puerta que encontramos
    button.setAttribute('button', {
        event: 'openDoor',
        targets: normalizeTargetSelectors(targetSelector),
        pressOffset: options.pressOffset || { x: 0, y: 0, z: -0.05 }
    });
    
    return button;
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

    plate.setAttribute('id', `${roomId}-pressure-plate`);

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

// ---------------------------------------------------------------------------------
//                                   FUNCIONES DE LOS PUZZLES DE MEMORIA
// ---------------------------------------------------------------------------------
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
    panel.setAttribute('height', '1.55');
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
    title.setAttribute('position', '0 0.66 0.08');
    title.setAttribute('color', '#dddddd');

    puzzle.appendChild(title);

    const startButton = document.createElement('a-box');
    startButton.setAttribute('width', '1.15');
    startButton.setAttribute('height', '0.22');
    startButton.setAttribute('depth', '0.06');
    startButton.setAttribute('position', '0 -0.58 0.1');
    startButton.setAttribute('class', 'interactable');
    startButton.setAttribute('interactable', '');
    startButton.setAttribute('material', {
        color: '#3a5f8f',
        emissive: '#3a5f8f',
        emissiveIntensity: 0.08
    });

    const startText = document.createElement('a-text');
    startText.setAttribute('value', 'Mostrar patron');
    startText.setAttribute('align', 'center');
    startText.setAttribute('width', '1.8');
    startText.setAttribute('position', '0 -0.035 0.05');
    startText.setAttribute('color', '#ffffff');

    startButton.appendChild(startText);

    startButton.addEventListener('mouseenter', () => {
        startButton.setAttribute('material', 'color', '#4f7fc0');
    });

    startButton.addEventListener('mouseleave', () => {
        startButton.setAttribute('material', 'color', '#3a5f8f');
    });

    startButton.addEventListener('click', () => {
        if (options.onStartClick) {
            options.onStartClick();
        }
    });

    puzzle.appendChild(startButton);

    const pads = [];

    const padData = [
        {
            color: '#b83232',
            activeColor: '#ff5555',
            position: '-0.45 0.32 0.09'
        },
        {
            color: '#2e5aac',
            activeColor: '#5599ff',
            position: '0.45 0.32 0.09'
        },
        {
            color: '#2f8f46',
            activeColor: '#55ff77',
            position: '-0.45 -0.15 0.09'
        },
        {
            color: '#b8a132',
            activeColor: '#ffee55',
            position: '0.45 -0.15 0.09'
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
        startButton,
        startText,
        transform
    };
}