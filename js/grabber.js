AFRAME.registerComponent('vr-grabber', {
    schema: {
        objects: { type: 'string', default: '.grabbable' },
        hand: { type: 'string', default: 'right' },
        maxDistance: { type: 'number', default: 3 }
    },

    init: function () {
        this.heldEl = null;

        //Grip
        this.el.addEventListener('gripdown', () => this.tryGrab());
        this.el.addEventListener('gripup', () => this.release());

        // Gatillo
        this.el.addEventListener('triggerdown', () => this.tryGrab());
        this.el.addEventListener('triggerup', () => this.release());
    },

    tryGrab: function () {
        if (this.heldEl) return;

        const raycaster = this.el.components.raycaster;
        if (!raycaster) return;

        const intersections = raycaster.intersections;
        if (!intersections || intersections.length === 0) return;

        const hit = intersections.find(i => {
            return i.object && i.object.el && i.object.el.matches(this.data.objects);
        });

        if (!hit) return;

        const target = hit.object.el;

        if (target.components.orb) {
            this.heldEl = target;
            target.components.orb.grab(this.el);
        }
        else if (target.components.box) {
            this.heldEl = target;
            target.components.box.grab(this.el);
        }
    },

    release: function () {
        if (!this.heldEl) return;

        if (this.heldEl.components.orb) {
            this.heldEl.components.orb.release();
        }
        else if (this.heldEl.components.box) {
            this.heldEl.components.box.release();
        }

        this.heldEl = null;
    }
});