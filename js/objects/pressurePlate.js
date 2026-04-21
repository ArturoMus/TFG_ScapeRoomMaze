
AFRAME.registerComponent('pressure-plate', {

    schema: {
        target: { type: 'selector' }
    },

    init: function () {
        this.pressingBodies = new Set();
        this.isPressed = false;

        this.el.addEventListener('collide', (e) => {
            this.pressingBodies.add(e.detail.body);
            
        });
        this.el.addEventListener('collideend', (e) => {
            this.pressingBodies.delete(e.detail.body);
        });
    },

    tick: function () {
        const pressing = this.pressingBodies.size > 0;

        if (pressing && !this.isPressed) {
            this.pressed();
        }

        if (!pressing && this.isPressed) {
            this.released();
        }
    },

    pressed: function () {
        this.isPressed = true;
        console.log("Placa de presión activada");

        // Ahora cambiar color, luego ver que hacer
        this.el.setAttribute('color', 'green');

        this.el.setAttribute('animation__press', {
            property: 'position',
            to: '0 -0.05 0',
            dur: 100,
            easing: 'easeOutQuad'
        });

        if (this.data.target) {
            this.data.target.emit('activateDoor');
        }
    },

    released: function () {

        this.isPressed = false;
        console.log("Placa de presión desactivada");

        // Ahora cambiar color, luego ver que hacer
        this.el.setAttribute('color', 'red');

        this.el.setAttribute('animation__release', {
            property: 'position',
            to: '0 0 0',
            dur: 100,
            easing: 'easeOutQuad'
        });

        if (this.data.target) {
            this.data.target.emit('closeDoor');
        }
    }
});