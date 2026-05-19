
AFRAME.registerComponent('button', {
    schema: {
        event: { type: 'string', default: 'activate' },
        target: { type: 'selector' }
    },

    init: function () {
        this.isPressed = false;

        this.el.setAttribute('sound', {
            src: '#buttonSound',
            autoplay: false,
            volume: 3,
            distanceModel: 'exponential',
            maxDistance: 2,
            rolloffFactor: 1.25,
            refDistance: 0.5
        });
        this.el.addEventListener('collide', (e) => {
            if (this.isPressed) return;

            const body = e.detail.body;
            const speed = body.velocity.length();

            
            if (speed < 0.5) return;

            this.press();
        });
    },

    press: function () {
        this.isPressed = true;

        console.log("Botón empujado");

        this.el.setAttribute('color', 'green');

        // Animación hacia dentro (LOCAL, importante)
        this.el.setAttribute('animation__press', {
            property: 'position',
            to: `${this.el.object3D.position.x} ${this.el.object3D.position.y } ${this.el.object3D.position.z-0.1}`,
            dur: 150,
            easing: 'easeOutQuad'
        });

        // Evento
        if (this.data.target) {
            this.data.target.emit(this.data.event);
        }

        // Sonido
        this.el.components.sound.playSound();
    },

    /*interact: function () {

        if (this.isPressed) return;

        this.isPressed = true;
        console.log("Botón pulsado");

        
        if (this.data.target) {
            this.data.target.emit(this.data.event);
        };

        this.el.setAttribute('animation', {
            property: 'position',
            to: `${this.el.object3D.position.x} ${this.el.object3D.position.y - 0.1} ${this.el.object3D.position.z}`,
            dur: 200,
            easing: 'easeOutQuad'
        });
        this.el.components.sound.playSound();
        

        console.log("El botón ha emitido un evento");

    }*/
});
