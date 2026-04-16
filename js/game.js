
window.gameState = {
    finished: false
};

window.playerState = {
    hasOrb: false
};

window.addEventListener('load', () => {
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';
    overlay.querySelector('h1').textContent = 'Busca la salida';

    document.getElementById('start-button').addEventListener('click', () => {
        overlay.style.display = 'none';
    });
});

function endGame() {
    if (window.gameState.finished) return;
    window.gameState.finished = true;

    console.log("PERIOOOOD");

    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex';
    overlay.querySelector('h1').textContent = '¡Has ganado!';

}