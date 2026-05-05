
AFRAME.registerComponent('pressure-plate', {

    schema: {
        target: { type: 'selector' }
    },

    init: function () {
        this.pressingBodies = new Set();
        this.isPressed = false;
        this.initialPos = this.el.object3D.position.clone()

        this.el.addEventListener('collide', (e) => {
            this.pressingBodies.add(e.detail.body);
            //aqui se puede añadir filtraje de elementos no validos
            
        });
        this.el.addEventListener('collideend', (e) => {
            this.pressingBodies.delete(e.detail.body);
        });
    },

    tick: function () {
        const platePos = new THREE.Vector3();
        this.el.object3D.getWorldPosition(platePos);

        let stillPressing = false;

        this.pressingBodies.forEach(body => {
            if (!body.el) return;

            const bodyPos = new THREE.Vector3(
                body.position.x,
                body.position.y,
                body.position.z
            );

            const distance = platePos.distanceTo(bodyPos);

            // Ajusta este valor según tamaño de placa
            if (distance < 0.6) {
                stillPressing = true;
            }
            if (distance > 1.5) {
                this.pressingBodies.delete(body);
            }
        });

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
        //this.el.setAttribute('color', 'green');

        //Reinicio animaciones        
        this.el.removeAttribute('animation__press');

        this.el.setAttribute('animation__press', {
            property: 'position',
            to: `${this.initialPos.x} ${this.initialPos.y - 0.05} ${this.initialPos.z}`,
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
        //this.el.setAttribute('color', 'red');

        //Reinicio animaciones
        this.el.removeAttribute('animation__release');

        this.el.setAttribute('animation__release', {
            property: 'position',
            to: `${this.initialPos.x} ${this.initialPos.y} ${this.initialPos.z}`,
            dur: 100,
            easing: 'easeOutQuad'
        });

        if (this.data.target) {
            this.data.target.emit('closeDoor');
        }
    }
});