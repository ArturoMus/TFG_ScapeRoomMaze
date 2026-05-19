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