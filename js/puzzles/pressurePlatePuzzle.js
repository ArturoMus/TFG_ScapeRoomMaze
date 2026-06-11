AFRAME.registerComponent('puzzle-pressure-plate', {
    schema: {
        doorId: { type: 'string', default: '' },
        doorIds: { type: 'string', default: '' }
    },

    init: function () {
        this.room = this.el;
        this.isSolved = false;

        this.doors = lockPuzzleDoors(this.data);

        if (this.doors.length === 0) {
            console.warn("No se encontró ninguna puerta para puzzle-pressure-plate:", this.data);
            return;
        }

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

    handlePlatePressed: function (detail = {}) {
        if (!this.isSolved) {
            this.isSolved = true;

            trackPuzzleStarted(this.room, this.data, {
                plateId: detail.plateId || null,
                objectId: detail.objectId || null,
                objectType: detail.objectType || null
            });

            trackPuzzleSolved(this.room, this.data, {
                plateId: detail.plateId || null,
                objectId: detail.objectId || null,
                objectType: detail.objectType || null
            });
        }

        const meta = getPuzzleMetaFromRoomElement(this.room);

        window.telemetry?.track('pressure_plate_pressed', {
            puzzleId: meta?.id || null,
            puzzleType: meta?.type || 'pressure-plate',
            roomId: this.room.id,
            plateId: detail.plateId || null,
            objectId: detail.objectId || null,
            objectType: detail.objectType || null,
            targetDoorIds: getPuzzleDoorIds(this.data)
        });

        emitToPuzzleDoors(this.data, 'activateDoor');
    },

    handlePlateReleased: function (detail = {}) {
        const meta = getPuzzleMetaFromRoomElement(this.room);

        window.telemetry?.track('pressure_plate_released', {
            puzzleId: meta?.id || null,
            puzzleType: meta?.type || 'pressure-plate',
            roomId: this.room.id,
            plateId: detail.plateId || null,
            objectId: detail.objectId || null,
            objectType: detail.objectType || null,
            targetDoorIds: getPuzzleDoorIds(this.data)
        });

        emitToPuzzleDoors(this.data, 'closeDoor');
    }
});