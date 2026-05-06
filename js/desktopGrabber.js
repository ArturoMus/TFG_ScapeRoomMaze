AFRAME.registerComponent('desktop-grabber', {
    schema: {
        holder: { type: 'selector' },
        throwForce: { type: 'number', default: 4 },
        interactButton: { type: 'number', default: 0 } // 0 = click izquierdo
    },

    init: function () {
        this.heldEl = null;
        this.isMouseDown = false;

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onContextMenu = e => e.preventDefault();

        window.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('contextmenu', this.onContextMenu);
    },

    remove: function () {
        window.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('mouseup', this.onMouseUp);
        window.removeEventListener('contextmenu', this.onContextMenu);
    },

    onMouseDown: function (e) {
        if (e.button !== this.data.interactButton) return;

        this.isMouseDown = true;

        const target = this.getRaycastTarget();

        if (!target) return;

        if (target.classList.contains('grabbable')) {
            this.grab(target);
            return;
        }

        if (target.classList.contains('interactable')) {
            this.tryInteract(target);
        }
    },

    onMouseUp: function (e) {
        if (e.button !== this.data.interactButton) return;

        this.isMouseDown = false;

        if (this.heldEl) {
            this.release(true);
        }
    },

    getRaycastTarget: function () {
        const raycaster = this.el.components.raycaster;

        if (!raycaster || !raycaster.intersections) return null;

        const intersections = raycaster.intersections;

        for (const hit of intersections) {
            const el = hit.object?.el || hit.el;

            if (!el) continue;

            const isBlocker = el.classList.contains('ray-blocker');
            const isGrabbable = el.classList.contains('grabbable');
            const isInteractable = el.classList.contains('interactable');

            // Si lo primero que tocamos es pared/puerta, no podemos coger ni pulsar lo de detrás.
            if (isBlocker) {
                return null;
            }

            if (isGrabbable || isInteractable) {
                return el;
            }
        }

        return null;
    },

    grab: function (el) {
        if (!this.data.holder) {
            console.warn('[desktop-grabber] Falta holder.');
            return;
        }

        if (this.heldEl) return;

        this.heldEl = el;

        if (el.components.orb) {
            el.components.orb.grab(this.data.holder);
        }
        else if (el.components.box) {
            el.components.box.grab(this.data.holder);
        }
        else {
            console.warn('[desktop-grabber] El objeto no tiene componente orb ni box:', el);
            this.heldEl = null;
            return;
        }

        console.log('[desktop-grabber] Objeto cogido:', el);
    },

    release: function (shouldThrow = true) {
        const el = this.heldEl;

        if (!el) return;

        const velocity = shouldThrow
            ? this.getThrowVelocity()
            : null;

        const options = {
            velocity
        };

        if (el.components.orb) {
            el.components.orb.release(options);
        }
        else if (el.components.box) {
            el.components.box.release(options);
        }

        this.heldEl = null;

        console.log('[desktop-grabber] Objeto soltado/lanzado:', el);
    },

    getThrowVelocity: function () {
        const direction = new THREE.Vector3();

        // En Three/A-Frame la cámara mira hacia -Z.
        this.el.object3D.getWorldDirection(direction);

        return direction.multiplyScalar(this.data.throwForce);
    },

    tryInteract: function (el) {
        Object.values(el.components).forEach(component => {
            if (component && typeof component.interact === 'function') {
                component.interact({
                    detail: {
                        cursorEl: this.el
                    }
                });
            }
        });
    }
});