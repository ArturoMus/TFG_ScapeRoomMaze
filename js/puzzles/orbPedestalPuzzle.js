AFRAME.registerComponent('puzzle-orb-pedestal', {
    schema: {
        doorId: { type: 'string', default: '' },
        doorIds: { type: 'string', default: '' },
        prevRoomId: { type: 'string' }
    },

    init: function () {
        this.currentRoom = this.el;
        this.isSolved = false;

        const prevRoom = document.getElementById(this.data.prevRoomId);

        const targets = getPuzzleDoorSelectors(this.data);
        const puzzleID = getFirstPuzzleDoorId(this.data);

        if (!targets || !puzzleID) {
            console.warn('[Orbe] Puzzle sin targets válidos:', this.data);
            return;
        }

        // Bloquear todas las puertas objetivo
        /*getPuzzleDoorElements(this.data).forEach(doorEl => {
            if (doorEl.components?.door) {
                doorEl.components.door.isLocked = true;
            }

            if (doorEl.doorData) {
                doorEl.doorData.isLocked = true;
            }
        });*/
        this.doors = lockPuzzleDoors(this.data);

        // El orbe aparece en la habitación anterior
        if (prevRoom) {
            const orb = createOrb('0 1.6 0', {
                id: `orb-${this.currentRoom.id}-${puzzleID}`,
                puzzleID: puzzleID,
                roomId: this.data.prevRoomId
            });

            prevRoom.appendChild(orb);

            console.log('[Orbe] Creado en', this.data.prevRoomId, 'con puzzleID:', puzzleID);
        } else {
            console.warn('[Orbe] No se encontró la habitación anterior:', this.data.prevRoomId);
        }

        // Pedestal en la habitación actual
        this.pedestal = createPedestal('0 0 0', targets, {
            id: `pedestal-${this.currentRoom.id}-${puzzleID}`,
            puzzleID: puzzleID
        });

        this.pedestal.addEventListener('pedestal-activated', (event) => {
            this.solve(event.detail);
        });

        this.currentRoom.appendChild(this.pedestal);

        console.log('[Pedestal] Creado en', this.currentRoom.id, 'abre:', targets, 'puzzleID:', puzzleID);
    },

    solve: function (detail = {}) {
        if (this.isSolved) return;

        this.isSolved = true;

        trackPuzzleStarted(this.currentRoom, this.data, {
            pedestalId: detail.pedestalId || null,
            orbId: detail.orbId || null,
            puzzleID: detail.puzzleID || null
        });

        trackPuzzleSolved(this.currentRoom, this.data, {
            pedestalId: detail.pedestalId || null,
            orbId: detail.orbId || null,
            puzzleID: detail.puzzleID || null
        });

        const meta = getPuzzleMetaFromRoomElement(this.currentRoom);

        window.telemetry?.track('orb_placed', {
            puzzleId: meta?.id || null,
            puzzleType: meta?.type || 'orb-pedestal',
            roomId: this.currentRoom.id,
            pedestalId: detail.pedestalId || null,
            orbId: detail.orbId || null,
            puzzleID: detail.puzzleID || null,
            targetDoorIds: getPuzzleDoorIds(this.data)
        });

        emitToPuzzleDoors(this.data, 'openDoor');
    }
});