AFRAME.registerComponent('puzzle-pressure-plate', {
    schema: {
        doorId: { type: 'string', default: '' },
        doorIds: { type: 'string', default: '' }
    },

    init: function () {
        const room = this.el;

        const doors = lockPuzzleDoors(this.data);

        if (doors.length === 0) {
            console.warn("No se encontró ninguna puerta para puzzle-pressure-plate:", this.data);
            return;
        }

        const targetSelectors = getPuzzleDoorSelectors(this.data);

        const plateSetup = createCamouflagedPressurePlate(
            room,
            targetSelectors,
            window.roomSize || 10
        );

        room.appendChild(plateSetup.plate);

        const box = createPuzzleBox(plateSetup.boxPosition);
        room.appendChild(box);

        console.log("[Placa] Puzzle creado. Abre:", targetSelectors);
    }
});