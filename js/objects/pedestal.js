

AFRAME.registerComponent('pedestal', {
    schema: {
        // Revisar si es mejor pasar el ID o el selector completo
        target: { type: 'selector' },
        targets: { type: 'string', default: '' },
        puzzleID: { type: 'string' }
    },

    init: function () {
        //this.el.classList.add('interactable');
        this.activated = false;

        this.el.addEventListener('collide', (e) => {
            if (this.activated) return;

            const otherEl = e.detail.body.el;
            if (!otherEl || !otherEl.hasAttribute('orb')) return;

            const orbPuzzle = otherEl.getAttribute('data-puzzle-id');

            if (orbPuzzle !== this.data.puzzleID) {console.warn("Orbe no corresponde al puzzle del pedestal"); return; }

            this.tryActivate(otherEl, e.detail.body);
        });
    },

    tryActivate: function (orbEl, body) {
        const speed = body.velocity.length();

        if (speed < 1) return;
        if (body.velocity.y > -0.5) return;

        this.activate(orbEl);
    },

    emitToTargets: function () {
        if (this.data.targets) {
            const selectors = this.data.targets
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);

            selectors.forEach(selector => {
                const targetEl = document.querySelector(selector);

                if (targetEl) {
                    targetEl.emit('openDoor');
                } else {
                    console.warn("Target no encontrado:", selector);
                }
            });

            return;
        }

        if (this.data.target) {
            this.data.target.emit('openDoor');
        }
    },

    activate: function (orb) {
        this.activated = true;

        console.log("Pedestal activado por impacto");

        // Obtengo posicion global pedestal
        const worldPos = new THREE.Vector3();
        this.el.object3D.getWorldPosition(worldPos);
        const baseY = worldPos.y + 1;

        // Desactivo física del orbe 
        if (orb.body) {
            orb.body.velocity.set(0, 0, 0);
            orb.body.angularVelocity.set(0, 0, 0);
            orb.body.force.set(0, 0, 0);
            orb.body.torque.set(0, 0, 0);  
            orb.body.mass = 0;
            
            orb.removeAttribute('dynamic-body');
            orb.setAttribute('static-body', '');
        }

        orb.object3D.parent.worldToLocal(worldPos); // Convertir a coordenadas locales del padre (la sala)
        
        orb.object3D.position.set(
            worldPos.x,
            worldPos.y + 1,
            worldPos.z
        );
        console.log("Orbe en posición del pedestal:", orb.object3D.position);
        console.log("Posición del pedestal:", worldPos);

        //El orbe ya no es interactuable
        orb.removeAttribute('interactable');
        orb.classList.remove('interactable');

        requestAnimationFrame(() => {
            orb.setAttribute('animation__float', {
                property: 'position',
                dir: 'alternate',
                dur: 1500,
                loop: true,
                easing: 'easeInOutSine',
                to: `${worldPos.x} ${baseY + 0.1} ${worldPos.z}`
            });
            orb.setAttribute('light', {
                type: 'point',
                color: '#00ffff',
                intensity: 1,
                distance: 5
            });
            
            orb.setAttribute('animation__spin', {
                property: 'rotation',
                from: '0 0 0',
                to: '0 359.999 0',
                dur: 4000,
                loop: true,
                easing: 'linear'
            });
            orb.setAttribute('animation__glow', {
                property: 'material.emissiveIntensity',
                from: 0.5,
                to: 2,
                dur: 800,
                dir: 'alternate',
                loop: true
            });
        });

        if (orb.components.orb) {
            orb.components.orb.isCarried = false;
            orb.components.orb.holder = null;
            orb.components.orb.isPlaced = true;
        }

        // estado jugador
        window.playerState.hasOrb = false;
        window.playerState.currentOrb = null;

        // feedback visual
        this.el.setAttribute('material', 'emissive', '#00ffff', 'emissiveIntensity', 5);

        setTimeout(() => {
            this.emitToTargets();
        }, 300);
    }

    /*interact: function () {
        if (this.activated || !window.playerState.hasOrb) return;

        console.log("Colocando orbe en el pedestal");
        
        // Buscamos el orbe que tiene el jugador
        const orb = window.playerState.currentOrb || document.querySelector('[orb]');
        if (!orb) {
            console.warn("No se encontró el orbe");
            return;
        }
        
        // Lo sacamos de la cámara y lo ponemos en el pedestal
        this.el.appendChild(orb);
        orb.object3D.position.set(0, 0.5, 0);
        orb.object3D.rotation.set(0, 0, 0);
        orb.object3D.scale.set(1, 1, 1);
        orb.components.orb.isCarried = false;
        
        this.activated = true;
        window.playerState.hasOrb = false;

        
        this.el.setAttribute('material', 'color', '#00ffff', 'emissive', '#00ffff', 'emissiveIntensity', 5);
        orb.setAttribute('animation', {
            property: 'material.emissiveIntensity',
            to: 2,
            dur: 300
        });
        
        console.log("Target puerta:", this.data.target);
        
        setTimeout(() => {
            this.data.target.emit('openDoor');
        }, 300);
    }*/
});