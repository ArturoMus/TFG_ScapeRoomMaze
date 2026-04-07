// Componente base para objetos interactuables
AFRAME.registerComponent('interactable', {
    init: function () {
        this.el.addEventListener('click', () => {
            this.interact();
        });
    },

    interact: function () {
        // Aquí defines lo que pasa al interactuar
        // Por ejemplo, cambiar color
        this.el.setAttribute('color', '#'+Math.floor(Math.random()*16777215).toString(16));
        console.log("Interacción ejecutada en:", this.el);
    }
});

AFRAME.registerComponent('cursor-feedback', {
    init: function () {
        const cursor = this.el;
        cursor.addEventListener('mouseenter', () => cursor.setAttribute('material', 'opacity', 1));
        cursor.addEventListener('mouseleave', () => cursor.setAttribute('material', 'opacity', 0.5));
    }
});