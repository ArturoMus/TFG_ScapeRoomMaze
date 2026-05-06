AFRAME.registerComponent('desktop-grabber', {
    schema: {
        holder: { type: 'selector' },
        throwForce: { type: 'number', default: 2.5 }
    },

    init: function () {
        this.grabbedEl = null;
        this.originalDynamicBody = null;

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onContextMenu = e => e.preventDefault();

        window.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('contextmenu', this.onContextMenu);
    },

    remove: function () {
        window.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('contextmenu', this.onContextMenu);
    },

    onMouseDown: function (e) {
        // Click izquierdo: coger / soltar
        if (e.button === 0) {
            if (this.grabbedEl) {
                this.release(false);
                return;
            }

            const target = this.getRaycastTarget();

            if (!target) return;

            if (target.classList.contains('grabbable')) {
                this.grab(target);
                return;
            }

            // Opcional: mantener interacción normal con botones/puzzles
            if (target.classList.contains('interactable')) {
                this.tryInteract(target);
            }
        }

        // Click derecho: lanzar si llevas algo
        if (e.button === 2 && this.grabbedEl) {
            this.release(true);
        }
    },

    getRaycastTarget: function () {
        const raycaster = this.el.components.raycaster;

        if (!raycaster || !raycaster.intersections) return null;

        const intersections = raycaster.intersections;

        for (const hit of intersections) {
            const el = hit.el;

            if (!el) continue;

            const isGrabbable = el.classList.contains('grabbable');
            const isInteractable = el.classList.contains('interactable');
            const isBlocker = el.classList.contains('ray-blocker');

            if (isGrabbable || isInteractable) {
                return el;
            }

            // Si lo primero que toca es pared/suelo, no atraviesa la pared
            if (isBlocker) {
                return null;
            }
        }

        return null;
    },

    grab: function (el) {
        if (!this.data.holder) {
            console.warn('[desktop-grabber] Falta holder.');
            return;
        }

        this.grabbedEl = el;

        this.originalDynamicBody = el.getAttribute('dynamic-body');

        if (el.body) {
            el.body.velocity.set(0, 0, 0);
            el.body.angularVelocity.set(0, 0, 0);
            el.body.force.set(0, 0, 0);
            el.body.torque.set(0, 0, 0);
        }

        el.removeAttribute('dynamic-body');

        this.data.holder.appendChild(el);

        el.object3D.position.set(0, 0, 0);
        el.object3D.rotation.set(0, 0, 0);

        if (el.components.box) {
            el.components.box.isCarried = true;
        }

        if (el.components.orb) {
            el.components.orb.isCarried = true;
            el.components.orb.holder = this.data.holder;
            el.components.orb.isPlaced = false;
        }

        if (el.hasAttribute('orb') && window.playerState) {
            window.playerState.hasOrb = true;
            window.playerState.currentOrb = el;
        }

        console.log('[desktop-grabber] Objeto cogido:', el);
    },

    release: function (shouldThrow) {
        const el = this.grabbedEl;
        if (!el) return;

        const scene = this.el.sceneEl;

        const worldPos = new THREE.Vector3();
        const worldQuat = new THREE.Quaternion();

        el.object3D.updateMatrixWorld(true);
        el.object3D.getWorldPosition(worldPos);
        el.object3D.getWorldQuaternion(worldQuat);

        scene.appendChild(el);

        el.object3D.position.copy(worldPos);
        el.object3D.quaternion.copy(worldQuat);

        if (this.originalDynamicBody !== null) {
            el.setAttribute('dynamic-body', this.originalDynamicBody);
        } else {
            el.setAttribute('dynamic-body', '');
        }

        if (el.components.box) {
            el.components.box.isCarried = false;
        }

        if (el.components.orb) {
            el.components.orb.isCarried = false;
            el.components.orb.holder = null;
        }

        if (el.hasAttribute('orb') && window.playerState) {
            window.playerState.hasOrb = false;
            window.playerState.currentOrb = null;
        }

        if (shouldThrow) {
            setTimeout(() => {
                if (!el.body) return;

                const direction = new THREE.Vector3();
                this.el.object3D.getWorldDirection(direction);

                el.body.velocity.set(
                    direction.x * this.data.throwForce,
                    1.2,
                    direction.z * this.data.throwForce
                );
            }, 0);
        }

        this.grabbedEl = null;
        this.originalDynamicBody = null;

        console.log('[desktop-grabber] Objeto soltado:', el);
    },

    tryInteract: function (el) {
        Object.values(el.components).forEach(component => {
            if (component && typeof component.interact === 'function') {
                component.interact();
            }
        });
    }
});