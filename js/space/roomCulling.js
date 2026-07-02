AFRAME.registerComponent('room-culling', {
    schema: {
        visibleRadius: { type: 'number', default: 2 },
        lightRadius: { type: 'number', default: 1 },
        updateEveryMs: { type: 'number', default: 300 }
    },

    init: function () {
        this.lastUpdate = 0;
        this.lastRoomId = null;
    },

    tick: function (time) {
        if (!window.rooms || !window.roomSize) return;
        if (!window.gameState?.started) return;

        if (time - this.lastUpdate < this.data.updateEveryMs) return;
        this.lastUpdate = time;

        const currentRoom = this.getCurrentRoom();

        if (!currentRoom) return;

        if (currentRoom.id === this.lastRoomId) {
            return;
        }

        this.lastRoomId = currentRoom.id;

        this.updateRooms(currentRoom);
    },

    getCurrentRoom: function () {
        const player = document.querySelector('#player');

        if (!player || !window.rooms) return null;

        const playerPos = new THREE.Vector3();
        player.object3D.getWorldPosition(playerPos);

        let bestRoom = null;
        let bestDistance = Infinity;

        Object.values(window.rooms).forEach(room => {
            const roomX = room.x * window.roomSize;
            const roomZ = room.z * window.roomSize;

            const dx = playerPos.x - roomX;
            const dz = playerPos.z - roomZ;

            const distance = dx * dx + dz * dz;

            if (distance < bestDistance) {
                bestDistance = distance;
                bestRoom = room;
            }
        });

        return bestRoom;
    },

    updateRooms: function (currentRoom) {
        Object.values(window.rooms).forEach(room => {
            if (!room || !room.el) return;

            const dist =
                Math.abs(room.x - currentRoom.x) +
                Math.abs(room.z - currentRoom.z);

            const shouldBeVisible = dist <= this.data.visibleRadius;
            const shouldHaveLights = dist <= this.data.lightRadius;

            this.setRoomVisible(room, shouldBeVisible);
            this.setRoomLightsEnabled(room, shouldHaveLights);
        });

        console.log(
            `[RoomCulling] Sala actual: ${currentRoom.id}. Radio visible: ${this.data.visibleRadius}`
        );
    },

    setRoomVisible: function (room, visible) {
        if (!room.el) return;

        if (room.el.getAttribute('visible') === visible) return;

        room.el.setAttribute('visible', visible);
    },

    setRoomLightsEnabled: function (room, enabled) {
        if (!room.el) return;

        const lights = room.el.querySelectorAll('[light]');

        lights.forEach(lightEl => {
            lightEl.setAttribute('visible', enabled);
        });
    }
});