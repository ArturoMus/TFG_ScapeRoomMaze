// ============================================================
// Render de salas y puertas
// ============================================================

function renderMap(rooms, roomSize) {
    const scene = document.querySelector('a-scene');

    Object.values(rooms).forEach(room => {
        const entity = createBasicRoom(
            roomSize,
            room.id,
            `${room.x * roomSize} 0 ${room.z * roomSize}`,
            room.neighbors
        );

        scene.appendChild(entity);

        room.el = entity;
    });

    Object.values(rooms).forEach(room => {
        for (let dir in room.doors) {
            const door = room.doors[dir];

            if (!door.rendered) {
                const doorPivot = createDoor(room.el, door.direction, roomSize);

                door.el = doorPivot;
                door.el.doorData = door;
                door.rendered = true;

                doorPivot.setAttribute('id', `door-pivot-${room.id}-${dir}`);
            }
        }
    });
}

// ============================================================
// Helpers de puertas
// ============================================================

function getDirectionBetween(a, b) {
    if (b.x === a.x && b.z === a.z - 1) return 'north';
    if (b.x === a.x && b.z === a.z + 1) return 'south';
    if (b.x === a.x + 1 && b.z === a.z) return 'east';
    if (b.x === a.x - 1 && b.z === a.z) return 'west';

    return null;
}

function getDoorBetweenCoords(rooms, a, b) {
    const room = rooms[`room-${a.x}-${a.z}`];

    if (!room) return null;

    const dir = getDirectionBetween(a, b);

    if (!dir) return null;

    return room.doors[dir] || null;
}

function ensureDoorId(door) {
    if (!door || !door.el) return null;

    if (!door.el.id) {
        const idA = door.roomA.id;
        const idB = door.roomB.id;
        door.el.setAttribute('id', `door-${idA}-${idB}`);
    }

    return door.el.id;
}

function lockDoorForPuzzle(door) {
    if (!door) return;

    door.hasPuzzle = true;
    door.isLocked = true;
    door.isOpen = false;

    if (door.el?.components?.door) {
        door.el.components.door.isLocked = true;
        door.el.components.door.isOpen = false;
    }

    if (door.el?.doorData) {
        door.el.doorData.isLocked = true;
        door.el.doorData.isOpen = false;
    }
}