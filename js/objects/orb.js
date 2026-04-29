

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

    release: function () {


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

            this.el.body.velocity.y = -0.1;

            /*const camera = document.querySelector('[camera]');
            const dir = new THREE.Vector3();
            camera.object3D.getWorldDirection(dir);
            dir.negate();

            this.el.body.applyImpulse(
                new CANNON.Vec3(dir.x * 3, dir.y * 3, dir.z * 3),
                this.el.body.position
            );*/
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
        /*const targetPos = new THREE.Vector3();
        this.holder.object3D.getWorldPosition(targetPos);

        if(this.holder.components.camera) {
            const camWorldDir = new THREE.Vector3();
            this.holder.object3D.getWorldDirection(camWorldDir);
            // como camWorldDir suele apuntar hacia atrás, multiplip por negativo para ir al frente
            targetPos.add(camWorldDir.multiplyScalar(-1.2));
            targetPos.y -= 0.3; // Bajamos un poco el orbe para que quede a la altura de las manos 
        }

        // En lugar de sumar a la posición (que es lo que hacía el lerp manual), 
        // para evitar que se quede bloqueado, vamos a asignar la posición suavemente 
        // pero solo mientras isCarried sea true.
        
        this.el.body.position.set(
            targetPos.x,
            targetPos.y,
            targetPos.z
        );*/
    }


    /*interact: function () {
        
        if (window.playerState.hasOrb && window.playerState.currentOrb !== this.el) {
            return;
        }

        if (!this.isCarried) {

            this.isCarried = true;

            console.log("Orbe agarrado");

            window.playerState.hasOrb = true;
            window.playerState.currentOrb = this.el;

            console.warn("Para ver si el orbe tiene body:", this.el.body);
            this.el.body.velocity.set(0, 0, 0);
            this.el.body.angularVelocity.set(0, 0, 0);

            // Lo emparentamos al jugador para que se mueva con él
            // Si es PC, lo pegamos a la cámara. Si es VR, idealmente a la mano.
            /*const holder = document.querySelector('#orb-holder');
            holder.appendChild(this.el);

            this.el.setAttribute('position', '0 0 0');
            
            // Posición relativa frente a la cara/mano
            this.el.setAttribute('position', '0.3 -0.3 -0.5'); 
            this.el.setAttribute('scale', '0.5 0.5 0.5'); // Lo hacemos un poco más pequeño al llevarlo*/
        //}
        /*else {

            this.isCarried = false;

            console.log("Orbe soltado");

            window.playerState.hasOrb = false;

            // Lo soltamos en la posición actual del jugador
            const dir = new THREE.Vector3();
            this.camera.object3D.getWorldDirection(dir);

            this.el.body.applyImpulse(
                new CANNON.Vec3(dir.x * 2, dir.y * 2, dir.z * 2), 
                this.el.body.position
            );
        }
    },

    tick: function () {

        if (!this.isCarried || window.playerState.currentOrb !== this.el) return;

        // Actualizamos la posición del orbe para que siga la camara
        const camWorldPos = new THREE.Vector3();
        this.camera.object3D.getWorldPosition(camWorldPos);

        // Calculamos la dirección hacia adelante de la cámara
        const camWorldDir = new THREE.Vector3();
        this.camera.object3D.getWorldDirection(camWorldDir);

        const targetPos = camWorldPos.clone().add(camWorldDir.multiplyScalar(1)); // Posición a 1 metro frente a la cámara

        const currentPos = new THREE.Vector3();
        this.el.object3D.getWorldPosition(currentPos);

        const force = new THREE.Vector3().subVectors(targetPos, currentPos);

        this.el.body.applyForce(
            new CANNON.Vec3(force.x * 10, force.y * 10, force.z * 10),
            this.el.body.position
        );
    }*/
});