

AFRAME.registerComponent('pedestal', {
    schema: {
        target: { type: 'selector' } // La puerta
    },

    init: function () {
        this.el.classList.add('interactable');
        this.activated = false;
    },

    interact: function () {
        if (this.activated || !window.playerState.hasOrb) return;

        console.log("Colocando orbe en el pedestal");
        
        // Buscamos el orbe que tiene el jugador
        const orb = window.playerState.currentOrb;
        
        // Lo sacamos de la cámara y lo ponemos en el pedestal
        this.el.appendChild(orb);
        orb.setAttribute('position', '0 0.6 0'); // Encima del pedestal
        orb.setAttribute('scale', '1 1 1');
        orb.components.orb.isCarried = false;
        
        this.activated = true;
        window.playerState.hasOrb = false;

        // Feedback: El pedestal y el orbe brillan juntos
        this.el.setAttribute('material', 'color', '#00ffff');
        
        if (this.data.target) {
            this.data.target.emit('openDoor');
        }
    }
});