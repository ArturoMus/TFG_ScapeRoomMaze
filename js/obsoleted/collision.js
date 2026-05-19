
const colliders = [];
const PLAYER_RADIUS = 0.3;


function isColliding(pos) {
    const playerPoint = new THREE.Vector3(pos.x, pos.y, pos.z);

    for (let col of colliders) {
        if (col.disabled) continue;

        const box = new THREE.Box3();

        box.setFromObject(col.el.object3D);

        box.expandByScalar(PLAYER_RADIUS);

        if (box.containsPoint(playerPoint)) {
            return true;
        }
    }
    return false;
}

function isCollidingOutdated(pos) {
    for (let col of colliders) {

        if (col.disabled) continue;
        

        const wallPos = new THREE.Vector3();
        col.el.object3D.getWorldPosition(wallPos);

        const halfW = col.width / 2;
        const halfD = col.depth / 2;

        if (
            pos.x > wallPos.x - halfW &&
            pos.x < wallPos.x + halfW &&
            pos.z > wallPos.z - halfD &&
            pos.z < wallPos.z + halfD
        ) {
            return true;
        }
    }
    return false;
}