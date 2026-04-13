

AFRAME.registerComponent('door', {

    schema: {
        direction: { type: 'string', default: 'north' },
        openRotation: { type: 'number', default: -90 }
    },

    init: function () {
        this.isOpen = false;
        this.isLocked = true;
        this.hasPuzzle = false;

        this.initialRotation = this.el.getAttribute('rotation') || {x: 0, y: 0, z: 0};
        
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

        // Calculamos la nueva rotación en el eje Y
        const newY = this.isOpen 
            ? this.initialRotation.y + this.data.openRotation 
            : this.initialRotation.y;

        // Aplicamos manteniendo X y Z originales
        this.el.setAttribute('rotation', {
            x: this.initialRotation.x,
            y: newY,
            z: this.initialRotation.z
        });
        
        console.log("Puerta interactuada, estado:", this.isOpen ? "Abierta" : "Cerrada");
    },

    unlock: function () {
        this.isLocked = false;
        console.log("La puerta ha sido desbloqueada.");
        this.toggleDoor(); // Abrir la puerta al desbloquearla
    }
    
});