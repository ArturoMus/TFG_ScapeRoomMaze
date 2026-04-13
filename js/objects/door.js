

AFRAME.registerComponent('door', {

    schema: {
        direction: { type: 'string', default: 'north' },
        openRotation: { type: 'number', default: -90 }
    },

    init: function () {
        this.isOpen = false;
        this.isLocked = true;
        this.hasPuzzle = false;

        const pos = this.el.getAttribute('position');
        this.initialPos = { x: pos.x, y: pos.y, z: pos.z };

        
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
        if (this.isOpen) return;
        this.isOpen = !this.isOpen;

        if (this.el.colliderRef) {
            this.el.colliderRef.disabled = true;
            console.log("Colisión desactivada para la puerta");
        }

        this.el.setAttribute('animation', {
            property: 'position',
            to: `${this.initialPos.x} ${this.initialPos.y - 3} ${this.initialPos.z}`,
            dur: 1000,
            easing: 'easeOutQuad'
        });

        // Calculamos la nueva rotación en el eje Y
        /*const newY = this.isOpen 
            ? this.initialRotation.y + this.data.openRotation 
            : this.initialRotation.y;*/

        // Aplicamos manteniendo X y Z originales
        /*this.el.setAttribute('rotation', {
            x: this.initialRotation.x,
            y: newY,
            z: this.initialRotation.z
        });*/

        console.log("Puerta interactuada, estado:", this.isOpen ? "Abierta" : "Cerrada");
    },

    unlock: function () {
        this.isLocked = false;
        console.log("La puerta ha sido desbloqueada.");
        this.toggleDoor(); // Abrir la puerta al desbloquearla
    }
    
});