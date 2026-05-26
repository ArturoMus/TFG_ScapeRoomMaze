function getPuzzleDoorIds(data) {
    const raw = data.doorIds || data.doorId || '';

    if (Array.isArray(raw)) {
        return raw.filter(Boolean);
    }

    return String(raw)
        .split(',')
        .map(id => id.trim())
        .filter(Boolean);
}

function getFirstPuzzleDoorId(data) {
    const first = getPuzzleDoorIds(data)[0] || '';
    return first.replace('#', '');
}

function getPuzzleDoorSelectors(data) {
    return getPuzzleDoorIds(data)
        .map(id => id.startsWith('#') ? id : `#${id}`)
        .join(',');
}

function getPuzzleDoorElements(data) {
    const selectors = getPuzzleDoorSelectors(data);

    if (!selectors) return [];

    return selectors
        .split(',')
        .map(selector => document.querySelector(selector))
        .filter(Boolean);
}

function lockPuzzleDoors(data) {
    const doors = getPuzzleDoorElements(data);

    doors.forEach(doorEl => {
        if (doorEl.components?.door) {
            doorEl.components.door.isLocked = true;
        }

        if (doorEl.doorData) {
            doorEl.doorData.isLocked = true;
        }
    });

    if (doors.length === 0) {
        console.warn("No se encontraron puertas para puzzle:", data);
    }

    return doors;
}

function emitToPuzzleDoors(data, eventName = 'openDoor') {
    const doors = getPuzzleDoorElements(data);

    doors.forEach(doorEl => {
        doorEl.emit(eventName);
    });

    return doors;
}