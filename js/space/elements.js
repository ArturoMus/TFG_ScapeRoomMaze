

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
    //door.setAttribute('static-body', '');

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

function createButton(position, targetSelector, room) {

    const button = document.createElement('a-box');
    button.setAttribute('id', room.getAttribute('id') + '-button');

    button.setAttribute('position', position);
    button.setAttribute('depth', '0.2');
    button.setAttribute('height', '0.3');
    button.setAttribute('width', '0.3');
    button.setAttribute('color', 'red');
    button.setAttribute('static-body', '');
    
    // Configuramos el botón para que dispare el evento a la puerta que encontramos
    button.setAttribute('button', {
        event: 'openDoor',
        target: '#' + targetSelector
    });

    button.setAttribute('interactable', '');
    
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

function createPedestal(position, doorSelector) {

    const base = document.createElement('a-cylinder');
    base.setAttribute('position', position);
    base.setAttribute('radius', '0.3');
    base.setAttribute('height', '1');
    base.setAttribute('color', '#444');
    base.setAttribute('static-body', '');
    base.setAttribute('class', 'interactable');
    base.setAttribute('interactable', '');
    base.setAttribute('pedestal', {
        target: '#' + doorSelector,
        puzzleID: doorSelector
    });

    return base;
}

function createPressurePlate(position, doorSelector) {

    const plate = document.createElement('a-box');
    plate.setAttribute('position', position);
    plate.setAttribute('width', '0.5');
    plate.setAttribute('height', '0.2');
    plate.setAttribute('depth', '0.5');
    plate.setAttribute('color', 'red');
    plate.setAttribute('static-body', '');
    plate.setAttribute('pressure-plate', {
        target: '#' + doorSelector
    });
    return plate;
}

function createTestBox(position) {
    const box = document.createElement('a-box');
    box.setAttribute('position', position);

    box.setAttribute('width', '0.5');
    box.setAttribute('height', '0.5');
    box.setAttribute('depth', '0.5');

    box.setAttribute('color', '#FF00FF');
    box.setAttribute('dynamic-body', {
        mass: 1,
        shape: 'box',
        linearDamping: 0.4,
        angularDamping: 0.4
    });

    box.setAttribute('box', '');
    box.setAttribute('class', 'grabbable');
    return box;
}
