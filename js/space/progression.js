// ============================================================
// Lógica de progresión y puzzles
// ============================================================

function isRoomOnMainPath(roomShortId, mainPathCoords) {
    return mainPathCoords.some(coord => coordId(coord) === roomShortId);
}

function getMainPathIndex(roomShortId, mainPathCoords) {
    return mainPathCoords.findIndex(coord => coordId(coord) === roomShortId);
}

function getMainChildId(roomShortId, mainPathCoords) {
    const index = getMainPathIndex(roomShortId, mainPathCoords);

    if (index === -1) return null;
    if (index >= mainPathCoords.length - 1) return null;

    return coordId(mainPathCoords[index + 1]);
}

function getBranchRootInfo(roomShortId, progressionPlan) {
    const {
        tree,
        mainPathCoords
    } = progressionPlan;

    let current = roomShortId;

    while (current) {
        const parent = tree.parentByRoom[current];

        if (!parent) return null;

        const parentIsMain = isRoomOnMainPath(parent, mainPathCoords);
        const currentIsMain = isRoomOnMainPath(current, mainPathCoords);

        if (parentIsMain && !currentIsMain) {
            return {
                rootId: parent,
                firstBranchRoomId: current
            };
        }

        current = parent;
    }

    return null;
}

function getMainGateDoorForBranchRoom(rooms, roomShortId, progressionPlan) {
    const branchInfo = getBranchRootInfo(roomShortId, progressionPlan);

    if (!branchInfo) return null;

    const mainChildId = getMainChildId(
        branchInfo.rootId,
        progressionPlan.mainPathCoords
    );

    if (!mainChildId) return null;

    return getDoorBetweenCoords(
        rooms,
        parseCoordId(branchInfo.rootId),
        parseCoordId(mainChildId)
    );
}

function getDoorToChild(rooms, parentShortId, childShortId) {
    return getDoorBetweenCoords(
        rooms,
        parseCoordId(parentShortId),
        parseCoordId(childShortId)
    );
}

function getPuzzleTargetDoorsForRoom(rooms, room, progressionPlan) {
    const {
        tree,
        mainPathCoords,
        finalCoord
    } = progressionPlan;

    const roomShortId = room.id.replace('room-', '');
    const finalShortId = coordId(finalCoord);

    if (roomShortId === finalShortId) {
        return [];
    }

    const children = tree.childrenByRoom[roomShortId] || [];
    const isMain = isRoomOnMainPath(roomShortId, mainPathCoords);

    const targetDoors = [];

    if (isMain) {
        const mainChildId = getMainChildId(roomShortId, mainPathCoords);

        const branchChildren = children.filter(childId => {
            return childId !== mainChildId;
        });

        if (branchChildren.length > 0) {
            // Si hay deadends desde esta habitación, el puzzle abre las puertas hacia esos deadends.
            // La puerta principal queda bloqueada y la abrirá el último puzzle del deadend.
            branchChildren.forEach(childId => {
                const door = getDoorToChild(rooms, roomShortId, childId);

                if (door) {
                    targetDoors.push(door);
                }
            });

            if (mainChildId) {
                const mainGateDoor = getDoorToChild(rooms, roomShortId, mainChildId);

                if (mainGateDoor) {
                    lockDoorForPuzzle(mainGateDoor);
                }
            }
        } else if (mainChildId) {
            // Si no hay deadend, el puzzle abre la siguiente puerta del camino principal.
            const door = getDoorToChild(rooms, roomShortId, mainChildId);

            if (door) {
                targetDoors.push(door);
            }
        }
    } else {
        // Sala de rama/deadend.
        // Si tiene hijos, su puzzle abre esas puertas.
        if (children.length > 0) {
            children.forEach(childId => {
                const door = getDoorToChild(rooms, roomShortId, childId);

                if (door) {
                    targetDoors.push(door);
                }
            });
        } else {
            // Si es hoja/deadend, su puzzle abre la puerta principal del root de esa rama.
            const mainGateDoor = getMainGateDoorForBranchRoom(
                rooms,
                roomShortId,
                progressionPlan
            );

            if (mainGateDoor) {
                targetDoors.push(mainGateDoor);
            }
        }
    }

    return targetDoors;
}

function getPreviousRoomIdForOrb(room, progressionPlan) {
    const roomShortId = room.id.replace('room-', '');
    const parentId = progressionPlan.tree.parentByRoom[roomShortId];

    if (!parentId) return null;

    return `room-${parentId}`;
}

function choosePuzzleTypeForRoom(room, progressionPlan, puzzleIndex) {
    const prevRoomId = getPreviousRoomIdForOrb(room, progressionPlan);

    const types = ['button', 'pressure', 'memory', 'orb'];
    let type = types[puzzleIndex % types.length];

    if (type === 'orb' && !prevRoomId) {
        type = 'button';
    }

    return type;
}

function placePuzzleInRoom({ room, type, targetDoorIds, prevRoomId }) {
    const targetString = targetDoorIds.join(',');

    if (type === 'button') {
        room.el.setAttribute('puzzle-button-door', {
            doorIds: targetString
        });
    }

    else if (type === 'pressure') {
        room.el.setAttribute('puzzle-pressure-plate', {
            doorIds: targetString
        });
    }

    else if (type === 'memory') {
        room.el.setAttribute('puzzle-memory-match', {
            doorIds: targetString,
            length: 4,
            showSpeed: 650
        });
    }

    else if (type === 'orb') {
        if (!prevRoomId) {
            room.el.setAttribute('puzzle-button-door', {
                doorIds: targetString
            });

            return;
        }

        room.el.setAttribute('puzzle-orb-pedestal', {
            doorIds: targetString,
            prevRoomId: prevRoomId
        });
    }
}

function assignProgressionPuzzles(rooms, progressionPlan) {
    const finalShortId = coordId(progressionPlan.finalCoord);
    let puzzleIndex = 0;

    Object.values(rooms).forEach(room => {
        if (!room || !room.el) return;

        const roomShortId = room.id.replace('room-', '');

        if (roomShortId === finalShortId) {
            room.isGoal = true;
            console.log("Sala final sin puzzle:", room.id);
            return;
        }

        const targetDoors = getPuzzleTargetDoorsForRoom(
            rooms,
            room,
            progressionPlan
        );

        const targetDoorIds = [];

        targetDoors.forEach(door => {
            const doorId = ensureDoorId(door);

            if (!doorId) return;

            lockDoorForPuzzle(door);
            targetDoorIds.push(doorId);
        });

        if (targetDoorIds.length === 0) {
            console.warn("Habitación sin puertas objetivo para puzzle:", room.id);
            return;
        }

        const type = choosePuzzleTypeForRoom(
            room,
            progressionPlan,
            puzzleIndex
        );

        const prevRoomId = getPreviousRoomIdForOrb(room, progressionPlan);

        placePuzzleInRoom({
            room,
            type,
            targetDoorIds,
            prevRoomId
        });

        console.log(
            `[Puzzle] ${room.id} tipo ${type} abre:`,
            targetDoorIds
        );

        room.puzzle = {
            type,
            targetDoorIds: [...targetDoorIds],
            solved: false
        };

        targetDoors.forEach(door => {
            if (!door.debugPuzzleRoomIds) {
                door.debugPuzzleRoomIds = new Set();
            }

            door.debugPuzzleRoomIds.add(room.id);
        });

        puzzleIndex++;
    });

    if (window.debugSetPuzzleTotal) {
        window.debugSetPuzzleTotal(puzzleIndex);
    }
}