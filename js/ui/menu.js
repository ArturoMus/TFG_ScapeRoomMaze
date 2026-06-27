

window.selectedPlayerProfile = {
    dominantHand: 'U',
    ageRange: '-1',
    genderIdentity: 'U'
};

const PLAYER_PROFILE_OPTIONS = {
    dominantHand: [
        { value: 'U', label: 'Desconocido' },
        { value: 'R', label: 'Diestro' },
        { value: 'L', label: 'Zurdo' }
    ],

    ageRange: [
        { value: '-1', label: 'Desconocido' },
        { value: '<12', label: '< 12' },
        { value: '12-15', label: '12-15' },
        { value: '16-18', label: '16-18' },
        { value: '19-35', label: '19-35' },
        { value: '36-50', label: '36-50' },
        { value: '>51', label: '> 51' }
    ],

    genderIdentity: [
        { value: 'U', label: 'Prefiero no contestar' },
        { value: 'M', label: 'Hombre' },
        { value: 'F', label: 'Mujer' },
        { value: 'N', label: 'No binario' }
    ]
};

window.getSelectedPlayerProfile = function () {
    return {
        dominantHand: window.selectedPlayerProfile?.dominantHand || 'U',
        ageRange: window.selectedPlayerProfile?.ageRange || '-1',
        genderIdentity: window.selectedPlayerProfile?.genderIdentity || 'U'
    };
};

