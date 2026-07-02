

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
//                                   FUNCIONES PARA LOS ONJETOS EN PAREDES
// ---------------------------------------------------------------------------------

function getRoomWallReservations(room) {
    const roomId = room.getAttribute('id');
    const roomData = window.rooms?.[roomId];

    if (!roomData) return [];

    if (!roomData.wallReservations) {
        roomData.wallReservations = [];
    }

    return roomData.wallReservations;
}

function isWallSlotFree(room, slot) {
    const reservations = getRoomWallReservations(room);

    return !reservations.some(existing => {
        if (existing.direction !== slot.direction) return false;

        const lateralDistance = Math.abs(existing.lateral - slot.lateral);
        const verticalDistance = Math.abs(existing.y - slot.y);

        const minDistance = (existing.radius ?? 0.8) + (slot.radius ?? 0.8);

        return lateralDistance < minDistance && verticalDistance < minDistance * 0.7;
    });
}

function reserveWallSlot(room, slot) {
    const reservations = getRoomWallReservations(room);

    reservations.push({
        direction: slot.direction,
        lateral: slot.lateral,
        y: slot.y,
        radius: slot.radius ?? 0.8,
        label: slot.label || 'unknown'
    });
}

function getWallTransformFromSlot(direction, lateral, y, roomSize = 10, depthOffset = 0.14) {
    const half = roomSize / 2;
    const wallInnerFace = half - depthOffset;

    switch (direction) {
        case 'north':
            return {
                direction,
                lateral,
                y,
                position: `${lateral} ${y} ${-wallInnerFace}`,
                rotation: '0 0 0'
            };

        case 'south':
            return {
                direction,
                lateral,
                y,
                position: `${lateral} ${y} ${wallInnerFace}`,
                rotation: '0 180 0'
            };

        case 'east':
            return {
                direction,
                lateral,
                y,
                position: `${wallInnerFace} ${y} ${lateral}`,
                rotation: '0 -90 0'
            };

        case 'west':
            return {
                direction,
                lateral,
                y,
                position: `${-wallInnerFace} ${y} ${lateral}`,
                rotation: '0 90 0'
            };
    }
}

function getReservedWallTransform(room, roomSize = 10, options = {}) {
    const roomId = room.getAttribute('id');
    const roomData = window.rooms?.[roomId];
    const neighbors = roomData?.neighbors || {};

    const excludedDirection = options.excludedDirection || null;
    const radius = options.radius ?? 0.9;
    const label = options.label || 'wall-object';
    const depthOffset = options.depthOffset ?? 0.14;

    const allDirections = ['north', 'south', 'east', 'west'];

    const solidWalls = allDirections.filter(dir => {
        return !neighbors[dir] && dir !== excludedDirection;
    });

    const possibleWalls = solidWalls.length > 0
        ? solidWalls
        : allDirections.filter(dir => dir !== excludedDirection);

    const directionsToTry = shuffleArray(
        possibleWalls.length > 0 ? possibleWalls : allDirections,
        Math.random
    );

    for (let attempt = 0; attempt < 30; attempt++) {
        const direction = directionsToTry[attempt % directionsToTry.length];
        const hasDoor = !!neighbors[direction];

        const lateral = randomWallLateral(hasDoor, roomSize);
        const y = randomRange(options.minY ?? 1.1, options.maxY ?? 2.2);

        const slot = {
            direction,
            lateral,
            y,
            radius,
            label
        };

        if (isWallSlotFree(room, slot)) {
            reserveWallSlot(room, slot);

            return getWallTransformFromSlot(
                direction,
                lateral,
                y,
                roomSize,
                depthOffset
            );
        }
    }

    console.warn(`[WallSlots] No se encontró hueco libre en ${roomId}. Usando fallback.`);

    const fallbackDirection = directionsToTry[0] || 'north';
    const fallbackHasDoor = !!neighbors[fallbackDirection];

    const fallbackLateral = randomWallLateral(fallbackHasDoor, roomSize);
    const fallbackY = randomRange(options.minY ?? 1.1, options.maxY ?? 2.2);

    const fallbackSlot = {
        direction: fallbackDirection,
        lateral: fallbackLateral,
        y: fallbackY,
        radius,
        label
    };

    reserveWallSlot(room, fallbackSlot);

    return getWallTransformFromSlot(
        fallbackDirection,
        fallbackLateral,
        fallbackY,
        roomSize,
        depthOffset
    );
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

    const transform = getReservedWallTransform(room, roomSize, {
        label: 'camouflaged-button',
        radius: 0.55,
        minY: 1.1,
        maxY: 2.3,
        depthOffset: 0.1
    });

    const direction = transform.direction;
    const lateral = transform.lateral;
    const y = transform.y;

    const half = roomSize / 2;
    const wallInnerFace = half - 0.1;
    const buttonDepth = 0.08;

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

    base.setAttribute('id', options.id);
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

    const plate = createPressurePlate(`${platePos.x} 0.05 ${platePos.z}`, doorSelector, {
        width: 1.2,
        height: 0.08,
        depth: 1.2,
        pressDepth: 0.025,
        material: {
            src: '#floorTex',
            repeat: '0.6 0.6',
        }
    });

    const roomId = room.getAttribute('id');
    plate.setAttribute('id', `${roomId}-pressure-plate`);

    const boxPos = getObjectSpawnAwayFromPoint(platePos, roomSize, {
        margin: 1.8,
        minDistance: 2.4
    });

    console.log(
        `Placa camuflada en ${roomId}, posición ${platePos.x.toFixed(2)} ${platePos.z.toFixed(2)}`
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
    return getReservedWallTransform(room, roomSize, {
        label: 'memory-panel',
        radius: 1.25,
        minY: 1.55,
        maxY: 1.55,
        depthOffset: 0.14
    });
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
            src: '#fireballTex',
            position: '-0.45 0.32 0.09'
        },
        {
            color: '#2e5aac',
            activeColor: '#5599ff',
            src: '#iceTex',
            position: '0.45 0.32 0.09'
        },
        {
            color: '#2f8f46',
            activeColor: '#55ff77',
            src: '#grassTex',
            position: '-0.45 -0.15 0.09'
        },
        {
            color: '#b8a132',
            activeColor: '#ffee55',
            src: '#earthTex',
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
            color: '#ffffff',
            src: data.src,
            repeat: '2 2',
            emissive: data.color,
            emissiveIntensity: 0.04,
            roughness: 0.8,
            metalness: 0
        });

        pad.dataset.index = index;
        pad.baseColor = data.color;
        pad.activeColor = data.activeColor;
        pad.textureSrc = data.src;

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
// ---------------------------------------------------------------------------------


