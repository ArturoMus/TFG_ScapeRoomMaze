AFRAME.registerComponent('puzzle-memory-match', {
    schema: {
        doorId: { type: 'string', default: '' },
        doorIds: { type: 'string', default: '' },
        length: { type: 'number', default: 4 },
        showSpeed: { type: 'number', default: 650 }
    },

    init: function () {
        this.room = this.el;
        this.roomSize = window.roomSize || 10;

        this.sequence = [];
        this.input = [];
        this.pads = [];

        this.isShowing = false;
        this.isSolved = false;
        this.hasStarted = false;
        this.canBePressed = false;

        this.doors = lockPuzzleDoors(this.data);

        if (this.doors.length === 0) {
            console.warn("No se encontró ninguna puerta para puzzle-memory-match:", this.data);
            return;
        }

        const panelSetup = createMemoryPuzzlePanel(this.room, this.roomSize, {
            canHover: () => {
                return this.canBePressed && !this.isShowing && !this.isSolved;
            },
            onPadClick: (index) => {
                this.handlePadPress(index);
            },
            onStartClick: () => {
                this.startPattern();
            }
        });

        this.pads = panelSetup.pads;
        this.startButton = panelSetup.startButton;
        this.startText = panelSetup.startText;

        console.log('[Memory] Esperando a que el jugador inicie el patrón');
    },

    generateSequence: function () {
        this.sequence = [];

        for (let i = 0; i < this.data.length; i++) {
            const index = Math.floor(Math.random() * this.pads.length);
            this.sequence.push(index);
        }

        console.log('[Memory] Secuencia:', this.sequence);
    },

    handlePadPress: function (index) {
        if (this.isSolved) return;
        if (this.isShowing) return;
        if (!this.hasStarted) return;
        if (!this.canBePressed) return;
        if (this.sequence.length === 0) return;

        this.flashPad(index);

        this.input.push(index);

        const currentIndex = this.input.length - 1;

        if (this.input[currentIndex] !== this.sequence[currentIndex]) {
            this.fail();
            return;
        }

        if (this.input.length === this.sequence.length) {
            this.solve();
        }
    },

    showSequence: function () {
        if (this.isSolved) return;

        this.isShowing = true;
        this.canBePressed = false;
        this.input = [];

        let delay = 400;

        this.sequence.forEach((padIndex) => {
            setTimeout(() => {
                this.flashPad(padIndex);
            }, delay);

            delay += this.data.showSpeed;
        });

        setTimeout(() => {
            if (this.isSolved) return;

            this.isShowing = false;
            this.canBePressed = true;

            if (this.startText) {
                this.startText.setAttribute('value', 'Reiniciar');
            }

            console.log('[Memory] Turno del jugador');
        }, delay + 150);
    },

    flashPad: function (index) {
        const pad = this.pads[index];
        if (!pad) return;

        pad.setAttribute('material', {
            color: pad.activeColor,
            emissive: pad.activeColor,
            emissiveIntensity: 1
        });

        pad.setAttribute('scale', '1.15 1.15 1.15');

        setTimeout(() => {
            if (this.isSolved) return;

            pad.setAttribute('material', {
                color: pad.baseColor,
                emissive: pad.baseColor,
                emissiveIntensity: 0.05
            });

            pad.setAttribute('scale', '1 1 1');
        }, 300);
    },

    fail: function () {
        console.log('[Memory] Patrón incorrecto. Esperando reintento.');

        window.telemetry?.track('puzzle_failed', {
            puzzleType: 'memory',
            roomId: this.room?.id || this.el?.id || null,
            input: [...this.input],
            expectedLength: this.data.length
        });

        this.input = [];
        this.sequence = [];
        this.isShowing = false;
        this.hasStarted = false;
        this.canBePressed = false;

        this.el.setAttribute('animation__memory_fail', {
            property: 'scale',
            to: '1.03 1.03 1.03',
            dur: 120,
            dir: 'alternate',
            loop: 2
        });

        if (this.startText) {
            this.startText.setAttribute('value', 'Reintentar');
        }
    },

    startPattern: function () {
        if (this.isSolved) return;
        if (this.isShowing) return;

        window.telemetry?.track('puzzle_started', {
            puzzleType: 'memory',
            roomId: this.room?.id || this.el?.id || null,
            length: this.data.length
        });

        this.hasStarted = true;
        this.canBePressed = false;
        this.input = [];

        this.generateSequence();

        if (this.startText) {
            this.startText.setAttribute('value', 'Mira el patron');
        }

        this.showSequence();
    },

    resetPuzzle: function(){
        this.input = [];
        this.generateSequence();
        this.showSequence();
    },

    solve: function () {
        this.isSolved = true;
        this.isShowing = false;

        console.log('[Memory] Puzzle resuelto. Abriendo puertas:', getPuzzleDoorSelectors(this.data));

        window.telemetry?.track('puzzle_solved', {
            puzzleType: 'memory',
            roomId: this.room?.id || this.el?.id || null
        });

        this.pads.forEach(pad => {
            pad.setAttribute('material', {
                color: '#ffffff',
                emissive: '#ffffff',
                emissiveIntensity: 0.5
            });

            pad.setAttribute('scale', '1 1 1');
        });

        emitToPuzzleDoors(this.data, 'openDoor');
    }
});