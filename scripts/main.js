// main.js
import Game from './Game.js';
import ui from './UI.js';
import Deck from './Deck.js';
import { Player, AIPlayer } from './Player.js';
import ScoreManager from './ScoreManager.js';
import { canPlayCard, initiateRobbing, checkAndHandleRobbing } from './CardRules.js';
import { getCardFromElement } from './Utils.js';

let game, deck, scoreManager;

function initializeGame() {
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

    startNewGame();
}

function startNewGame() {
    ui.resetGameUI();
    deck.reset();

    const dealerIndex = Math.floor(Math.random() * 4);
    console.log(`Player ${dealerIndex + 1} is the dealer.`);

    game.players.forEach((player, index) => {
        player.isDealer = (index === dealerIndex);
        player.hand = deck.deal(5);
        ui.initializeHandUI(player);
    });

    const trumpCard = deck.cards.pop();
    if (trumpCard) {
        game.setTrumpSuit(trumpCard.suit, trumpCard);
        console.log(`The trump card is: ${trumpCard.rank} of ${trumpCard.suit}`);
    
        ui.initializeDeckUI(dealerIndex, trumpCard);

        if (trumpCard.rank === 'A') {
            const dealer = game.players[dealerIndex];
            game.initiateRobbing([dealer], trumpCard, () => {
                startFirstTurn(dealerIndex);
            });
        } else {
            startFirstTurn(dealerIndex);
        }
    } else {
        console.error('Failed to get a trump card from the deck');
        // Handle this error case, perhaps by restarting the game or showing an error message
    }
}

function startFirstTurn(dealerIndex) {
    game.currentTurnIndex = (dealerIndex + 1) % 4;
    game.startTurn();
}

// Initialize the game when the page loads
console.log('main.js loaded');
window.onload = initializeGame;