// ---------------------------------------------------------------------------------
//                              FUNCIONES DEL PUZZLE DE PALANCAS
// ---------------------------------------------------------------------------------

function getLeverPuzzleWallTransform(room, roomSize = 10, excludedDirection = null) {
    return getReservedWallTransform(room, roomSize, {
        label: 'lever-panel',
        radius: 1.35,
        minY: 1.55,
        maxY: 1.55,
        excludedDirection,
        depthOffset: 0.14
    });
}

function formatLeverHint(solution) {
    const labels = ['I', 'II', 'III', 'IV', 'V', 'VI'];

    return solution
        .map((value, index) => {
            const label = labels[index] || String(index + 1);
            return `${label} ${value ? 't' : 'f'}`;
        })
        .join('   ');
}

function setLeverVisual(leverHandle, isOn) {
    leverHandle.setAttribute('rotation', isOn ? '-35 0 0' : '35 0 0');

    leverHandle.setAttribute('material', {
        color: isOn ? '#3f8f5f' : '#8f3f3f',
        emissive: isOn ? '#3f8f5f' : '#8f3f3f',
        emissiveIntensity: 0.12
    });
}

function createLeverPuzzlePanel(room, roomSize = 10, options = {}) {
    const solution = options.solution || [true, false, true, false];

    const transform = getLeverPuzzleWallTransform(room, roomSize);

    const puzzle = document.createElement('a-entity');
    puzzle.setAttribute('position', transform.position);
    puzzle.setAttribute('rotation', transform.rotation);

    const panel = document.createElement('a-box');
    panel.setAttribute('width', '2.3');
    panel.setAttribute('height', '1.45');
    panel.setAttribute('depth', '0.08');
    panel.setAttribute('position', '0 0 0');
    panel.setAttribute('material', {
        color: '#222222',
        opacity: 0.92
    });
    panel.setAttribute('class', 'ray-blocker');

    puzzle.appendChild(panel);

    const title = document.createElement('a-text');
    title.setAttribute('value', 'Ajusta las palancas');
    title.setAttribute('align', 'center');
    title.setAttribute('width', '2.5');
    title.setAttribute('position', '0 0.58 0.08');
    title.setAttribute('color', '#dddddd');

    puzzle.appendChild(title);

    const leverHandles = [];
    const labels = ['I', 'II', 'III', 'IV', 'V', 'VI'];

    const spacing = 0.42;
    const startX = -((solution.length - 1) * spacing) / 2;

    solution.forEach((_, index) => {
        const x = startX + index * spacing;

        const leverRoot = document.createElement('a-entity');
        leverRoot.setAttribute('position', `${x} 0.12 0.12`);

        const label = document.createElement('a-text');
        label.setAttribute('value', labels[index] || String(index + 1));
        label.setAttribute('align', 'center');
        label.setAttribute('width', '1');
        label.setAttribute('position', '0 0.35 0.04');
        label.setAttribute('color', '#ffffff');

        leverRoot.appendChild(label);

        const base = document.createElement('a-box');
        base.setAttribute('width', '0.18');
        base.setAttribute('height', '0.14');
        base.setAttribute('depth', '0.08');
        base.setAttribute('position', '0 -0.08 0');
        base.setAttribute('material', {
            color: '#555555'
        });

        leverRoot.appendChild(base);

        const handle = document.createElement('a-box');
        handle.setAttribute('id', `${room.getAttribute('id')}-lever-${index}`);
        handle.setAttribute('width', '0.08');
        handle.setAttribute('height', '0.46');
        handle.setAttribute('depth', '0.08');
        handle.setAttribute('position', '0 0.05 0.06');

        handle.setAttribute('class', 'interactable');
        handle.setAttribute('interactable', '');

        handle.addEventListener('mouseenter', () => {
            handle.setAttribute('scale', '1.08 1.08 1.08');
        });

        handle.addEventListener('mouseleave', () => {
            handle.setAttribute('scale', '1 1 1');
        });

        handle.addEventListener('click', () => {
            if (options.onLeverToggle) {
                options.onLeverToggle(index);
            }
        });

        setLeverVisual(handle, false);

        leverRoot.appendChild(handle);

        leverHandles.push(handle);
        puzzle.appendChild(leverRoot);
    });

    const checkButton = document.createElement('a-box');
    checkButton.setAttribute('id', `${room.getAttribute('id')}-lever-check`);
    checkButton.setAttribute('width', '1.15');
    checkButton.setAttribute('height', '0.22');
    checkButton.setAttribute('depth', '0.06');
    checkButton.setAttribute('position', '0 -0.52 0.1');
    checkButton.setAttribute('class', 'interactable');
    checkButton.setAttribute('interactable', '');
    checkButton.setAttribute('material', {
        color: '#3a5f8f',
        emissive: '#3a5f8f',
        emissiveIntensity: 0.08
    });

    const checkText = document.createElement('a-text');
    checkText.setAttribute('value', 'Comprobar');
    checkText.setAttribute('align', 'center');
    checkText.setAttribute('width', '1.8');
    checkText.setAttribute('position', '0 -0.035 0.05');
    checkText.setAttribute('color', '#ffffff');

    checkButton.appendChild(checkText);

    checkButton.addEventListener('mouseenter', () => {
        checkButton.setAttribute('material', 'color', '#4f7fc0');
    });

    checkButton.addEventListener('mouseleave', () => {
        checkButton.setAttribute('material', 'color', '#3a5f8f');
    });

    checkButton.addEventListener('click', () => {
        if (options.onCheckClick) {
            options.onCheckClick();
        }
    });

    puzzle.appendChild(checkButton);

    room.appendChild(puzzle);

    const hintTransform = getLeverPuzzleWallTransform(
        room,
        roomSize,
        transform.direction
    );

    const hint = document.createElement('a-entity');
    hint.setAttribute('position', hintTransform.position);
    hint.setAttribute('rotation', hintTransform.rotation);

    const hintText = document.createElement('a-text');
    hintText.setAttribute('value', formatLeverHint(solution));
    hintText.setAttribute('align', 'center');
    hintText.setAttribute('width', '2.5');
    hintText.setAttribute('position', '0 0 0.08');
    hintText.setAttribute('color', '#777777');

    hint.appendChild(hintText);
    room.appendChild(hint);

    console.log(
        `[Levers] Puzzle creado en ${room.getAttribute('id')}, panel en pared ${transform.direction}, pista en pared ${hintTransform.direction}`
    );

    return {
        puzzle,
        leverHandles,
        checkButton,
        checkText,
        hint,
        solution,
        transform,
        hintTransform
    };
}
// ---------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------
//                              FUNCIONES DEL PUZZLE DE SÍMBOLOS
// ---------------------------------------------------------------------------------

