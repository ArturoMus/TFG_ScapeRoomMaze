
window.gameState = {
    finished: false,
    started: false,
    mapGenerated: false
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

    console.log("Juego terminado");

    setPlayerMovementEnabled(false);

    const loadingScreen = document.querySelector('#loading-screen');

    if (loadingScreen?.components['vr-loading-screen']) {
        loadingScreen.components['vr-loading-screen'].setContent(
            '¡Has ganado!',
            'Has encontrado la salida de la mazmorra.',
            'Gracias por jugar la beta.'
        );

        loadingScreen.components['vr-loading-screen'].show();
    }

    // Fallback HTML para navegador
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.querySelector('h1').textContent = '¡Has ganado!';
    }
}
/*function endGame() {
    if (window.gameState.finished) return;
    window.gameState.finished = true;

    console.log("PERIOOOOD");

    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';
    overlay.querySelector('h1').textContent = '¡Has ganado!';

}*/