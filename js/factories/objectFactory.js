// ---------------------------------------------------------------------------------
//                                   FUNCIONES DE LOS OBJETOS
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

function createPuzzleBox(position) {
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