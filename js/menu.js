

// REVISAR TODO ESTO

AFRAME.registerComponent('main-menu', {
    init: function () {
        this.createPanel();
    },

    createPanel: function () {
        const panel = document.createElement('a-entity');
        panel.setAttribute('position', '0 0 0');

        const background = document.createElement('a-plane');
        background.setAttribute('width', '2.8');
        background.setAttribute('height', '1.8');
        background.setAttribute('material', {
            color: '#111',
            opacity: 0.88,
            transparent: true
        });
        panel.appendChild(background);

        const title = document.createElement('a-text');
        title.setAttribute('value', 'EL LABERINTO DEL MAGO');
        title.setAttribute('align', 'center');
        title.setAttribute('width', '3.8');
        title.setAttribute('position', '0 0.55 0.02');
        title.setAttribute('color', '#ffffff');
        panel.appendChild(title);

        const subtitle = document.createElement('a-text');
        subtitle.setAttribute('value', 'Explora la mazmorra, resuelve puzzles y encuentra la salida.');
        subtitle.setAttribute('align', 'center');
        subtitle.setAttribute('width', '2.4');
        subtitle.setAttribute('position', '0 0.22 0.02');
        subtitle.setAttribute('color', '#cccccc');
        panel.appendChild(subtitle);

        // Placeholder para futuro nombre de jugador
        const nameBox = document.createElement('a-plane');
        nameBox.setAttribute('width', '1.8');
        nameBox.setAttribute('height', '0.28');
        nameBox.setAttribute('position', '0 -0.08 0.02');
        nameBox.setAttribute('material', {
            color: '#222',
            opacity: 0.95
        });
        panel.appendChild(nameBox);

        const nameText = document.createElement('a-text');
        nameText.setAttribute('value', 'Buena suerte explorador');
        nameText.setAttribute('align', 'center');
        nameText.setAttribute('width', '2.2');
        nameText.setAttribute('position', '0 -0.13 0.04');
        nameText.setAttribute('color', '#aaaaaa');
        panel.appendChild(nameText);

        const startButton = this.createButton('INICIAR PARTIDA', 'start');
        startButton.setAttribute('position', '0 -0.52 0.04');
        panel.appendChild(startButton);

        this.el.appendChild(panel);
    },

    createButton: function (label, action) {
        const wrapper = document.createElement('a-entity');

        const button = document.createElement('a-box');
        button.setAttribute('width', '1.55');
        button.setAttribute('height', '0.34');
        button.setAttribute('depth', '0.06');
        button.setAttribute('class', 'interactable menu-button');
        button.setAttribute('interactable', '');
        button.setAttribute('menu-button', {
            action: action
        });
        button.setAttribute('material', {
            color: '#3a5f8f',
            opacity: 1
        });

        const text = document.createElement('a-text');
        text.setAttribute('value', label);
        text.setAttribute('align', 'center');
        text.setAttribute('width', '2.5');
        text.setAttribute('position', '0 -0.045 0.04');
        text.setAttribute('color', '#ffffff');

        button.appendChild(text);
        wrapper.appendChild(button);

        return wrapper;
    }
});


AFRAME.registerComponent('menu-button', {
    schema: {
        action: { type: 'string' }
    },

    init: function () {
        this.el.addEventListener('mouseenter', () => {
            this.el.setAttribute('material', 'color', '#4f7fc0');
        });

        this.el.addEventListener('mouseleave', () => {
            this.el.setAttribute('material', 'color', '#3a5f8f');
        });

        // Fallback por si interactable no llama a interact en algún caso
        this.el.addEventListener('click', () => {
            this.interact();
        });
    },

    interact: function () {
        if (this.data.action === 'start') {
            window.startGameFromMenu?.();
        }
    }
});


