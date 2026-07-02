// ---------------------------------------------------------------------------------
//                                   FUNCIONES DE LOS OBJETOS
// ---------------------------------------------------------------------------------

function createOrb(position, options = {}) {
    const orb = document.createElement('a-sphere');

    const id = options.id;

    orb.setAttribute('id', id);
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
    orb.setAttribute('orb', '');
    orb.setAttribute('class', 'grabbable');

    if (options.puzzleID) {
        orb.setAttribute('data-puzzle-id', options.puzzleID);
    }

    if (options.roomId) {
        orb.setAttribute('data-room-id', options.roomId);
    }

    return orb;
}

function createPuzzleBox(position, options = {}) {
    const box = document.createElement('a-box');

    const id = options.id;
    box.setAttribute('id', id);
    box.setAttribute('position', position);

    box.setAttribute('width', '0.5');
    box.setAttribute('height', '0.5');
    box.setAttribute('depth', '0.5');

    box.setAttribute('material' , {
        src: '#woodBoxTex',
        repeat: '2 2'
    });

    box.setAttribute('box', '');
    box.setAttribute('class', 'grabbable');

    if (options.roomId) {
        box.setAttribute('data-room-id', options.roomId);
    }

    if (options.puzzleID) {
        box.setAttribute('data-puzzle-id', options.puzzleID);
    }

    box.setAttribute('dynamic-body', {
        mass: 1,
        shape: 'box',
        linearDamping: 0.15,
        angularDamping: 0.4
    });

    return box;
}