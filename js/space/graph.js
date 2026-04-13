
class Room {
    constructor(id, x, z) {
        this.id = id;
        this.x = x;
        this.z = z;

        this.neighbors = {};
        this.doors = {};
        this.puzzle = null;
        this.puzzleDoor = null;
    }
}

class Door {
    constructor(roomA, roomB, direction) {
        this.roomA = roomA;
        this.roomB = roomB;
        this.direction = direction;

        this.isOpen = false;
        this.isLocked = true;
        this.hasPuzzle = false;
    }

    otherSide(room) {
        return room === this.roomA ? this.roomB : this.roomA;
    }
}

function createGraph(layout) {
    const rooms = {};

    // 1. crear nodos
    layout.forEach((row, z) => {
        row.forEach((cell, x) => {
            if (cell === 1) {
                const id = `room-${x}-${z}`;
                rooms[id] = new Room(id, x, z);
            }
        });
    });

    // 2. conectar nodos (crear puertas)
    Object.values(rooms).forEach(room => {
        const { x, z } = room;

        const directions = {
            north: `${x}-${z-1}`,
            south: `${x}-${z+1}`,
            east:  `${x+1}-${z}`,
            west:  `${x-1}-${z}`
        };

        for (let dir in directions) {
            const neighborId = `room-${directions[dir]}`;
            const neighbor = rooms[neighborId];

            if (neighbor && !room.doors[dir]) {

                const door = new Door(room, neighbor, dir);

                room.neighbors[dir] = neighbor;
                room.doors[dir] = door;

                // dirección opuesta
                const opposite = {
                    north: 'south',
                    south: 'north',
                    east: 'west',
                    west: 'east'
                };

                neighbor.neighbors[opposite[dir]] = room;
                neighbor.doors[opposite[dir]] = door;
            }
        }
    });

    return rooms;
}