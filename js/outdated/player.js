/*

Un componente A-Frame es un bloque de código que se puede adjuntar a una entidad 
para añadirle apariencias, comportamientos y/o funcionalidades.

Estructura de un componente A-Frame.

AFRAME.registerComponent('', {
    schema: {
        
    },

    init: function () {
      // Do something when component first attached.
    },

    update: function () {
      // Do something when component's data is updated.
    },

    remove: function () {
      // Do something the component or its entity is detached.
    },

    tick: function (time, timeDelta) {
      // Do something on every scene tick or frame.
    }
});

*/

//Helper para saber en que habiacion esta el jugador
function getCurrentRoom(playerPos, roomSize) {

    if (!window.rooms) return null;

    // Como el origen del jugador está en el centro de la habitación, sumamos roomSize/2 para que al dividir por roomSize y hacer floor
    const x = Math.floor((playerPos.x + roomSize / 2) / roomSize);
    const z = Math.floor((playerPos.z + roomSize / 2) / roomSize);

    return window.rooms[`room-${x}-${z}`];
}

// Primer borrador de componente para los controles del jugador
AFRAME.registerComponent('player-controls', {
    schema: { speed: { type: 'number', default: 0.075 } },

    init: function () {
        this.speed = 0.075;
        this.keys = {};
        this.camera = this.el.querySelector('[camera]');

        // Guardar teclas presionadas
        window.addEventListener('keydown', e => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);

        console.log("Player inicializado");
    },

    tick: function () {
        if (!this.camera) return;
        if (window.gameState?.finished) return;

        const pos = this.el.object3D.position;

        const direction = new THREE.Vector3();
        this.camera.object3D.getWorldDirection(direction);

        direction.y = 0;
        direction.normalize();

        const left = new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0), direction).normalize();
        const right = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0,1,0)).normalize();

        let move = new THREE.Vector3();

        if (this.keys['w']) move.add(direction.clone().multiplyScalar(-this.data.speed));
        if (this.keys['s']) move.add(direction.clone().multiplyScalar(this.data.speed));
        if (this.keys['a']) move.add(left.clone().multiplyScalar(-this.data.speed));
        if (this.keys['d']) move.add(right.clone().multiplyScalar(-this.data.speed));

        let nextPos = pos.clone().add(move);

        // mover en X
        let testX = pos.clone();
        testX.x = nextPos.x;

        if (!isColliding(testX)) {
            pos.x = testX.x;
        }

        // mover en Z
        let testZ = pos.clone();
        testZ.z = nextPos.z;

        if (!isColliding(testZ)) {
            pos.z = testZ.z;
        }

        // Detectar habitación actual
        const currentRoom = getCurrentRoom(pos, 10);
        console.log("Habitación actual:", currentRoom ? currentRoom.id : "Ninguna");

        if(!currentRoom) return;

        if(currentRoom.isGoal && !window.gameState?.finished) {
            endGame();
        }
    }
    /*tick: function () {
        if (!this.camera) return;

        // Dirección a la que mira la cámara
        const direction = new THREE.Vector3();
        this.camera.object3D.getWorldDirection(direction);

        // Solo mover horizontal
        direction.y = 0;
        direction.normalize();

        const pos = this.el.object3D.position;

        if (this.keys['w']) pos.add(direction.clone().multiplyScalar(-this.data.speed));
        if (this.keys['s']) pos.add(direction.clone().multiplyScalar(this.data.speed));

        if (this.keys['a']) {
            const left = new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0), direction).normalize();
            pos.add(left.multiplyScalar(-this.data.speed));
        }
        if (this.keys['d']) {
            const right = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0,1,0)).normalize();
            pos.add(right.multiplyScalar(-this.data.speed));
        }
    }*/
});

AFRAME.registerComponent('hand-controller', {
    init: function () {

        this.heldEntity = null;

        this.el.addEventListener('click', () => {
            if (this.heldEntity) {
                this.release();
            }
            else {
                this.grab();
            }
        });
    },

    grab: function () {
        const raycaster = this.el.components.raycaster;
        if (!raycaster) return;

        const intersected = raycaster.intersectedEl;

        if(!intersected || intersected.length === 0) return;

        const target = intersected[0];

        // Por ahora solo lo hago con el orbe, pa probar
        if(!target.components.orb) return;

        this.heldEntity = target;
        target.components.orb.grab(this.el);
    },

    release: function () {
        if (!this.heldEntity) return;

        // Lo mismo, por ahora solo con el orbe
        this.heldEntity.components.orb.release(this.el);
        this.heldEntity = null;
    }
});
