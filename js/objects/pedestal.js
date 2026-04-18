

AFRAME.registerComponent('pedestal', {
    schema: {
        // Revisar si es mejor pasar el ID o el selector completo
        target: { type: 'selector' }
    },

    init: function () {
        //this.el.classList.add('interactable');
        this.activated = false;
    },

    interact: function () {
        if (this.activated || !window.playerState.hasOrb) return;

        console.log("Colocando orbe en el pedestal");
        
        // Buscamos el orbe que tiene el jugador
        const orb = window.playerState.currentOrb || document.querySelector('[orb]');
        if (!orb) {
            console.warn("No se encontró el orbe");
            return;
        }
        
        // Lo sacamos de la cámara y lo ponemos en el pedestal
        this.el.appendChild(orb);
        orb.object3D.position.set(0, 0.5, 0);
        orb.object3D.rotation.set(0, 0, 0);
        orb.object3D.scale.set(1, 1, 1);
        orb.components.orb.isCarried = false;
        
        this.activated = true;
        window.playerState.hasOrb = false;

        
        this.el.setAttribute('material', 'color', '#00ffff', 'emissive', '#00ffff', 'emissiveIntensity', 5);
        orb.setAttribute('animation', {
            property: 'material.emissiveIntensity',
            to: 2,
            dur: 300
        });
        
        console.log("Target puerta:", this.data.target);
        
        setTimeout(() => {
            this.data.target.emit('openDoor');
        }, 300);
    }
});