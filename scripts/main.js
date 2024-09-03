// main.js
import Game from './Game.js';
import ui from './UI.js';
import Deck from './Deck.js';
import { Player, AIPlayer } from './Player.js';
import ScoreManager from './ScoreManager.js';
import { canPlayCard } from './CardRules.js';
//don't think we need this? import { getCardFromElement } from './UI.js';

let game, deck, scoreManager;
let debugMode = false;

document.addEventListener('keydown', (event) => {
    if (event.key === 'D' || event.key === 'd') {
        debugMode = !debugMode;
        console.log(`Debug mode ${debugMode ? 'enabled' : 'disabled'}`);
        try {
            updateAllHandsUI();
        } catch (error) {
            console.error('Error updating hands UI:', error);
        }
    }
});

function updateAllHandsUI() {
    if (game && game.players) {
        game.players.forEach(player => {
            if (ui && typeof ui.updatePlayerHandUI === 'function') {
                ui.updatePlayerHandUI(player, new Set(), debugMode);
            } else {
                console.error('UI or updatePlayerHandUI method not available');
            }
        });
    } else {
        console.error('Game or players not initialized');
    }
}

async function initializeGame() {
    const players = [
        new Player('player1', true),
        new AIPlayer('player2'),
        new AIPlayer('player3'),
        new AIPlayer('player4')
    ];

    console.log('Initializing game...');
    console.log('UI instance:', ui);
    console.log('UI methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(ui)));

    game = new Game(ui);
    console.log('Game instance:', game);

    deck = new Deck();
    scoreManager = new ScoreManager(players);

    game.players = players;
    game.ui = ui;
    game.deck = deck;
    game.scoreManager = scoreManager;

    // Wait for all assets to load
    await loadAllAssets();

    game.startNewGame();
}

async function loadAllAssets() {
    const cardAssets = [
        'assets/card_back.png',
        // Add all other card asset paths here
    ];

    const loadPromises = cardAssets.map(asset => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = asset;
        });
    });

    try {
        await Promise.all(loadPromises);
        console.log('All assets loaded successfully');
    } catch (error) {
        console.error('Error loading assets:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Existing initialization code...

    // Add mobile interaction handlers
    if ('ontouchstart' in window) {
        document.addEventListener('touchstart', handleTouchStart, false);
        document.addEventListener('touchmove', handleTouchMove, false);
        document.addEventListener('touchend', handleTouchEnd, false);
    }
});

let xDown = null;
let yDown = null;

function handleTouchStart(evt) {
    const firstTouch = evt.touches[0];
    xDown = firstTouch.clientX;
    yDown = firstTouch.clientY;
}

function handleTouchMove(evt) {
    if (!xDown || !yDown) {
        return;
    }

    const xUp = evt.touches[0].clientX;
    const yUp = evt.touches[0].clientY;

    const xDiff = xDown - xUp;
    const yDiff = yDown - yUp;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
        if (xDiff > 0) {
            /* left swipe */ 
            console.log('Swiped left');
        } else {
            /* right swipe */
            console.log('Swiped right');
        }
    } else {
        if (yDiff > 0) {
            /* up swipe */ 
            console.log('Swiped up');
        } else {
            /* down swipe */
            console.log('Swiped down');
        }
    }

    // Reset values
    xDown = null;
    yDown = null;
}

function handleTouchEnd(evt) {
    // Handle touch end event
    console.log('Touch ended');
}

// You might want to add more specific handlers for your game elements
function addCardTouchHandlers() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('touchstart', handleCardTouch);
    });
}

function handleCardTouch(evt) {
    evt.preventDefault(); // Prevent default touch behavior
    const card = evt.currentTarget;
    // Add your card selection logic here
    console.log('Card touched:', card);
}

function forceLandscape() {
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(function(error) {
            console.log('Unable to lock screen orientation:', error);
        });
    } else if (screen.lockOrientation) {
        screen.lockOrientation('landscape');
    } else if (screen.mozLockOrientation) {
        screen.mozLockOrientation('landscape');
    } else if (screen.msLockOrientation) {
        screen.msLockOrientation('landscape');
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', forceLandscape);

// Also try to force landscape on resize and orientation change
window.addEventListener('resize', forceLandscape);
window.addEventListener('orientationchange', forceLandscape);


// Initialize the game when the page loads
console.log('main.js loaded');
window.onload = initializeGame;