// Componente base para objetos interactuables
AFRAME.registerComponent('interactable', {
    init: function () {

        this.lastInteractTime = 0;

        const handler = (evt) => {
            const now = performance.now();
            if (now - this.lastInteractTime < 250) return; // bloqueo anti doble input
            this.lastInteractTime = now;

            this.tryInteract(evt);
        };

        // Este modo es para pc
        this.el.addEventListener('click', (evt) => {
            if (this.el.classList.contains('grabbable')) return;
            console.log("CLICK detectado en:", this.el);
            handler(evt);
        });

        // Para vr (super-hands usa estos eventos)
        this.el.addEventListener('grab-start', (evt) => {
            handler(evt);
        });

        // Si luego usara raycasters en vr
        this.el.addEventListener('triggerdown', (evt) => {
            if (this.el.classList.contains('grabbable')) return;
            handler(evt);
        });
    },

    tryInteract: function (evt) {
            let currentEl = this.el;
            while (currentEl) {
                console.log("Revisando:", currentEl);
                for (let compName in currentEl.components) {
                    let comp = currentEl.components[compName];
                    if (typeof comp.interact === 'function') {
                        comp.interact(evt);
                        return;
                    }
                }
                currentEl = currentEl.parentEl;
            }
            // fallback
            this.defaultInteract();
    },

    defaultInteract: function () {
        this.el.setAttribute('color', '#'+Math.floor(Math.random()*16777215).toString(16));
        console.log("Interacción por defecto");
    }
});

AFRAME.registerComponent('cursor-feedback', {
    init: function () {
        const cursor = this.el;
        cursor.addEventListener('mouseenter', () => cursor.setAttribute('material', 'opacity', 1));
        cursor.addEventListener('mouseleave', () => cursor.setAttribute('material', 'opacity', 0.5));
    }
});
