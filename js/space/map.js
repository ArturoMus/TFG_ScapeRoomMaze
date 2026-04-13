

AFRAME.registerComponent('map', {
    init: function () {
        createMap(5, 5);
    }
});


function createMap(width, height) {
    const scene = document.querySelector('a-scene');

    const layout = [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1]
    ];

    const roomSize = 10;

    layout.forEach((row, z) => {
        row.forEach((cell, x) => {
            if (cell === 1) {

                const neighbors = {
                    north: layout[z - 1]?.[x],
                    south: layout[z + 1]?.[x],
                    east:  layout[z]?.[x + 1],
                    west:  layout[z]?.[x - 1],
                };

                const room = createBasicRoom(roomSize, `room-${x}-${z}`, `${x * roomSize} 0 ${z * roomSize}`, 'puzzle-button-door', neighbors);
                scene.appendChild(room);

                /*if (layout[z][x + 1] === 1) {
                    createDoor(room, 'east', roomSize);
                }

                if (layout[z + 1]?.[x] === 1) {
                    createDoor(room, 'south', roomSize);
                }*/
            }
        });
    });

    /*const room1 = createBasicRoom('room1', '0 0 0', 'puzzle-button-door');
    const room2 = createBasicRoom('room2', '10 0 0', 'puzzle-button-door');
    const room3 = createBasicRoom('room3', '0 0 -10', null);

    scene.appendChild(room1);
    scene.appendChild(room2);
    scene.appendChild(room3);*/
}