// Componente base para objetos interactuables
AFRAME.registerComponent('interactable', {
    init: function () {

        this.el.addEventListener('click', () => {
            console.log("CLICK detectado en:", this.el);
            let currentEl = this.el;
            while (currentEl) {
                console.log("Revisando:", currentEl);
                for (let compName in currentEl.components) {
                    let comp = currentEl.components[compName];
                    if (typeof comp.interact === 'function') {
                        comp.interact();
                        return;
                    }
                }
                currentEl = currentEl.parentEl;
            }
            // fallback
            this.defaultInteract();
        });
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
