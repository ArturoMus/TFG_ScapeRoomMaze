AFRAME.registerComponent('puzzle-pressure-plate', {
    schema: {
        doorId: { type: 'string', default: '' },
        doorIds: { type: 'string', default: '' }
    },

    init: function () {
        this.room = this.el;
        this.isStarted = false;
        this.isSolved = false;

        this.doors = lockPuzzleDoors(this.data);

        if (this.doors.length === 0) {
            console.warn("No se encontró ninguna puerta para puzzle-pressure-plate:", this.data);
            return;
        }

        this.doors.forEach(doorEl => {
            doorEl.addEventListener('door-fully-opened', this.onTargetDoorFullyOpened);
        });

        const targetSelectors = getPuzzleDoorSelectors(this.data);

        const plateSetup = createCamouflagedPressurePlate(
            this.room,
            targetSelectors,
            window.roomSize || 10
        );

        this.plate = plateSetup.plate;

        this.plate.addEventListener('pressure-plate-pressed', (event) => {
            this.handlePlatePressed(event.detail);
        });

        this.plate.addEventListener('pressure-plate-released', (event) => {
            this.handlePlateReleased(event.detail);
        });

        this.room.appendChild(this.plate);

        const puzzleID = getFirstPuzzleDoorId(this.data);

        const box = createPuzzleBox(plateSetup.boxPosition, {
            id: `box-${this.room.id}-${puzzleID}`,
            puzzleID: puzzleID,
            roomId: this.room.id
        });

        this.room.appendChild(box);

        console.log("[Placa] Puzzle creado. Abre:", targetSelectors);
    },

    remove: function () {
        if (!this.doors || !this.onTargetDoorFullyOpened) return;

        this.doors.forEach(doorEl => {
            doorEl.removeEventListener('door-fully-opened', this.onTargetDoorFullyOpened);
        });
    },

    buildPlateExtra: function (detail = {}) {
        return {
            plateId: detail.plateId || null,
            objectId: detail.objectId || null,
            objectType: detail.objectType || null
        };
    },

    handlePlatePressed: function (detail = {}) {
        const extra = this.buildPlateExtra(detail);

        if (!this.isStarted && !this.isSolved) {
            this.isStarted = true;

            trackPuzzleStarted(this.room, this.data, extra);
        }

        const meta = getPuzzleMetaFromRoomElement(this.room);

        window.telemetry?.track('pressure_plate_pressed', {
            puzzleId: meta?.id || null,
            puzzleType: meta?.type || 'pressure',
            roomId: this.room.id,
            ...extra,
            targetDoorIds: getPuzzleDoorIds(this.data)
        });

        emitToPuzzleDoors(this.data, 'activateDoor');
    },

    handlePlateReleased: function (detail = {}) {
        const extra = this.buildPlateExtra(detail);
        const meta = getPuzzleMetaFromRoomElement(this.room);

        window.telemetry?.track('pressure_plate_released', {
            puzzleId: meta?.id || null,
            puzzleType: meta?.type || 'pressure',
            roomId: this.room.id,
            ...extra,
            targetDoorIds: getPuzzleDoorIds(this.data)
        });

        if (!this.isSolved) {
            emitToPuzzleDoors(this.data, 'closeDoor');
        }
    },

    handleTargetDoorFullyOpened: function (detail = {}) {
        if (this.isSolved) return;

        const allTargetDoorsOpen = this.doors.every(doorEl => {
            const door = doorEl.components?.door;
            return door?.isFullyOpen || door?.isOpen;
        });

        if (!allTargetDoorsOpen) return;

        this.isSolved = true;

        trackPuzzleSolved(this.room, this.data, {
            solvedBy: 'door_fully_opened',
            doorId: detail.doorId || null
        });
    }
});