const SYMBOL_ASSETS = ['#runeA', '#runeB', '#runeC', '#runeD'];

function getSymbolWallTransform(room, roomSize = 10, excludedDirection = null) {
    return getReservedWallTransform(room, roomSize, {
        label: 'symbol-object',
        radius: 1.15,
        minY: 1.55,
        maxY: 1.55,
        excludedDirection,
        depthOffset: 0.14
    });
}

function createSymbolImagePlane(src, width = 0.32, height = 0.32) {
    const plane = document.createElement('a-plane');

    plane.setAttribute('width', width);
    plane.setAttribute('height', height);

    plane.setAttribute('material', {
        src,
        transparent: true,
        shader: 'flat',
        side: 'double'
    });

    return plane;
}

function createSymbolPuzzlePanel(room, roomSize = 10, options = {}) {
    const transform = getSymbolWallTransform(room, roomSize);

    const puzzle = document.createElement('a-entity');
    puzzle.setAttribute('position', transform.position);
    puzzle.setAttribute('rotation', transform.rotation);

    const panel = document.createElement('a-box');
    panel.setAttribute('width', '2.25');
    panel.setAttribute('height', '1.25');
    panel.setAttribute('depth', '0.08');
    panel.setAttribute('position', '0 0 0');
    panel.setAttribute('material', {
        color: '#222222',
        opacity: 0.92
    });
    panel.setAttribute('class', 'ray-blocker');

    puzzle.appendChild(panel);

    const title = document.createElement('a-text');
    title.setAttribute('value', 'Elige la runa correcta');
    title.setAttribute('align', 'center');
    title.setAttribute('width', '2.5');
    title.setAttribute('position', '0 0.48 0.08');
    title.setAttribute('color', '#dddddd');

    puzzle.appendChild(title);

    const symbolButtons = [];

    const spacing = 0.48;
    const startX = -((SYMBOL_ASSETS.length - 1) * spacing) / 2;

    SYMBOL_ASSETS.forEach((src, index) => {
        const x = startX + index * spacing;

        const buttonRoot = document.createElement('a-entity');
        buttonRoot.setAttribute('position', `${x} -0.05 0.1`);

        const base = document.createElement('a-box');
        base.setAttribute('width', '0.38');
        base.setAttribute('height', '0.38');
        base.setAttribute('depth', '0.06');
        base.setAttribute('position', '0 0 -0.02');
        base.setAttribute('class', 'interactable');
        base.setAttribute('interactable', '');
        base.setAttribute('material', {
            color: '#3a3a3a',
            emissive: '#222222',
            emissiveIntensity: 0.05
        });

        const icon = createSymbolImagePlane(src, 0.28, 0.28);
        icon.setAttribute('position', '0 0 0.04');

        base.appendChild(icon);

        base.addEventListener('mouseenter', () => {
            base.setAttribute('scale', '1.1 1.1 1.1');
            base.setAttribute('material', 'color', '#555555');
        });

        base.addEventListener('mouseleave', () => {
            base.setAttribute('scale', '1 1 1');
            base.setAttribute('material', 'color', '#3a3a3a');
        });

        base.addEventListener('click', () => {
            if (options.onSymbolClick) {
                options.onSymbolClick(index);
            }
        });

        buttonRoot.appendChild(base);
        puzzle.appendChild(buttonRoot);

        symbolButtons.push(base);
    });

    room.appendChild(puzzle);

    console.log(
        `[Symbol] Panel creado en ${room.getAttribute('id')}, pared ${transform.direction}`
    );

    return {
        puzzle,
        symbolButtons,
        transform
    };
}

