
AFRAME.registerComponent('box', {
    
    init: function(){
        this.isCarried = false;
        this.holder = null;

        this.grabOffset = new THREE.Vector3();
        this.targetPos = new THREE.Vector3();
        this.currentPos = new THREE.Vector3();
        this.desiredPos = new THREE.Vector3();

        this.el.setAttribute('sleepy', false);
    },

    interact: function (evt) {
        if(!this.isCarried){
            const entityInteracting = evt?.detail?.cursorEl || document.querySelector('[camera]');
            this.grab(entityInteracting);
        }
        else {
            this.release();
        }
    },

    grab: function(handEl) {
        this.isCarried = true;
        this.holder = handEl;

        const handWorldPos = new THREE.Vector3();
        const boxWorldPos = new THREE.Vector3();

        handEl.object3D.getWorldPosition(handWorldPos);
        this.el.object3D.getWorldPosition(boxWorldPos);

        this.grabOffset.copy(boxWorldPos).sub(handWorldPos);

        // En caso de que se plle desde lejos se acerca a la mano
        if (this.grabOffset.length() > 0.45) {
            this.grabOffset.set(0, -0.1, -0.25);
        }

        if (this.el.body) {
            this.el.body.collisionResponse = false;
            this.el.body.type = CANNON.Body.KINEMATIC;

            this.el.body.velocity.set(0, 0, 0);
            this.el.body.angularVelocity.set(0, 0, 0);
        }


        console.log("Caja agarrada");
    },

    release: function (options ={}) {
        this.isCarried = false;

        if (this.el.body) {
            this.el.body.collisionResponse = true;

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

        console.log("Caja soltada");
    },

    tick: function () {
        if (!this.isCarried || !this.holder || !this.el.body) return;

        const holderWorldPos = new THREE.Vector3();
        this.holder.object3D.getWorldPosition(holderWorldPos);

        this.targetPos.copy(holderWorldPos).add(this.grabOffset);

        // Si estoy en pc entonces se mueve la caja delante de la camara
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
        this.desiredPos.copy(this.currentPos).lerp(this.targetPos, 0.35);

        const safePos = getSafeCarriedObjectPosition(
            this.currentPos,
            this.desiredPos,
            {
                radius: 0.3,
                blockerSelector: '.ray-blocker'
            }
        );

        this.el.body.position.set(
            safePos.x,
            safePos.y,
            safePos.z
        );

        this.el.object3D.position.set(
            safePos.x,
            safePos.y,
            safePos.z
        );

        this.el.body.velocity.set(0, 0, 0);
        this.el.body.angularVelocity.set(0, 0, 0);
    }
});
