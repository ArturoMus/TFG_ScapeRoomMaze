

AFRAME.registerComponent('door', {

    schema: {
        direction: { type: 'string', default: 'north' },
        openRotation: { type: 'number', default: -90 }
    },

    init: function () {
        this.isOpen = false;
        this.isLocked = true;
        this.hasPuzzle = false;

        this.progress = 0;
        this.isBeingActivated = false;
        this.isFullyOpen = false;

        const pos = this.el.getAttribute('position');
        this.initialPos = { x: pos.x, y: pos.y, z: pos.z };

        this.el.setAttribute('sound', {
            src: '#doorSound',
            autoplay: false,
            volume: 6,
            distanceModel: 'exponential',
            maxDistance: 8,
            rolloffFactor: 1.25,
            refDistance: 1
        });
        
        this.el.addEventListener('openDoor', () => {
            this.unlock();
        });

        this.el.addEventListener('activateDoor', () => {
            if (this.isFullyOpen) return;
            this.isBeingActivated = true;
        });

        this.el.addEventListener('closeDoor', () => {
            if (this.isFullyOpen) return;
            this.isBeingActivated = false;
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

        this.el.components.sound.playSound();
        this.el.setAttribute('animation', {
            property: 'position',
            to: `${this.initialPos.x} ${this.initialPos.y - 3} ${this.initialPos.z}`,
            dur: 5000,
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
    },

    // Tengo que añadir los metodos para la placa de presión
    tick: function (time, delta) {

        // si no hay nada activando entonces no hace nada
        if (!this.isBeingActivated && this.progress <= 0) return;

        // si ya ha terminado entonces no hace nada
        if (this.isFullyOpen) return;

        const speed = 0.0002 * delta;

        if (this.isBeingActivated) {
            this.progress += speed;
        } else {
            this.progress -= speed;
        }

        this.progress = Math.max(0, Math.min(1, this.progress));

        const newY = this.initialPos.y - 3 * this.progress;

        this.el.object3D.position.y = newY;

        if (this.progress >= 1) {
            this.isFullyOpen = true;
            this.isLocked = false;

            if (this.el.colliderRef) {
                this.el.colliderRef.disabled = true;
            }

            // EMITIR UN SONIDO PORFA
            console.log("Puerta completamente abierta (pressure plate)");
        }
    }

});