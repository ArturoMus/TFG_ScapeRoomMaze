AFRAME.registerComponent('puzzle-button-door', {

    schema: {
        doorId: { type: 'string', default: '' },
        doorIds: { type: 'string', default: '' }
    },

    init: function () {
        this.room = this.el;
        this.isSolved = false;

        this.doors = lockPuzzleDoors(this.data);

        if (this.doors.length === 0) {
            console.warn("No se encontró ninguna puerta para puzzle-button-door:", this.data);
            return;
        }

        const targetSelectors = getPuzzleDoorSelectors(this.data);

        this.button = createCamouflagedWallButton(
            this.room,
            targetSelectors,
            window.roomSize || 10
        );

        this.button.addEventListener('button-pressed', (event) => {
            this.solve(event.detail);
        });

        this.room.appendChild(this.button);

        console.log("[Botón] Puzzle creado. Abre:", targetSelectors);
    },

    solve: function (detail = {}) {
        if (this.isSolved) return;

        this.isSolved = true;

        trackPuzzleStarted(this.room, this.data, {
            buttonId: detail.buttonId || null
        });

        trackPuzzleSolved(this.room, this.data, {
            buttonId: detail.buttonId || null
        });

        const meta = getPuzzleMetaFromRoomElement(this.room);

        window.telemetry?.track('button_pressed', {
            puzzleId: meta?.id || null,
            puzzleType: meta?.type || 'button',
            roomId: this.room.id,
            buttonId: detail.buttonId || null,
            targetDoorIds: getPuzzleDoorIds(this.data)
        });

        emitToPuzzleDoors(this.data, 'openDoor');
    }
});