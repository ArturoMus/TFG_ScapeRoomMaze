
function getSymbolClueCandidateRoomIds(room, progressionPlan) {
    const roomShortId = room.id.replace('room-', '');
    const ancestors = getAncestorRoomIds(roomShortId, progressionPlan);

    if (ancestors.length === 0) {
        return [];
    }

    let lastSymbolPuzzleIndex = -1;

    ancestors.forEach((ancestorId, index) => {
        const ancestorRoom = window.rooms?.[`room-${ancestorId}`];

        if (ancestorRoom?.puzzle?.type === 'symbol') {
            lastSymbolPuzzleIndex = index;
        }
    });

    return ancestors.slice(lastSymbolPuzzleIndex + 1);
}

function createSymbolPuzzleProgressionData(room, progressionPlan) {
    const candidates = getSymbolClueCandidateRoomIds(room, progressionPlan);

    if (candidates.length === 0) {
        console.warn('[SymbolPuzzle] No hay habitaciones candidatas para pista:', room.id);

        return {
            symbolIndex: 0,
            clueRoomId: null
        };
    }

    const seedText = `${progressionPlan.seed}-${room.id}-symbol`;
    const rng = createSeededRandom(seedText);

    const clueShortId = candidates[Math.floor(rng() * candidates.length)];
    const symbolIndex = Math.floor(rng() * SYMBOL_ASSETS.length);

    return {
        symbolIndex,
        clueRoomId: `room-${clueShortId}`
    };
}

AFRAME.registerComponent('puzzle-symbol', {
    schema: {
        doorId: { type: 'string', default: '' },
        doorIds: { type: 'string', default: '' },
        symbolIndex: { type: 'number', default: 0 },
        clueRoomId: { type: 'string', default: '' }
    },

    init: function () {
        this.room = this.el;
        this.roomSize = window.roomSize || 10;

        this.isSolved = false;
        this.hasStarted = false;

        this.doors = lockPuzzleDoors(this.data);

        if (this.doors.length === 0) {
            console.warn("No se encontró ninguna puerta para puzzle-symbol:", this.data);
            return;
        }

        const clueRoomEl = document.getElementById(this.data.clueRoomId);

        if (!clueRoomEl) {
            console.warn('[Symbol] No se encontró la sala de la pista:', this.data.clueRoomId);
        } else {
            this.clue = createSymbolClue(
                clueRoomEl,
                this.data.symbolIndex,
                this.roomSize
            );
        }

        const panelSetup = createSymbolPuzzlePanel(this.room, this.roomSize, {
            onSymbolClick: (index) => {
                this.selectSymbol(index);
            }
        });

        this.symbolButtons = panelSetup.symbolButtons;

        console.log(
            '[Symbol] Puzzle creado en', this.room.id, 'símbolo correcto:', this.data.symbolIndex, 'pista en:', this.data.clueRoomId
        );
    },

    selectSymbol: function (index) {
        if (this.isSolved) return;

        if (!this.hasStarted) {
            this.hasStarted = true;

            if (typeof trackPuzzleStarted === 'function') {
                trackPuzzleStarted(this.room, this.data, {
                    symbolIndex: this.data.symbolIndex,
                    clueRoomId: this.data.clueRoomId
                });
            }
        }

        if (typeof trackPuzzleAttemptStarted === 'function') {
            trackPuzzleAttemptStarted(this.room, this.data, {
                selectedSymbolIndex: index,
                correctSymbolIndex: this.data.symbolIndex,
                clueRoomId: this.data.clueRoomId
            });
        }

        window.telemetry?.track('symbol_selected', {
            puzzleId: window.rooms?.[this.room.id]?.puzzle?.id || null,
            puzzleType: 'symbol',
            roomId: this.room.id,
            selectedSymbolIndex: index,
            correctSymbolIndex: this.data.symbolIndex,
            clueRoomId: this.data.clueRoomId
        }, {
            roomId: this.room.id
        });

        if (index === this.data.symbolIndex) {
            this.solve(index);
        } else {
            this.fail(index);
        }
    },

    fail: function (index) {
        console.log('[Symbol] Símbolo incorrecto:', index);

        if (typeof trackPuzzleFailed === 'function') {
            trackPuzzleFailed(this.room, this.data, {
                selectedSymbolIndex: index,
                correctSymbolIndex: this.data.symbolIndex,
                clueRoomId: this.data.clueRoomId
            });
        }

        const button = this.symbolButtons[index];

        if (button) {
            button.setAttribute('animation__symbol_fail', {
                property: 'scale',
                to: '1.18 1.18 1.18',
                dur: 120,
                dir: 'alternate',
                loop: 2
            });

            button.setAttribute('material', 'color', '#8f3333');

            setTimeout(() => {
                if (!this.isSolved) {
                    button.setAttribute('material', 'color', '#3a3a3a');
                }
            }, 700);
        }
    },

    solve: function (index) {
        if (this.isSolved) return;

        this.isSolved = true;

        console.log('[Symbol] Puzzle resuelto. Abriendo puertas:', getPuzzleDoorSelectors(this.data));

        if (typeof trackPuzzleSolved === 'function') {
            trackPuzzleSolved(this.room, this.data, {
                selectedSymbolIndex: index,
                correctSymbolIndex: this.data.symbolIndex,
                clueRoomId: this.data.clueRoomId
            });
        }

        this.symbolButtons.forEach((button, buttonIndex) => {
            if (buttonIndex === index) {
                button.setAttribute('material', {
                    color: '#ffffff',
                    emissive: '#ffffff',
                    emissiveIntensity: 0.45
                });
            } else {
                button.setAttribute('material', {
                    color: '#222222',
                    emissive: '#000000',
                    emissiveIntensity: 0
                });
            }
        });

        emitToPuzzleDoors(this.data, 'openDoor');
    }
});