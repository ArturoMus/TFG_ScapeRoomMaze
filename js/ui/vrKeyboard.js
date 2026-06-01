window.selectedPlayerAlias = window.selectedPlayerAlias || 'guest';

window.getSelectedPlayerAlias = function () {
    const rawAlias = window.selectedPlayerAlias || 'guest';

    const cleanAlias = String(rawAlias)
        .trim()
        .replace(/\s+/g, '_')
        .slice(0, 12);

    return cleanAlias || 'guest';
};

AFRAME.registerComponent('vr-keyboard', {
    schema: {
        maxLength: { type: 'number', default: 12 }
    },

    init: function () {
        this.value = '';
        this.displayText = null;
        this.statusText = null;

        this.createKeyboard();
        this.commitAlias();
        this.updateDisplay();
    },

    createKeyboard: function () {

        const displayBg = document.createElement('a-plane');
        displayBg.setAttribute('width', '2.3');
        displayBg.setAttribute('height', '0.26');
        displayBg.setAttribute('position', '0 0.35 0.01');
        displayBg.setAttribute('material', {
            color: '#222222',
            opacity: 0.95
        });
        this.el.appendChild(displayBg);

        this.displayText = document.createElement('a-text');
        this.displayText.setAttribute('value', 'Alias: _');
        this.displayText.setAttribute('align', 'center');
        this.displayText.setAttribute('width', '2.6');
        this.displayText.setAttribute('position', '0 0.31 0.04');
        this.displayText.setAttribute('color', '#dddddd');
        this.el.appendChild(this.displayText);

        this.statusText = document.createElement('a-text');
        this.statusText.setAttribute('value', 'Pulsa las teclas con el laser');
        this.statusText.setAttribute('align', 'center');
        this.statusText.setAttribute('width', '2.4');
        this.statusText.setAttribute('position', '0 0.15 0.04');
        this.statusText.setAttribute('color', '#888888');
        this.el.appendChild(this.statusText);

        const rows = [
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
            ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
            ['DEL', 'SPACE', 'OK']
        ];

        const rowStartY = -0.08;
        const rowGap = 0.25;

        rows.forEach((keys, rowIndex) => {
            const row = document.createElement('a-entity');
            row.setAttribute('position', `0 ${rowStartY - rowIndex * rowGap} 0.04`);

            const totalWidth = this.getRowWidth(keys);
            let currentX = -totalWidth / 2;

            keys.forEach(key => {
                const keyWidth = this.getKeyWidth(key);
                const keyEl = this.createKey(key, keyWidth);

                keyEl.setAttribute('position', `${currentX + keyWidth / 2} 0 0`);
                row.appendChild(keyEl);

                currentX += keyWidth + 0.04;
            });

            this.el.appendChild(row);
        });
    },

    getKeyWidth: function (key) {
        if (key === 'SPACE') return 0.75;
        if (key === 'DEL') return 0.46;
        if (key === 'OK') return 0.46;
        return 0.2;
    },

    getRowWidth: function (keys) {
        return keys.reduce((total, key, index) => {
            const gap = index === keys.length - 1 ? 0 : 0.04;
            return total + this.getKeyWidth(key) + gap;
        }, 0);
    },

    createKey: function (key, width) {
        const button = document.createElement('a-box');

        button.setAttribute('width', width);
        button.setAttribute('height', '0.2');
        button.setAttribute('depth', '0.045');
        button.setAttribute('class', 'interactable keyboard-key');
        button.setAttribute('interactable', '');
        button.setAttribute('vr-keyboard-key', {
            key: key
        });

        button.setAttribute('material', {
            color: key === 'OK' ? '#2f7d4f' : '#3a5f8f',
            opacity: 1
        });

        const label = document.createElement('a-text');
        label.setAttribute('value', key === 'SPACE' ? 'ESPACIO' : key);
        label.setAttribute('align', 'center');
        label.setAttribute('width', key.length > 1 ? '1.4' : '0.8');
        label.setAttribute('position', '0 -0.035 0.04');
        label.setAttribute('color', '#ffffff');

        button.appendChild(label);

        return button;
    },

    pressKey: function (key) {
        if (key === 'DEL') {
            this.value = this.value.slice(0, -1);
        }
        else if (key === 'SPACE') {
            if (this.value.length < this.data.maxLength) {
                this.value += '_';
            }
        }
        else if (key === 'OK') {
            this.commitAlias();

            if (this.statusText) {
                this.statusText.setAttribute('value', `Alias guardado: ${window.getSelectedPlayerAlias()}`);
                this.statusText.setAttribute('color', '#88ffbb');
            }
        }
        else {
            if (this.value.length < this.data.maxLength) {
                this.value += key;
            }
        }

        this.commitAlias();
        this.updateDisplay();
    },

    commitAlias: function () {
        const alias = this.value || 'guest';

        window.selectedPlayerAlias = alias;

        if (window.gameState) {
            window.gameState.playerAlias = alias;
        }
    },

    updateDisplay: function () {
        if (!this.displayText) return;

        this.displayText.setAttribute(
            'value',
            `Alias: ${this.value || '_'}`
        );
    }
});

AFRAME.registerComponent('vr-keyboard-key', {
    schema: {
        key: { type: 'string' }
    },

    init: function () {
        this.lastPressTime = 0;

        this.baseColor = this.data.key === 'OK'
            ? '#2f7d4f'
            : '#3a5f8f';

        this.hoverColor = this.data.key === 'OK'
            ? '#3fae6f'
            : '#4f7fc0';

        this.el.addEventListener('mouseenter', () => {
            this.el.setAttribute('material', 'color', this.hoverColor);
        });

        this.el.addEventListener('mouseleave', () => {
            this.el.setAttribute('material', 'color', this.baseColor);
        });
    },

    interact: function () {
        const now = performance.now();

        if (now - this.lastPressTime < 180) return;
        this.lastPressTime = now;

        const keyboardEl = this.el.closest('[vr-keyboard]');

        if (!keyboardEl?.components?.['vr-keyboard']) {
            console.warn('[vr-keyboard-key] No se encontró el teclado padre');
            return;
        }

        keyboardEl.components['vr-keyboard'].pressKey(this.data.key);
    }
});