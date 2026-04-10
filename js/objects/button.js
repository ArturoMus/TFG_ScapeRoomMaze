
AFRAME.registerComponent('button', {
    schema: {
        event: { type: 'string', default: 'activate' },
        target: { type: 'selector' }
    },

    init: function () {
        this.isPressed = false;
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

        console.log("El botón ha emitido un evento");

    }
});
