
AFRAME.registerComponent('box', {
    
    init: function(){
        this.isCarried = false;
        this.holder = null;

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

        if(this.el.body) {
            this.el.body.collisionResponse = false;
            this.el.body.type = CANNON.Body.KINEMATIC;

            this.el.body.velocity.set(0,0,0);
            this.el.body.angularVelocity.set(0,0,0);
        }

        console.log("Caja agarrada");
    },

    release: function () {
        this.isCarried = false;

        if (this.el.body) {
            this.el.body.collisionResponse = true;

            this.el.body.velocity.set(0,0,0);
            this.el.body.angularVelocity.set(0,0,0);

            this.el.body.previousPosition.copy(this.el.body.position);
            this.el.body.interpolatedPosition.copy(this.el.body.position);

            this.el.body.type = CANNON.Body.DYNAMIC;
            this.el.body.wakeUp();
            this.el.body.velocity.y -= 0.1;
        }

        console.log("Caja soltada");
    },

    tick: function () {
        if (!this.isCarried || !this.holder || !this.el.body) return;

        const targetPos = new THREE.Vector3();
        this.holder.object3D.getWorldPosition(targetPos);

        // comportamiento tipo "delante de la cámara"
        if (this.holder.components.camera) {
            const camWorldDir = new THREE.Vector3();
            this.holder.object3D.getWorldDirection(camWorldDir);

            targetPos.add(camWorldDir.multiplyScalar(-1.2));
            targetPos.y -= 0.3;
        }

        this.el.body.position.set(
            targetPos.x,
            targetPos.y,
            targetPos.z
        );
    }
});
