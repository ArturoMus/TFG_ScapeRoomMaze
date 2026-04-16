

AFRAME.registerComponent('orb', {
    init: function () {
        this.el.setAttribute('class', 'interactable');
        this.isCarried = false;
        this.player = document.querySelector('#player'); // Tu entidad de jugador
    },

    interact: function () {
        if (!this.isCarried) {
            console.log("Orbe agarrado");
            this.isCarried = true;
            window.playerState.hasOrb = true;
            window.playerState.currentOrb = this.el;

            // Lo emparentamos al jugador para que se mueva con él
            // Si es PC, lo pegamos a la cámara. Si es VR, idealmente a la mano.
            const camera = document.querySelector('[camera]');
            camera.appendChild(this.el);
            
            // Posición relativa frente a la cara/mano
            this.el.setAttribute('position', '0.3 -0.3 -0.5'); 
            this.el.setAttribute('scale', '0.5 0.5 0.5'); // Lo hacemos un poco más pequeño al llevarlo
        }
    }
});