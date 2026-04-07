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

// Primer borrador de componente para los controles del jugador
AFRAME.registerComponent('player-controls', {
    schema: { speed: { type: 'number', default: 0.1 } },

    init: function () {
        this.keys = {};
        this.camera = this.el.querySelector('[camera]');

        // Guardar teclas presionadas
        window.addEventListener('keydown', e => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);

        console.log("Player inicializado");
    },

    tick: function () {
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
    }
});
