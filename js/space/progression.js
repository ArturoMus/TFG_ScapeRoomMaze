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

function getRoomProgressionRole(room, progressionPlan) {
    const roomShortId = room.id.replace('room-', '');
    const children = progressionPlan.tree.childrenByRoom[roomShortId] || [];
    const isMainPath = isRoomOnMainPath(roomShortId, progressionPlan.mainPathCoords);
    const mainPathIndex = getMainPathIndex(roomShortId, progressionPlan.mainPathCoords);
    const branchInfo = getBranchRootInfo(roomShortId, progressionPlan);

    if (coordId(progressionPlan.finalCoord) === roomShortId) {
        return 'final';
    }

    if (isMainPath) {
        const mainChildId = getMainChildId(roomShortId, progressionPlan.mainPathCoords);
        const branchChildren = children.filter(childId => childId !== mainChildId);

        if (branchChildren.length > 0) {
            return 'main_decision';
        }

        return 'main_path';
    }

    if (children.length === 0) {
        return 'branch_leaf';
    }

    if (branchInfo) {
        return 'branch_path';
    }

    return 'unknown';
}

function getParentRoomPuzzleType(room, progressionPlan) {
    const roomShortId = room.id.replace('room-', '');
    const parentId = progressionPlan.tree.parentByRoom[roomShortId];

    if (!parentId) return null;

    const parentRoom = window.rooms?.[`room-${parentId}`];

    return parentRoom?.puzzle?.type || null;
}

function getPuzzleTypeWeight(type, role) {
    const weightsByRole = {
        main_path: {
            button: 1,
            pressure: 1,
            memory: 3,
            orb: 2,
            levers: 2,
            symbol: 2
        },

        main_decision: {
            button: 3,
            pressure: 2,
            memory: 2,
            orb: 1,
            levers: 2,
            symbol: 2,
        },

        branch_path: {
            button: 2,
            pressure: 3,
            memory: 1,
            orb: 2,
            levers: 2,
            symbol: 2
        },

        branch_leaf: {
            button: 2,
            pressure: 1,
            memory: 2,
            orb: 3,
            levers: 2,
            symbol: 1
        },

        unknown: {
            button: 1,
            pressure: 1,
            memory: 1,
            orb: 1,
            levers: 1,
            symbol: 1
        }
    };

    return weightsByRole[role]?.[type] ?? 1;
}

function getLeastUsedPuzzleType(candidates, puzzleCounts, role) {
    let bestType = null;
    let bestScore = Infinity;

    candidates.forEach(type => {
        const count = puzzleCounts[type] || 0;
        const roleWeight = getPuzzleTypeWeight(type, role);

        // Menor score = más probable.
        // Si roleWeight es alto, baja el score.
        const score = count - roleWeight * 0.35;

        if (score < bestScore) {
            bestScore = score;
            bestType = type;
        }
    });

    return bestType || candidates[0];
}


function getSymbolClueCandidateRoomIds(room, progressionPlan) {
    const roomShortId = room.id.replace('room-', '');
    const ancestors = getAncestorRoomIds(roomShortId, progressionPlan);

    if (ancestors.length === 0) {
        return [];
    }

    let lastSymbolPuzzleIndex = -1;

    ancestors.forEach((ancestorId, index) => {
        const ancestorRoom = window.rooms?.[`room-${ancestorId}`];

        if (ancestorRoom?.puzzle?.type === 'symbol') {
            lastSymbolPuzzleIndex = index;
        }
    });

    return ancestors.slice(lastSymbolPuzzleIndex + 1);
}

function createSymbolPuzzleProgressionData(room, progressionPlan) {
    const candidates = getSymbolClueCandidateRoomIds(room, progressionPlan);

    if (candidates.length === 0) {
        console.warn('[SymbolPuzzle] No hay habitaciones candidatas para pista:', room.id);

        return {
            symbolIndex: 0,
            clueRoomId: null
        };
    }

    const seedText = `${progressionPlan.seed}-${room.id}-symbol`;
    const rng = createSeededRandom(seedText);

    const clueShortId = candidates[Math.floor(rng() * candidates.length)];
    const symbolIndex = Math.floor(rng() * SYMBOL_ASSETS.length);

    return {
        symbolIndex,
        clueRoomId: `room-${clueShortId}`
    };
}

