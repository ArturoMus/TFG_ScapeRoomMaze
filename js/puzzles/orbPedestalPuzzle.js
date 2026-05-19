AFRAME.registerComponent('puzzle-orb-pedestal', {
    schema: {
        doorId: { type: 'string', default: '' },
        doorIds: { type: 'string', default: '' },
        prevRoomId: { type: 'string' }
    },

    init: function () {
        const currentRoom = this.el;
        const prevRoom = document.getElementById(this.data.prevRoomId);

        const targets = getPuzzleDoorSelectors(this.data);
        const puzzleID = getFirstPuzzleDoorId(this.data);

        if (!targets || !puzzleID) {
            console.warn('[Orbe] Puzzle sin targets válidos:', this.data);
            return;
        }

        // Bloquear todas las puertas objetivo
        getPuzzleDoorElements(this.data).forEach(doorEl => {
            if (doorEl.components?.door) {
                doorEl.components.door.isLocked = true;
            }

            if (doorEl.doorData) {
                doorEl.doorData.isLocked = true;
            }
        });

        // El orbe aparece en la habitación anterior
        if (prevRoom) {
            const orb = createOrb('0 1.6 0');

            // El orbe y el pedestal comparten este mismo puzzleID
            orb.setAttribute('data-puzzle-id', puzzleID);

            prevRoom.appendChild(orb);

            console.log('[Orbe] Creado en', this.data.prevRoomId, 'con puzzleID:', puzzleID);
        } else {
            console.warn('[Orbe] No se encontró la habitación anterior:', this.data.prevRoomId);
        }

        // Pedestal en la habitación actual
        const pedestal = createPedestal('0 0 0', targets, {
            puzzleID: puzzleID
        });

        currentRoom.appendChild(pedestal);

        console.log('[Pedestal] Creado en', currentRoom.id, 'abre:', targets, 'puzzleID:', puzzleID);
    }
});