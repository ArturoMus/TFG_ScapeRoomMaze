

AFRAME.registerComponent('door', {

    schema: {
        event: { type: 'string', default: 'north' }
    },

    init: function () {
        this.isOpen = false;
        this.isLocked = true;

        
        this.el.addEventListener('openDoor', () => {
            this.unlock();
        });
    },

    interact: function () {
        if (this.isLocked) {
            console.log("La puerta está bloqueada. No se puede abrir.");
            return;
        }

        this.toggleDoor();
    },

    toggleDoor: function () {
        this.isOpen = !this.isOpen;

        const rotation = this.isOpen ? '0 -90 0' : '0 0 0';

        this.el.setAttribute('rotation', rotation);
        console.log("Puerta interactuada, estado:", this.isOpen ? "Abierta" : "Cerrada");
    },

    unlock: function () {
        this.isLocked = false;
        console.log("La puerta ha sido desbloqueada.");
        this.toggleDoor(); // Abrir la puerta al desbloquearla
    }
    
});