function getTelemetryObjectType(el) {
    if (!el) return 'unknown';

    if (el.components?.orb || el.hasAttribute('orb')) {
        return 'orb';
    }

    if (el.components?.box || el.hasAttribute('box')) {
        return 'box';
    }

    return 'unknown';
}

// Funcion que uso para mirar si hay algun objeto ya enla posicion en la que voya dejar el objeto
// de forma que si es una pared/puerta (que tienen ray-blocker)pues nola atraviesen
function getSafeCarriedObjectPosition(currentPos, desiredPos, options = {}) {
    const radius = options.radius ?? 0.25;
    const blockerSelector = options.blockerSelector ?? '.ray-blocker';

    const movement = new THREE.Vector3().subVectors(desiredPos, currentPos);
    const distance = movement.length();

    if (distance <= 0.001) {
        return desiredPos.clone();
    }

    const direction = movement.clone().normalize();

    const blockerEls = [...document.querySelectorAll(blockerSelector)]
        .filter(el => el.object3D && el.object3D.visible);

    if (blockerEls.length === 0) {
        return desiredPos.clone();
    }

    const blockerObjects = blockerEls.map(el => el.object3D);

    const raycaster = new THREE.Raycaster(
        currentPos,
        direction,
        0,
        distance + radius
    );

    const hits = raycaster.intersectObjects(blockerObjects, true);

    if (hits.length === 0) {
        return desiredPos.clone();
    }

    const hit = hits[0];

    const safeDistance = Math.max(0, hit.distance - radius);

    return currentPos.clone().add(
        direction.multiplyScalar(safeDistance)
    );
}