function choosePuzzleTypeForRoom(room, progressionPlan, puzzleIndex, puzzleCounts = {}) {
    const prevRoomId = getPreviousRoomIdForOrb(room, progressionPlan);
    const parentPuzzleType = getParentRoomPuzzleType(room, progressionPlan);
    const role = getRoomProgressionRole(room, progressionPlan);

    let candidates = ['button', 'pressure', 'memory', 'orb', 'levers', 'symbol'];

    // El puzzle de orbe necesita una habitación anterior donde colocar el orbe.
    if (!prevRoomId) {
        candidates = candidates.filter(type => type !== 'orb');
    }

    // Con esto evito que se cree el puzzle de símbolos en una habitación que no tenga otra anterior válida
    if (candidates.includes('symbol')) {
        const symbolCandidates = getSymbolClueCandidateRoomIds(room, progressionPlan);

        if (symbolCandidates.length === 0) {
            candidates = candidates.filter(type => type !== 'symbol');
        }
    }

    // Evito que haya dos puzzles seguidos del mismotipo
    if (parentPuzzleType && candidates.length > 1) {
        candidates = candidates.filter(type => type !== parentPuzzleType);
    }

    const selectedType = getLeastUsedPuzzleType(
        candidates,
        puzzleCounts,
        role
    );

    return selectedType;
}

function placePuzzleInRoom({ room, type, targetDoorIds, prevRoomId, puzzleExtra = {} }) {
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
    else if (type === 'levers') {
        room.el.setAttribute('puzzle-levers', {
            doorIds: targetString,
            leverCount: 4
        });
    }
    else if (type === 'symbol') {
        room.el.setAttribute('puzzle-symbol', {
            doorIds: targetString,
            symbolIndex: puzzleExtra.symbolIndex,
            clueRoomId: puzzleExtra.clueRoomId
        });
    }

}

function assignProgressionPuzzles(rooms, progressionPlan) {
    const finalShortId = coordId(progressionPlan.finalCoord);
    let puzzleIndex = 0;

    const puzzleCounts = {
        button: 0,
        pressure: 0,
        memory: 0,
        orb: 0,
        levers: 0,
        symbol: 0
    };

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
            puzzleIndex,
            puzzleCounts
        );

        let puzzleExtra = {};

        if (type === 'symbol') {
            puzzleExtra = createSymbolPuzzleProgressionData(room, progressionPlan);
        }

        const prevRoomId = getPreviousRoomIdForOrb(room, progressionPlan);

        placePuzzleInRoom({
            room,
            type,
            targetDoorIds,
            prevRoomId,
            puzzleExtra
        });

        console.log(
            `[Puzzle] ${room.id} tipo ${type} abre:`,
            targetDoorIds
        );

        room.puzzle = createPuzzleMeta({
            room,
            type,
            targetDoorIds,
            progressionPlan
        });
        
        if (type === 'symbol') {
            room.puzzle.symbolIndex = puzzleExtra.symbolIndex;
            room.puzzle.clueRoomId = puzzleExtra.clueRoomId;
        }

        trackPuzzleCreated(room.el, {
            doorIds: targetDoorIds.join(',')
        },{
            symbolIndex: type === 'symbol' ? puzzleExtra.symbolIndex : null,
            clueRoomId: type === 'symbol' ? puzzleExtra.clueRoomId : null
        });

        targetDoors.forEach(door => {
            if (!door.debugPuzzleRoomIds) {
                door.debugPuzzleRoomIds = new Set();
            }

            door.debugPuzzleRoomIds.add(room.id);
        });

        puzzleCounts[type] = (puzzleCounts[type] || 0) + 1;

        puzzleIndex++;
    });

    console.log('[PuzzleDistribution]', {
        total: puzzleIndex,
        counts: puzzleCounts
    });

    if (window.debugSetPuzzleTotal) {
        window.debugSetPuzzleTotal(puzzleIndex);
    }
}

function getAncestorRoomIds(roomShortId, progressionPlan) {
    const ancestors = [];
    let current = progressionPlan.tree.parentByRoom[roomShortId];

    while (current) {
        ancestors.push(current);
        current = progressionPlan.tree.parentByRoom[current];
    }

    ancestors.reverse();

    return ancestors;
}