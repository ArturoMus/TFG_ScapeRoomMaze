AFRAME.registerComponent('vr-grabber', {
    schema: {
        objects: { type: 'string', default: '.grabbable' },
        throwMultiplier: { type: 'number', default: 1.8 },
        maxThrowSpeed: { type: 'number', default: 8 }
    },

    init: function () {
        this.heldEl = null;

        this.lastHandPos = new THREE.Vector3();
        this.currentHandPos = new THREE.Vector3();
        this.handVelocity = new THREE.Vector3();

        this.el.object3D.getWorldPosition(this.lastHandPos);

        this.el.addEventListener('triggerdown', () => {
            console.log('triggerdown en', this.el.id);
            this.tryGrab();
        });

        this.el.addEventListener('triggerup', () => {
            console.log('triggerup en', this.el.id);
            this.release(true);
        });

        this.el.addEventListener('gripdown', () => {
            console.log('gripdown en', this.el.id);
            this.tryGrab();
        });

        this.el.addEventListener('gripup', () => {
            console.log('gripup en', this.el.id);
            this.release(true);
        });

        // Eventos WebXR alternativos, por si Quest/visor emite estos
        this.el.addEventListener('selectstart', () => {
            console.log('selectstart en', this.el.id);
            this.tryGrab();
        });

        this.el.addEventListener('selectend', () => {
            console.log('selectend en', this.el.id);
            this.release(true);
        });

        this.el.addEventListener('squeezestart', () => {
            console.log('squeezestart en', this.el.id);
            this.tryGrab();
        });

        this.el.addEventListener('squeezeend', () => {
            console.log('squeezeend en', this.el.id);
            this.release(true);
        });
    },

    tick: function (time, delta) {
        this.el.object3D.getWorldPosition(this.currentHandPos);

        if (delta && delta > 0) {
            this.handVelocity
                .copy(this.currentHandPos)
                .sub(this.lastHandPos)
                .multiplyScalar(1000 / delta);
        }

        this.lastHandPos.copy(this.currentHandPos);
    },

    tryGrab: function () {
        if (this.heldEl) return;

        const raycaster = this.el.components.raycaster;
        if (!raycaster) return;

        const intersections = raycaster.intersections;
        if (!intersections || intersections.length === 0) return;


        // El primer impacto del raycaster es lo que realmente estamos tocando.
        // Si lo primero que toca es una pared/puerta, no podemos coger lo de detrás.
        const firstHit = intersections[0];

        if (!firstHit || !firstHit.object || !firstHit.object.el) return;

        const firstEl = firstHit.object.el;

        if (firstEl.classList.contains('ray-blocker')) {
            console.log("Raycast bloqueado por pared/puerta");
            return;
        }

        if (!firstEl.matches(this.data.objects)) {
            return;
        }

        const target = firstEl;

        if (target.components.orb) {
            this.heldEl = target;
            target.components.orb.grab(this.el);
        }
        else if (target.components.box) {
            this.heldEl = target;
            target.components.box.grab(this.el);
        }
    },

    release: function (throwObject = true) {
        if (!this.heldEl) return;

        const releaseVelocity = this.handVelocity
            ? this.handVelocity.clone()
            : new THREE.Vector3();

        if (releaseVelocity.length() > this.data.maxThrowSpeed) {
            releaseVelocity.setLength(this.data.maxThrowSpeed);
        }

        releaseVelocity.multiplyScalar(this.data.throwMultiplier);

        const options = {
            velocity: throwObject ? releaseVelocity : null
        };

        if (this.heldEl.components.orb) {
            this.heldEl.components.orb.release(options);
        }
        else if (this.heldEl.components.box) {
            this.heldEl.components.box.release(options);
        }

        this.heldEl = null;
    }
});