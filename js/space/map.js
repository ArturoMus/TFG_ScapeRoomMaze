

AFRAME.registerComponent('map', {
    init: function () {
        createMap();
    }
});


function createMap() {
    const scene = document.querySelector('a-scene');

    const room1 = createBasicRoom('room1', '0 0 0', 'puzzle-button-door');
    const room2 = createBasicRoom('room2', '10 0 0', 'puzzle-button-door');
    const room3 = createBasicRoom('room3', '0 0 -10', null);

    scene.appendChild(room1);
    scene.appendChild(room2);
    scene.appendChild(room3);
}