
AFRAME.registerComponent('pressure-plate', {

    schema: {
        target: { type: 'selector' },
        targets: { type: 'string', default: '' },
        pressDepth: { type: 'number', default: 0.012 },
        activationMargin: { type: 'number', default: 0.12 },
        maxActivationHeight: { type: 'number', default: 0.35 }
    },

    init: function () {
        this.isPressed = false;
        this.telemetryPressed = false;
        this.initialPos = this.el.object3D.position.clone();

        this.plateWorldPos = new THREE.Vector3();
        this.objectWorldPos = new THREE.Vector3();

        this.currentPressingObject = null;
        this.lastPressingObject = null;
    },

    tick: function () {
        const pressing = this.isAnyPuzzleObjectOnPlate();

        if (pressing && !this.isPressed) {
            this.pressed();
        }

        if (!pressing && this.isPressed) {
            this.released();
        }
    },

    isAnyPuzzleObjectOnPlate: function () {
        this.currentPressingObject = null;
        this.el.object3D.getWorldPosition(this.plateWorldPos);

        const plateWidth = parseFloat(this.el.getAttribute('width')) || 1.2;
        const plateDepth = parseFloat(this.el.getAttribute('depth')) || 1.2;

        const halfW = plateWidth / 2;
        const halfD = plateDepth / 2;

        // Cosas que podrían activar las placas
        const candidates = document.querySelectorAll('[dynamic-body], [box], [orb]');

        for (const objEl of candidates) {

            // Ignoro la propia placa
            if (objEl === this.el) continue;

            // Con esto ingoro objetos sin cuerpo fisico
            if (!objEl.body) continue;

            // Esto lo uso para ignorar objetos que esten agarrados
            if (objEl.components.box?.isCarried) continue;
            if (objEl.components.orb?.isCarried) continue;

            // Si el cuerpo no tiene masa, seguramente es estático o ya está colocado.
            if (objEl.body.mass === 0) continue;

            this.objectWorldPos.set(
                objEl.body.position.x,
                objEl.body.position.y,
                objEl.body.position.z
            );

            const objWidth = parseFloat(objEl.getAttribute('width')) || 0.5;
            const objHeight = parseFloat(objEl.getAttribute('height')) || 0.5;
            const objDepth = parseFloat(objEl.getAttribute('depth')) || 0.5;

            const objHalfW = objWidth / 2;
            const objHalfH = objHeight / 2;
            const objHalfD = objDepth / 2;

            const dx = Math.abs(this.objectWorldPos.x - this.plateWorldPos.x);
            const dz = Math.abs(this.objectWorldPos.z - this.plateWorldPos.z);

            const insideX = dx <= halfW + objHalfW + this.data.activationMargin;
            const insideZ = dz <= halfD + objHalfD + this.data.activationMargin;

            const objectBottomY = this.objectWorldPos.y - objHalfH;
            const closeToPlateY =
                objectBottomY <= this.plateWorldPos.y + this.data.maxActivationHeight;

            if (insideX && insideZ && closeToPlateY) {
                this.currentPressingObject = objEl;
                return true;
            }
        }

        return false;
    },

    pressed: function () {
        this.isPressed = true;
        console.log("Placa de presión activada");

        const pressingObject = this.currentPressingObject;
        this.lastPressingObject = pressingObject;

        if (!this.telemetryPressed) {
            this.telemetryPressed = true;

            window.telemetry?.track('pressure_plate_pressed', {
                plateId: this.el.id || null,
                objectId: pressingObject?.id || null,
                objectType: pressingObject?.components?.box
                    ? 'box'
                    : pressingObject?.components?.orb
                        ? 'orb'
                        : 'unknown',
                targets: this.data.targets || null,
                target: this.data.target?.id || null
            });
        }

        //Reinicio animaciones        
        this.el.removeAttribute('animation__press');

        this.el.setAttribute('animation__press', {
            property: 'position',
            to: `${this.initialPos.x} ${this.initialPos.y - this.data.pressDepth} ${this.initialPos.z}`,
            dur: 100,
            easing: 'easeOutQuad'
        });

        this.emitToTargets('activateDoor');
        
    },

    released: function () {

        const releasedObject = this.lastPressingObject;

        this.isPressed = false;
        this.telemetryPressed = false;
        this.currentPressingObject = null;
        this.lastPressingObject = null;

        window.telemetry?.track('pressure_plate_released', {
                plateId: this.el.id || null,
                objectId: releasedObject?.id || null,
                objectType: releasedObject?.components?.box
                    ? 'box'
                    : releasedObject?.components?.orb
                        ? 'orb'
                        : 'unknown',
                targets: this.data.targets || null,
                target: this.data.target?.id || null
        });

        console.log("Placa de presión desactivada");

        //Reinicio animaciones
        this.el.removeAttribute('animation__release');

        this.el.setAttribute('animation__release', {
            property: 'position',
            to: `${this.initialPos.x} ${this.initialPos.y} ${this.initialPos.z}`,
            dur: 100,
            easing: 'easeOutQuad'
        });

        this.emitToTargets('closeDoor');
        
    },

    emitToTargets: function (eventName) {
        if (this.data.targets) {
            const selectors = this.data.targets
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);

            selectors.forEach(selector => {
                const targetEl = document.querySelector(selector);

                if (targetEl) {
                    targetEl.emit(eventName);
                } else {
                    console.warn("Target no encontrado:", selector);
                }
            });

            return;
        }

        if (this.data.target) {
            this.data.target.emit(eventName);
        }
    },
});