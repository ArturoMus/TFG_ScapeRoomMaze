AFRAME.registerComponent('puzzle-button-door', {

    schema: {
        doorId: { type: 'string', default: '' },
        doorIds: { type: 'string', default: '' }
    },

    init: function () {
        const room = this.el;

        const doors = lockPuzzleDoors(this.data);

        if (doors.length === 0) {
            console.warn("No se encontró ninguna puerta para puzzle-button-door:", this.data);
            return;
        }

        const targetSelectors = getPuzzleDoorSelectors(this.data);

        const button = createCamouflagedWallButton(
            room,
            targetSelectors,
            window.roomSize || 10
        );

        room.appendChild(button);

        console.log("[Botón] Puzzle creado. Abre:", targetSelectors);
    }
});