function createSymbolClue(clueRoomEl, symbolIndex, roomSize = 10, options = {}) {
    if (!clueRoomEl) {
        console.warn('[Symbol] No se puede crear pista: clueRoomEl null');
        return null;
    }

    const transform = getSymbolWallTransform(clueRoomEl, roomSize);

    const clue = document.createElement('a-entity');
    clue.setAttribute('id', `${clueRoomEl.getAttribute('id')}-symbol-clue-${symbolIndex}`);
    clue.setAttribute('position', transform.position);
    clue.setAttribute('rotation', transform.rotation);

    const frame = document.createElement('a-box');
    frame.setAttribute('width', '0.62');
    frame.setAttribute('height', '0.62');
    frame.setAttribute('depth', '0.04');
    frame.setAttribute('position', '0 0 0');
    frame.setAttribute('material', {
        src: '#wallTex',
        repeat: '0.5 0.5',
        opacity: 0.8
    });

    

    clue.appendChild(frame);

    const symbolSrc = SYMBOL_ASSETS[symbolIndex] || SYMBOL_ASSETS[0];

    const symbol = createSymbolImagePlane(symbolSrc, 0.46, 0.46);
    symbol.setAttribute('position', '0 0 0.04');

    clue.appendChild(symbol);

    clueRoomEl.appendChild(clue);

    console.log(
        `[Symbol] Pista creada en ${clueRoomEl.getAttribute('id')}, pared ${transform.direction}, símbolo ${symbolIndex}`
    );

    return clue;
}
// ---------------------------------------------------------------------------------