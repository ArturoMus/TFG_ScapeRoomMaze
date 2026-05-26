

AFRAME.registerComponent('orb', {
    init: function () {
        //this.el.setAttribute('interactable', '');
        this.isCarried = false;
        this.holder = null;
        this.isPlaced = false;
        
        this.grabOffset = new THREE.Vector3();
        this.targetPos = new THREE.Vector3();
        this.currentPos = new THREE.Vector3();
        /*this.player = document.querySelector('#player'); // Entido que el jugador 
        this.camera = this.player.querySelector('[camera]'); // La cámara dentro del jugador

        this.offset = new THREE.Vector3(0.3, -0.3, -0.8); // Posición relativa*/

        this.el.setAttribute('sleepy', false); // Para evitar que el orbe se caiga al suelo al soltarlo, lo "dormimos" y lo despertamos al agarrarlo
    },

    interact: function (evt) {
        if (!this.isCarried) {
            const entityInteracting = evt?.detail?.cursorEl || document.querySelector('[camera]');
            this.grab(entityInteracting);
        }
        else {
            this.release();
        }
    },


    grab: function (handEl) {

        if(this.isPlaced) return;
        
        this.isCarried = true;
        this.holder = handEl;

        window.playerState.hasOrb = true;
        window.playerState.currentOrb = this.el;

        const handWorldPos = new THREE.Vector3();
        const orbWorldPos = new THREE.Vector3();

        handEl.object3D.getWorldPosition(handWorldPos);
        this.el.object3D.getWorldPosition(orbWorldPos);

        // Guardamos la diferencia entre la mano y el objeto.
        // Así no salta exactamente al centro de la mano.
        this.grabOffset.copy(orbWorldPos).sub(handWorldPos);

        // Limitamos el offset para que no se quede lejísimos si lo coges con láser.
        if (this.grabOffset.length() > 0.35) {
            this.grabOffset.set(0, -0.08, -0.18);
        }

        if (this.el.body) {
            this.el.body.collisionResponse = false;
            this.el.body.type = CANNON.Body.KINEMATIC;
            this.el.body.velocity.set(0, 0, 0);
            this.el.body.angularVelocity.set(0, 0, 0);
        }

        console.log("Orbe agarrado");
    },

    release: function (options = {}) {


        this.isCarried = false;

        window.playerState.hasOrb = false;
        window.playerState.currentOrb = null;

        if (this.el.body) {

            this.el.body.collisionResponse = true;

            // Justo antes de cambiar el tipo
            this.el.body.velocity.set(0,0,0);
            this.el.body.angularVelocity.set(0,0,0);

            this.el.body.previousPosition.copy(this.el.body.position);
            this.el.body.interpolatedPosition.copy(this.el.body.position);

            this.el.body.type = CANNON.Body.DYNAMIC;
            this.el.body.wakeUp();

            if (options.velocity) {
                this.el.body.velocity.set(
                    options.velocity.x,
                    options.velocity.y,
                    options.velocity.z
                );
            } else {
                this.el.body.velocity.set(0, -0.1, 0);
            }
        }
    },

    tick: function () {

        if(this.isPlaced) return;

        //console.log("VEL:", this.el.body.velocity.clone());

        if(!this.isCarried || !this.holder || !this.el.body) return;

        const holderWorldPos = new THREE.Vector3();
        this.holder.object3D.getWorldPosition(holderWorldPos);

        this.targetPos.copy(holderWorldPos).add(this.grabOffset);

        // Si el holder es cámara, usamos modo PC: delante de la cámara.
        if (this.holder.components.camera) {
            const camWorldDir = new THREE.Vector3();
            this.holder.object3D.getWorldDirection(camWorldDir);

            this.targetPos.copy(holderWorldPos);
            this.targetPos.add(camWorldDir.multiplyScalar(-1.2));
            this.targetPos.y -= 0.3;
        }

        this.currentPos.set(
            this.el.body.position.x,
            this.el.body.position.y,
            this.el.body.position.z
        );

        // Movimiento suave hacia la mano.
        this.currentPos.lerp(this.targetPos, 0.35);

        this.el.body.position.set(
            this.currentPos.x,
            this.currentPos.y,
            this.currentPos.z
        );

        this.el.body.velocity.set(0, 0, 0);
        this.el.body.angularVelocity.set(0, 0, 0);
    }
});