AFRAME.registerComponent('vr-loading-screen', {
    init: function () {
        this.createPanel();
        this.hide();
    },

    createPanel: function () {
        const background = document.createElement('a-plane');
        background.setAttribute('width', '3');
        background.setAttribute('height', '1.7');
        background.setAttribute('material', {
            color: '#050505',
            opacity: 0.92,
            transparent: true
        });
        this.el.appendChild(background);

        this.title = document.createElement('a-text');
        this.title.setAttribute('align', 'center');
        this.title.setAttribute('width', '3.2');
        this.title.setAttribute('position', '0 0.42 0.02');
        this.title.setAttribute('color', '#ffffff');
        this.el.appendChild(this.title);

        this.body = document.createElement('a-text');
        this.body.setAttribute('align', 'center');
        this.body.setAttribute('width', '2.6');
        this.body.setAttribute('position', '0 0.02 0.02');
        this.body.setAttribute('color', '#cccccc');
        this.el.appendChild(this.body);

        this.hint = document.createElement('a-text');
        this.hint.setAttribute('align', 'center');
        this.hint.setAttribute('width', '2.4');
        this.hint.setAttribute('position', '0 -0.48 0.02');
        this.hint.setAttribute('color', '#888888');
        this.el.appendChild(this.hint);
    },

    setContent: function (title, body, hint = '') {
        this.title.setAttribute('value', title);
        this.body.setAttribute('value', body);
        this.hint.setAttribute('value', hint);
    },

    show: function () {
        this.el.setAttribute('visible', true);
    },

    hide: function () {
        this.el.setAttribute('visible', false);
    }
});

AFRAME.registerComponent('vr-end-screen', {
    init: function () {
        this.createPanel();
        this.hide();
    },

    createPanel: function () {
        const panel = document.createElement('a-entity');

        const bg = document.createElement('a-plane');
        bg.setAttribute('width', '3');
        bg.setAttribute('height', '1.8');
        bg.setAttribute('material', {
            color: '#050505',
            opacity: 0.92,
            transparent: true
        });
        panel.appendChild(bg);

        this.title = document.createElement('a-text');
        this.title.setAttribute('value', '¡Has escapado!');
        this.title.setAttribute('align', 'center');
        this.title.setAttribute('width', '3.2');
        this.title.setAttribute('position', '0 0.55 0.03');
        this.title.setAttribute('color', '#ffffff');
        panel.appendChild(this.title);

        this.timeText = document.createElement('a-text');
        this.timeText.setAttribute('value', 'Tiempo: --:--');
        this.timeText.setAttribute('align', 'center');
        this.timeText.setAttribute('width', '2.8');
        this.timeText.setAttribute('position', '0 0.18 0.03');
        this.timeText.setAttribute('color', '#cccccc');
        panel.appendChild(this.timeText);

        const objective = document.createElement('a-text');
        objective.setAttribute('value', 'Has encontrado la salida de la mazmorra, enhorabuena explorador!');
        objective.setAttribute('align', 'center');
        objective.setAttribute('width', '2.4');
        objective.setAttribute('position', '0 -0.15 0.03');
        objective.setAttribute('color', '#999999');
        panel.appendChild(objective);

        const restartButton = document.createElement('a-box');
        restartButton.setAttribute('width', '1.55');
        restartButton.setAttribute('height', '0.34');
        restartButton.setAttribute('depth', '0.06');
        restartButton.setAttribute('position', '0 -0.58 0.04');
        restartButton.setAttribute('class', 'interactable');
        restartButton.setAttribute('interactable', '');
        restartButton.setAttribute('restart-game-button', '');
        restartButton.setAttribute('material', {
            color: '#3a5f8f'
        });

        const restartText = document.createElement('a-text');
        restartText.setAttribute('value', 'REINICIAR');
        restartText.setAttribute('align', 'center');
        restartText.setAttribute('width', '2.2');
        restartText.setAttribute('position', '0 -0.045 0.05');
        restartText.setAttribute('color', '#ffffff');

        restartButton.appendChild(restartText);
        panel.appendChild(restartButton);

        this.el.appendChild(panel);
    },

    setTime: function (formattedTime) {
        this.timeText.setAttribute('value', `Tiempo: ${formattedTime}`);
    },

    show: function () {
        this.el.setAttribute('visible', true);
    },

    hide: function () {
        this.el.setAttribute('visible', false);
    }
});


AFRAME.registerComponent('restart-game-button', {
    init: function () {
        this.el.addEventListener('mouseenter', () => {
            this.el.setAttribute('material', 'color', '#4f7fc0');
        });

        this.el.addEventListener('mouseleave', () => {
            this.el.setAttribute('material', 'color', '#3a5f8f');
        });

        this.el.addEventListener('click', () => {
            this.interact();
        });
    },

    interact: function () {
        window.location.reload();
    }
});