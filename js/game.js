
window.gameState = {
    finished: false,
    started: false,
    mapGenerated: false,
    startTime: null,
    endTime: null
};

window.playerState = {
    hasOrb: false
};

window.addEventListener('load', () => {
    /*const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';
    overlay.querySelector('h1').textContent = 'Busca la salida';

    document.getElementById('start-button').addEventListener('click', () => {
        overlay.style.display = 'none';
    });*/
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }

    setPlayerMovementEnabled(false);
});


function setPlayerMovementEnabled(enabled) {
    const player = document.querySelector('#player');
    if (!player) return;

    const speed = enabled ? 0.2 : 0;

    player.setAttribute(
        'movement-controls',
        `controls: gamepad, keyboard; speed: ${speed}; fly: false; constrainToNavMesh: true`
    );
}

function generateMapOnce() {
    if (window.gameState.mapGenerated) return;

    const mapRoot = document.querySelector('#map-root');
    if (!mapRoot) {
        console.warn('No existe #map-root en index.html');
        return;
    }

    mapRoot.setAttribute('map', '');

    window.gameState.mapGenerated = true;
}

window.startGameFromMenu = function () {
    if (window.gameState.started) return;

    window.gameState.started = true;
    window.gameState.startTime = performance.now();

    const mainMenu = document.querySelector('#main-menu');
    const loadingScreen = document.querySelector('#loading-screen');

    if (mainMenu) {
        mainMenu.setAttribute('visible', false);
    }

    if (loadingScreen?.components['vr-loading-screen']) {
        loadingScreen.components['vr-loading-screen'].setContent(
            'Preparando mazmorra...',
            'Objetivo:\nEncuentra la sala final.\nResuelve mecanismos, abre puertas y busca la salida.',
            'Cargando...'
        );

        loadingScreen.components['vr-loading-screen'].show();
    }

    // Pantalla de carga fake.
    setTimeout(() => {
        generateMapOnce();

        if (loadingScreen?.components['vr-loading-screen']) {
            loadingScreen.components['vr-loading-screen'].setContent(
                'Objetivo',
                'Busca la salida.\nAlgunas puertas requieren botones, orbes o placas de presión.',
                'Buena suerte.'
            );
        }

        setTimeout(() => {
            if (loadingScreen?.components['vr-loading-screen']) {
                loadingScreen.components['vr-loading-screen'].hide();
            }

            setPlayerMovementEnabled(true);
        }, 1800);

    }, 1200);
};

function endGame() {
    if (window.gameState.finished) return;

    window.gameState.finished = true;
    window.gameState.endTime = performance.now();

    console.log("Juego terminado");

    setPlayerMovementEnabled(false);

    const elapsed = window.gameState.startTime
        ? window.gameState.endTime - window.gameState.startTime
        : 0;

    const formattedTime = formatGameTime(elapsed);

    const endScreen = document.querySelector('#end-screen');

    console.log('endScreen:', endScreen);
    console.log('components:', endScreen?.components);
    console.log('vr-end-screen:', endScreen?.components?.['vr-end-screen']);

    if (endScreen?.components['vr-end-screen']) {
        endScreen.components['vr-end-screen'].setTime(formattedTime);

        placeEntityInFrontOfCamera(endScreen, 2.4);

        endScreen.components['vr-end-screen'].show();
    }
}

function formatGameTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function placeEntityInFrontOfCamera(entity, distance = 2.2) {
    const camera = document.querySelector('#camera');

    if (!camera || !entity) {
        console.warn('No se pudo colocar la pantalla final delante de la cámara');
        return;
    }

    // Hacemos que el panel sea hijo de la cámara.
    // Así aparece siempre delante del jugador en VR.
    camera.appendChild(entity);

    entity.setAttribute('position', `0 0 -${distance}`);
    entity.setAttribute('rotation', '0 0 0');
    entity.setAttribute('visible', 'true');

    console.log('Pantalla final colocada delante de la cámara');
}


AFRAME.registerComponent('end-room-trigger', {
    schema: {
        radius: { type: 'number', default: 2.8 }
    },

    init: function () {
        this.hasTriggered = false;
        this.player = document.querySelector('#player');

        this.triggerPos = new THREE.Vector3();
        this.playerPos = new THREE.Vector3();
    },

    tick: function () {
        if (this.hasTriggered) return;
        if (!window.gameState?.started) return;
        if (window.gameState?.finished) return;
        if (!this.player) return;

        this.el.object3D.getWorldPosition(this.triggerPos);
        this.player.object3D.getWorldPosition(this.playerPos);

        const dx = this.playerPos.x - this.triggerPos.x;
        const dz = this.playerPos.z - this.triggerPos.z;

        const distanceXZ = Math.sqrt(dx * dx + dz * dz);

        if (distanceXZ <= this.data.radius) {
            this.hasTriggered = true;
            endGame();
        }
    }
});
/*function endGame() {
    if (window.gameState.finished) return;
    window.gameState.finished = true;

    console.log("PERIOOOOD");

    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';
    overlay.querySelector('h1').textContent = '¡Has ganado!';

}*/