AFRAME.registerComponent('main-menu', {
    init: function () {
        this.createPanel();
    },

    createPanel: function () {
        const panel = document.createElement('a-entity');
        panel.setAttribute('position', '0 0 0');

        const background = document.createElement('a-plane');
        background.setAttribute('width', '3.8');
        background.setAttribute('height', '4.15');
        background.setAttribute('material', {
            color: '#111',
            opacity: 0.88,
            transparent: true
        });
        panel.appendChild(background);

        const title = document.createElement('a-text');
        title.setAttribute('value', 'EL LABERINTO DEL MAGO');
        title.setAttribute('align', 'center');
        title.setAttribute('width', '4');
        title.setAttribute('position', '0 1.72 0.02');
        title.setAttribute('color', '#ffffff');
        panel.appendChild(title);

        const subtitle = document.createElement('a-text');
        subtitle.setAttribute('value', 'Explora la mazmorra, resuelve puzles y encuentra la salida.');
        subtitle.setAttribute('align', 'center');
        subtitle.setAttribute('width', '2.8');
        subtitle.setAttribute('position', '0 1.42 0.02');
        subtitle.setAttribute('color', '#cccccc');
        panel.appendChild(subtitle);

        const keyboard = document.createElement('a-entity');
        keyboard.setAttribute('vr-keyboard', 'maxLength: 13');
        keyboard.setAttribute('position', '0 0.64 0.08');
        keyboard.setAttribute('scale', '1.08 0.88 0.88');
        panel.appendChild(keyboard);

        const handSelector = this.createProfileOption(
            'Mano dominante',
            'dominantHand'
        );
        handSelector.setAttribute('position', '0 -0.68 0.12');
        panel.appendChild(handSelector);

        const ageSelector = this.createProfileOption(
            'Edad',
            'ageRange'
        );
        ageSelector.setAttribute('position', '0 -0.99 0.12');
        panel.appendChild(ageSelector);

        const genderSelector = this.createProfileOption(
            'Género',
            'genderIdentity'
        );
        genderSelector.setAttribute('position', '0 -1.30 0.12');
        panel.appendChild(genderSelector);

        const startButton = this.createButton('INICIAR PARTIDA', 'start');
        startButton.setAttribute('position', '0 -1.74 0.14');
        panel.appendChild(startButton);

        this.el.appendChild(panel);
    },

    createButton: function (label, action) {
        const wrapper = document.createElement('a-entity');

        const button = document.createElement('a-box');
        button.setAttribute('width', '1.25');
        button.setAttribute('height', '0.24');
        button.setAttribute('depth', '0.05');
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
        text.setAttribute('width', '2');
        text.setAttribute('position', '0 -0.034 0.04');
        text.setAttribute('color', '#ffffff');

        button.appendChild(text);
        wrapper.appendChild(button);

        return wrapper;
    },

    createProfileOption: function (label, field) {
        const wrapper = document.createElement('a-entity');
        const labelText = document.createElement('a-text');
        labelText.setAttribute('value', label);
        labelText.setAttribute('align', 'right');
        labelText.setAttribute('width', '1.4');
        labelText.setAttribute('position', '-0.72 -0.035 0.03');
        labelText.setAttribute('color', '#cccccc');
        wrapper.appendChild(labelText);

        const button = document.createElement('a-box');
        button.setAttribute('width', '1.18');
        button.setAttribute('height', '0.21');
        button.setAttribute('depth', '0.045');
        button.setAttribute('position', '0.48 0 0.04');
        button.setAttribute('class', 'interactable menu-button');
        button.setAttribute('interactable', '');
        button.setAttribute('menu-button', {
            action: 'profile-option',
            field: field
        });
        button.setAttribute('material', {
            color: '#2f4f75',
            opacity: 1
        });

        const valueText = document.createElement('a-text');
        valueText.setAttribute('align', 'center');
        valueText.setAttribute('width', '1.55');
        valueText.setAttribute('position', '0 -0.03 0.052');
        valueText.setAttribute('color', '#ffffff');

        button.appendChild(valueText);
        wrapper.appendChild(button);

        return wrapper;
    },
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

AFRAME.registerComponent('menu-button', {
    schema: {
        action: { type: 'string' },
        field: { type: 'string', default: '' }
    },

    init: function () {
        this.lastInteractionAt = 0;
        this.textEl = this.el.querySelector('a-text');

        this.el.addEventListener('mouseenter', () => {
            this.el.setAttribute('material', 'color', '#4f7fc0');
        });

        this.el.addEventListener('mouseleave', () => {
            const color = this.data.action === 'profile-option'
                ? '#2f4f75'
                : '#3a5f8f';

            this.el.setAttribute('material', 'color', color);
        });

        this.el.addEventListener('click', (event) => {
            event.stopPropagation();
            this.interact();
        });

        if (this.data.action === 'profile-option') {
            this.refreshProfileText();
        }
    },

    interact: function () {
        const now = performance.now();

        if (now - this.lastInteractionAt < 250) return;

        this.lastInteractionAt = now;

        if (this.data.action === 'start') {
            this.startGame();
            return;
        }

        if (this.data.action === 'profile-option') {
            this.nextProfileOption();
            return;
        }
    },

    startGame: function () {
        const alias = window.getSelectedPlayerAlias
            ? window.getSelectedPlayerAlias()
            : 'guest';

        const profile = window.getSelectedPlayerProfile
            ? window.getSelectedPlayerProfile()
            : {
                dominantHand: 'U',
                ageRange: '-1',
                genderIdentity: 'U'
            };

        window.selectedPlayerAlias = alias;
        window.selectedPlayerProfile = profile;

        if (window.gameState) {
            window.gameState.playerAlias = alias;
            window.gameState.dominantHand = profile.dominantHand;
            window.gameState.ageRange = profile.ageRange;
            window.gameState.genderIdentity = profile.genderIdentity;
        }

        window.startGameFromMenu?.();
    },

    nextProfileOption: function () {
        const field = this.data.field;
        const options = PLAYER_PROFILE_OPTIONS[field];

        if (!options || options.length === 0) return;

        if (!window.selectedPlayerProfile) {
            window.selectedPlayerProfile = {
                dominantHand: 'U',
                ageRange: '-1',
                genderIdentity: 'U'
            };
        }

        const currentValue = window.selectedPlayerProfile[field];
        const currentIndex = options.findIndex(option => option.value === currentValue);

        const nextIndex = currentIndex === -1
            ? 0
            : (currentIndex + 1) % options.length;

        window.selectedPlayerProfile[field] = options[nextIndex].value;

        this.refreshProfileText();
    },

    refreshProfileText: function () {
        const field = this.data.field;
        const options = PLAYER_PROFILE_OPTIONS[field];

        if (!options || !this.textEl) return;

        const currentValue = window.selectedPlayerProfile?.[field];
        const option = options.find(option => option.value === currentValue) || options[0];

        this.textEl.setAttribute('value', option.label);
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
        bg.setAttribute('width', '3.8');
        bg.setAttribute('height', '2.45');
        bg.setAttribute('material', {
            color: '#050505',
            opacity: 0.94,
            transparent: true
        });
        panel.appendChild(bg);

        this.title = document.createElement('a-text');
        this.title.setAttribute('value', '¡Has escapado!');
        this.title.setAttribute('align', 'center');
        this.title.setAttribute('width', '3.8');
        this.title.setAttribute('position', '0 0.98 0.03');
        this.title.setAttribute('color', '#ffffff');
        panel.appendChild(this.title);

        this.summaryText = document.createElement('a-text');
        this.summaryText.setAttribute('value', 'Cargando resumen...');
        this.summaryText.setAttribute('align', 'left');
        this.summaryText.setAttribute('width', '2.4');
        this.summaryText.setAttribute('position', '-1.68 0.58 0.03');
        this.summaryText.setAttribute('color', '#dddddd');
        panel.appendChild(this.summaryText);

        const heatmapTitle = document.createElement('a-text');
        heatmapTitle.setAttribute('value', 'Mapa de calor');
        heatmapTitle.setAttribute('align', 'center');
        heatmapTitle.setAttribute('width', '1.7');
        heatmapTitle.setAttribute('position', '0.95 0.58 0.03');
        heatmapTitle.setAttribute('color', '#ffffff');
        panel.appendChild(heatmapTitle);

        const heatmapBg = document.createElement('a-plane');
        heatmapBg.setAttribute('width', '1.55');
        heatmapBg.setAttribute('height', '1.1');
        heatmapBg.setAttribute('position', '0.95 -0.05 0.02');
        heatmapBg.setAttribute('material', {
            color: '#111111',
            opacity: 0.85,
            transparent: true
        });
        panel.appendChild(heatmapBg);

        this.heatmapRoot = document.createElement('a-entity');
        this.heatmapRoot.setAttribute('position', '0.95 -0.05 0.06');
        panel.appendChild(this.heatmapRoot);

        this.heatmapLegend = document.createElement('a-text');
        this.heatmapLegend.setAttribute('value', 'gris = no visitada | rojo = mas tiempo');
        this.heatmapLegend.setAttribute('align', 'center');
        this.heatmapLegend.setAttribute('width', '1.8');
        this.heatmapLegend.setAttribute('position', '0.95 -0.72 0.03');
        this.heatmapLegend.setAttribute('color', '#999999');
        panel.appendChild(this.heatmapLegend);

        this.detailText = document.createElement('a-text');
        this.detailText.setAttribute('value', '');
        this.detailText.setAttribute('align', 'left');
        this.detailText.setAttribute('width', '2.4');
        this.detailText.setAttribute('position', '-1.68 -0.45 0.03');
        this.detailText.setAttribute('color', '#aaaaaa');
        panel.appendChild(this.detailText);

        const restartButton = document.createElement('a-box');
        restartButton.setAttribute('width', '1.25');
        restartButton.setAttribute('height', '0.28');
        restartButton.setAttribute('depth', '0.05');
        restartButton.setAttribute('position', '0 -1.02 0.05');
        restartButton.setAttribute('class', 'interactable');
        restartButton.setAttribute('interactable', '');
        restartButton.setAttribute('restart-game-button', '');
        restartButton.setAttribute('material', {
            color: '#3a5f8f'
        });

        const restartText = document.createElement('a-text');
        restartText.setAttribute('value', 'REINICIAR');
        restartText.setAttribute('align', 'center');
        restartText.setAttribute('width', '1.8');
        restartText.setAttribute('position', '0 -0.038 0.05');
        restartText.setAttribute('color', '#ffffff');

        restartButton.appendChild(restartText);
        panel.appendChild(restartButton);

        this.el.appendChild(panel);
    },

    setTime: function (formattedTime) {
        if (!this.summaryText) return;

        this.summaryText.setAttribute('value', `Tiempo: ${formattedTime}`);
    },

    setSummary: function (summary) {
        if (!summary) return;

        this.title.setAttribute(
            'value',
            `¡Has escapado, ${summary.alias}!`
        );

        const summaryValue =
            `Tiempo: ${summary.time}\n` +
            `Salas visitadas: ${summary.visitedRooms}/${summary.totalRooms}\n` +
            `Puzzles resueltos: ${summary.puzzlesSolved}/${summary.puzzlesTotal}\n` +
            `Puertas abiertas: ${summary.doorsOpened}/${summary.doorsTotal}\n\n`;

        this.summaryText.setAttribute('value', summaryValue);

        const hottestRoom = summary.hottestRoom;

        const detailValue = hottestRoom
            ? `Sala con mas tiempo:\n${hottestRoom.id}\n${hottestRoom.seconds}s | ${hottestRoom.visits} visitas`
            : 'Sin datos suficientes de recorrido.';

        this.detailText.setAttribute('value', detailValue);

        this.renderHeatmap(summary.heatmap);
    },

    
    renderHeatmap: function (heatmap) {
        if (!this.heatmapRoot) return;

        while (this.heatmapRoot.firstChild) {
            this.heatmapRoot.removeChild(this.heatmapRoot.firstChild);
        }

        if (!heatmap?.rooms?.length) {
            const emptyText = document.createElement('a-text');
            emptyText.setAttribute('value', 'Sin datos');
            emptyText.setAttribute('align', 'center');
            emptyText.setAttribute('width', '1.4');
            emptyText.setAttribute('position', '0 -0.04 0.03');
            emptyText.setAttribute('color', '#aaaaaa');
            this.heatmapRoot.appendChild(emptyText);
            return;
        }

        const rooms = heatmap.rooms;

        // Calculo desde que coordenada hasta que coordenada hay que dibujar
        const minX = Math.min(...rooms.map(room => room.x));
        const maxX = Math.max(...rooms.map(room => room.x));
        const minZ = Math.min(...rooms.map(room => room.z));
        const maxZ = Math.max(...rooms.map(room => room.z));

        // Para saber la matriz del heatmap
        const cols = maxX - minX + 1;
        const rows = maxZ - minZ + 1;

        const gap = Math.min(0.18, 1.25 / Math.max(cols, rows));
        const cellSize = gap * 0.82;
        
        const mapWidth = (cols - 1) * gap;
        const mapHeight = (rows - 1) * gap;

        rooms.forEach(room => {

            // Con estocalculo la intensidad del mapa de calor, cuanto más tiempo 1 cuanto menos 0
            let intensity;

            if(room.isGoal){
                intensity = 0.20
            }
            else{
                intensity = room.timeMs > 0
                ? room.timeMs / heatmap.maxTimeMs
                : 0;
            }

            const cell = document.createElement('a-plane');

            cell.setAttribute('width', cellSize);
            cell.setAttribute('height', cellSize);

            // Con esto convierto las coordenadas del mapa a la posición visual dentro del panel
            const localX = ((room.x - minX) * gap) - (mapWidth / 2);
            const localY = -((room.z - minZ) * gap) + (mapHeight / 2);

            cell.setAttribute('position', `${localX} ${localY} 0.03`);

            cell.setAttribute('material', {
                color: this.getHeatmapColor(intensity, room),
                opacity: room.timeMs > 0 ? 0.95 : 0.35,
                transparent: true,
                shader: 'flat'
            });

            this.heatmapRoot.appendChild(cell);

            // MIRAAAAAR NO SALEEE
            if (room.isStart || room.isGoal) {
                const marker = document.createElement('a-text');
                marker.setAttribute('value', room.isStart ? 'I' : 'F');
                marker.setAttribute('align', 'center');
                marker.setAttribute('baseline', 'center');
                marker.setAttribute('width', `${cellSize * 8.5}`);
                marker.setAttribute('position', `${localX} ${localY - cellSize * 0.06} 0.07`);
                marker.setAttribute('color', '#000000');
                this.heatmapRoot.appendChild(marker);
            }
        });
    },

    getHeatmapColor: function (intensity, room) {
        if (room.timeMs <= 0) {
            return '#333333';
        }

        if (intensity < 0.25) {
            return '#355c7d';
        }

        if (intensity < 0.5) {
            return '#6c5b7b';
        }

        if (intensity < 0.75) {
            return '#c06c84';
        }

        return '#f67280';
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