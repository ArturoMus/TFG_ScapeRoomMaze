function generateLeverSolution(leverCount, roomId) {
    const seedText = `${window.mapSeed || 0}-${roomId}-levers`;
    const rng = createSeededRandom(seedText);

    const solution = [];

    for (let i = 0; i < leverCount; i++) {
        solution.push(rng() >= 0.5);
    }

    // Con esto evito soluciones que sean o todo abajo o todo arriba
    if (solution.every(value => value === false)) {
        solution[Math.floor(rng() * leverCount)] = true;
    }

    if (solution.every(value => value === true)) {
        solution[Math.floor(rng() * leverCount)] = false;
    }

    return solution;
}

AFRAME.registerComponent('puzzle-levers', {
    schema: {
        doorId: { type: 'string', default: '' },
        doorIds: { type: 'string', default: '' },
        leverCount: { type: 'number', default: 4 }
    },

    init: function () {
        this.room = this.el;
        this.roomSize = window.roomSize || 10;

        this.solution = generateLeverSolution(
            this.data.leverCount,
            this.room.id
        );

        this.current = new Array(this.data.leverCount).fill(false);

        this.isSolved = false;
        this.hasStarted = false;

        this.doors = lockPuzzleDoors(this.data);

        if (this.doors.length === 0) {
            console.warn("No se encontró ninguna puerta para puzzle-levers:", this.data);
            return;
        }

        const panelSetup = createLeverPuzzlePanel(this.room, this.roomSize, {
            solution: this.solution,

            onLeverToggle: (index) => {
                this.toggleLever(index);
            },

            onCheckClick: () => {
                this.checkSolution();
            }
        });

        this.leverHandles = panelSetup.leverHandles;
        this.checkText = panelSetup.checkText;

        console.log('[Levers] Solución:', this.solution);
    },

    toggleLever: function (index) {
        if (this.isSolved) return;

        if (!this.hasStarted) {
            this.hasStarted = true;

            if (typeof trackPuzzleStarted === 'function') {
                trackPuzzleStarted(this.room, this.data, {
                    leverCount: this.data.leverCount
                });
            }
        }

        this.current[index] = !this.current[index];

        const handle = this.leverHandles[index];

        if (handle) {
            setLeverVisual(handle, this.current[index]);
        }

        window.telemetry?.track('lever_toggled', {
            puzzleId: window.rooms?.[this.room.id]?.puzzle?.id || null,
            puzzleType: 'levers',
            roomId: this.room.id,
            leverIndex: index,
            value: this.current[index],
            current: [...this.current]
        }, {
            roomId: this.room.id
        });
    },

    checkSolution: function () {
        if (this.isSolved) return;

        if (!this.hasStarted) {
            this.hasStarted = true;

            if (typeof trackPuzzleStarted === 'function') {
                trackPuzzleStarted(this.room, this.data, {
                    leverCount: this.data.leverCount
                });
            }
        }

        if (typeof trackPuzzleAttemptStarted === 'function') {
            trackPuzzleAttemptStarted(this.room, this.data, {
                leverCount: this.data.leverCount,
                current: [...this.current]
            });
        }

        const isCorrect = this.current.every((value, index) => {
            return value === this.solution[index];
        });

        if (isCorrect) {
            this.solve();
        } else {
            this.fail();
        }
    },

    fail: function () {
        console.log('[Levers] Combinación incorrecta');

        if (typeof trackPuzzleFailed === 'function') {
            trackPuzzleFailed(this.room, this.data, {
                leverCount: this.data.leverCount,
                current: [...this.current]
            });
        }

        this.room.setAttribute('animation__lever_fail', {
            property: 'scale',
            to: '1.02 1.02 1.02',
            dur: 120,
            dir: 'alternate',
            loop: 2
        });

        if (this.checkText) {
            this.checkText.setAttribute('value', 'Incorrecto');

            setTimeout(() => {
                if (!this.isSolved) {
                    this.checkText.setAttribute('value', 'Comprobar');
                }
            }, 900);
        }
    },

    solve: function () {
        if (this.isSolved) return;

        this.isSolved = true;

        console.log('[Levers] Puzzle resuelto. Abriendo puertas:', getPuzzleDoorSelectors(this.data));

        if (typeof trackPuzzleSolved === 'function') {
            trackPuzzleSolved(this.room, this.data, {
                leverCount: this.data.leverCount,
                current: [...this.current]
            });
        }

        this.leverHandles.forEach(handle => {
            handle.setAttribute('material', {
                color: '#ffffff',
                emissive: '#ffffff',
                emissiveIntensity: 0.45
            });
        });

        if (this.checkText) {
            this.checkText.setAttribute('value', 'Correcto');
        }

        emitToPuzzleDoors(this.data, 'openDoor');
    }
});