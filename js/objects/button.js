
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
    },

    interact: function () {

        if (this.isPressed) return;

        this.isPressed = true;
        console.log("Botón pulsado");

        this.el.setAttribute('color', 'green');
        /*this.el.setAttribute('position', { 
            x: this.el.object3D.position.x, 
            y: this.el.object3D.position.y - 0.1, 
            z: this.el.object3D.position.z }
        );*/

        
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

    }
});
