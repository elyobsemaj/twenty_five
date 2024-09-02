// Game.js

import { canPlayCard, initiateRobbing, checkAndHandleRobbing, performRob, handleDealerRob, handlePlayerRob } from './CardRules.js';
import Deck from './Deck.js';

let game;

class Game {
    constructor(ui) {
        this.players = [
            { id: 'player1', isHuman: true, hand: [], isDealer: false, score: 0 },
            { id: 'player2', isHuman: false, hand: [], isDealer: false, score: 0 },
            { id: 'player3', isHuman: false, hand: [], isDealer: false, score: 0 },
            { id: 'player4', isHuman: false, hand: [], isDealer: false, score: 0 }
        ];
        this.currentTurnIndex = 0;
        this.dealerIndex = -1; // Will be set in startNewGame
        this.isFirstGame = true;
        this.trickCards = [];
        this.currentTrumpSuit = '';
        this.currentTrumpCard = null;
        this.ui = ui;
        this.deck = new Deck();
        this.trickInProgress = false;
        this.playersWhoHaveRobbed = new Set();
        this.isFirstTurnAfterDeal = true;
        this.gameEnded = false;
        this.emptySlots = this.players.map(() => new Set());
        console.log('Game instance created with UI:', this.ui);
    }

    getPlayerNumber(player) {
        return this.players.findIndex(p => p.id === player.id) + 1;
    }

    getDealerNumber() {
        return this.dealerIndex + 1;
    }

    startTurn() {
        if (this.gameEnded) {
            return;
        }
        const currentPlayer = this.players[this.currentTurnIndex];
        console.log(`Starting turn for ${currentPlayer.id} (Player ${this.getPlayerNumber(currentPlayer)})`);

        const handleTurn = () => {
            if (currentPlayer.isHuman) {
                this.enableHumanPlay(currentPlayer);
            } else {
                setTimeout(() => {
                    const aiCard = this.getAISelectedCard(currentPlayer);
                    this.playCard(currentPlayer, aiCard);
                }, 1000);
            }
        };

        if (!this.playersWhoHaveRobbed.has(currentPlayer.id)) {
            checkAndHandleRobbing(this, currentPlayer, this.currentTrumpCard, handleTurn);
        } else {
            handleTurn();
        }
    }


    continuePlayerTurn(player) {
        if (player.isHuman) {
            this.enableHumanPlay(player);
        } else {
            setTimeout(() => {
                if (!this.playersWhoHaveRobbed.has(player.id)) {
                    checkAndHandleRobbing(this, player, this.currentTrumpCard, () => {
                        const aiCard = this.getAISelectedCard(player);
                        this.playCard(player, aiCard);
                    });
                } else {
                    const aiCard = this.getAISelectedCard(player);
                    this.playCard(player, aiCard);
                }
            }, 1000);
        }
    }

    playCard(player, card) {
        if (this.trickInProgress && this.trickCards.length >= 4) {
            console.error("Attempted to play a card while a trick is in progress");
            return;
        }

        console.log(`${player.id} is attempting to play: ${card.rank} of ${card.suit}`);

        const playerIndex = this.players.findIndex(p => p.id === player.id);
        const playedCardIndex = player.hand.findIndex(c => c !== null && c.suit === card.suit && c.rank === card.rank);

        if (playedCardIndex === -1) {
            console.error(`Card ${card.rank} of ${card.suit} not found in ${player.id}'s hand`);
            return;
        }

        console.log(`${player.id} played: ${card.rank} of ${card.suit}`);

        console.log(`Before removing card - Player ${player.id}'s hand:`, JSON.stringify(player.hand));
        console.log(`Empty slots before playing:`, Array.from(this.emptySlots[playerIndex]));

        // Remove the card from the player's hand
        player.hand[playedCardIndex] = null;

        console.log(`After removing card - Player ${player.id}'s hand:`, JSON.stringify(player.hand));

        // Update empty slots
        this.emptySlots[playerIndex].add(playedCardIndex);

        console.log(`Empty slots after playing:`, Array.from(this.emptySlots[playerIndex]));

        this.trickCards.push({ player: player.id, card: card });

        const updateUI = () => {
            return new Promise(resolve => {
                if (this.ui && typeof this.ui.showPlayedCard === 'function') {
                    this.ui.showPlayedCard(player, card);
                }
                if (this.ui && typeof this.ui.updatePlayerHandUI === 'function') {
                    console.log(`Updating UI for ${player.id} with empty slots:`, Array.from(this.emptySlots[playerIndex]));
                    // Pass the current empty slots for this player
                    this.ui.updatePlayerHandUI(player, this.emptySlots[playerIndex]);
                }
                // Give the UI a moment to update
                setTimeout(resolve, 100);
            });
        };

        updateUI().then(() => {
            console.log("Cards in trick so far:", this.trickCards);
            console.log(`${player.id}'s hand after playing:`, JSON.stringify(player.hand));

            if (this.trickCards.length === 4) {
                this.trickInProgress = true;
                console.log("All cards played for this trick.");
                setTimeout(() => this.evaluateTrick(), 2000);
            } else {
                this.endTurn();
            }
        });
    }

    endTurn() {
        if (this.trickCards.length >= 4) {
            this.evaluateTrick();
        } else {
            setTimeout(() => {
                this.currentTurnIndex = (this.currentTurnIndex + 1) % 4;
                this.startTurn();
            }, 200);  // Small delay to ensure UI has updated
        }
    }

    evaluateTrick() {
        if (this.trickCards.length !== 4) {
            console.error(`Unexpected number of cards in trick: ${this.trickCards.length}`);
            return;
        }

        const redTrumpRanks = ['2', '3', '4', '6', '7', '8', '9', '10', 'Q', 'K', 'A', 'J', '5'];
        const blackTrumpRanks = ['10', '9', '8', '7', '6', '4', '3', '2', 'Q', 'K', 'A', 'J', '5'];
        const redRanks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const blackRanks = ['10', '9', '8', '7', '6', '5', '4', '3', '2', 'A', 'J', 'Q', 'K'];

        let winningCard, winningPlayer;
        const leadSuit = this.trickCards[0].card.suit;

        const trumpRanks = ['Hearts', 'Diamonds'].includes(this.currentTrumpSuit) ? redTrumpRanks : blackTrumpRanks;

        const trumpCards = this.trickCards.filter(({card}) => 
            card.suit === this.currentTrumpSuit || (card.suit === 'Hearts' && card.rank === 'A')
        );

        if (trumpCards.length > 0) {
            [winningCard, winningPlayer] = trumpCards.reduce((highest, current) => {
                if (current.card.suit === 'Hearts' && current.card.rank === 'A') {
                    return trumpRanks.indexOf('A') > trumpRanks.indexOf(highest[0].rank) ? [current.card, current.player] : highest;
                }
                return trumpRanks.indexOf(current.card.rank) > trumpRanks.indexOf(highest[0].rank) ? [current.card, current.player] : highest;
            }, [trumpCards[0].card, trumpCards[0].player]);
        } else {
            const suitCards = this.trickCards.filter(({card}) => card.suit === leadSuit);
            const ranks = ['Hearts', 'Diamonds'].includes(leadSuit) ? redRanks : blackRanks;
            [winningCard, winningPlayer] = suitCards.reduce((highest, current) => {
                return ranks.indexOf(current.card.rank) > ranks.indexOf(highest[0].rank) ? [current.card, current.player] : highest;
            }, [suitCards[0].card, suitCards[0].player]);
        }

        console.log(`Player ${winningPlayer} wins the trick with the ${winningCard.rank} of ${winningCard.suit}!`);

        this.updateScore(winningPlayer, 5);

        let message;
        if (winningPlayer === 'player1') {
            message = "You win the trick!";
        } else {
            const winnerName = this.ui.getPlayerName(winningPlayer);
            message = `${winnerName} wins the trick!`;
        }

        this.ui.showAlert(message, () => {
            this.clearPlayedCards();
            this.trickInProgress = false;
            this.trickCards = [];

            if (this.checkForWinner()) {
                this.endGame();
            } else if (this.isHandComplete()) {
                this.startNewHand();
            } else {
                this.currentTurnIndex = this.players.findIndex(p => p.id === winningPlayer);
                this.startTurn();
            }
        });
    }

    isHandComplete() {
        return this.players.every(player => player.hand.every(card => card === null));
    }

    checkForWinner() {
        const winner = this.players.find(player => player.score >= 25);
        return winner !== undefined;
    }

    endGame() {
        const winner = this.players.find(player => player.score >= 25);
        const newDealerIndex = (this.dealerIndex + 1) % 4;
        const newDealer = this.players[newDealerIndex];

        this.ui.showAlert(`${this.ui.getPlayerName(winner.id)} wins! ${this.ui.getPlayerName(newDealer.id)} deals for the new game.`, () => {
            this.resetGame();
            this.startNewGame();
        });
    }

    resetGame() {
        this.players.forEach(player => {
            player.score = 0;
            player.hand = [];
            // Don't reset isDealer here
        });
        // Don't reset dealerIndex here
        this.currentTurnIndex = 0;
        this.trickCards = [];
        this.currentTrumpSuit = '';
        this.currentTrumpCard = null;
        this.trickInProgress = false;
        this.playersWhoHaveRobbed.clear();
        this.isFirstTurnAfterDeal = true;
        this.gameEnded = false;
        this.deck = new Deck();
        
        // Reset the UI
        if (this.ui && typeof this.ui.resetGameUI === 'function') {
            this.ui.resetGameUI();
        } else {
            console.error('UI method resetGameUI is not available', this.ui);
        }
    }

    async startNewGame() {
        console.log("=== Starting New Game ===");
        
        await this.ui.resetGameUI();
        this.deck.reset();

        if (this.isFirstGame) {
            this.dealerIndex = Math.floor(Math.random() * this.players.length);
            this.isFirstGame = false;
        } else {
            this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
        }

        console.log(`Player ${this.dealerIndex + 1} is the dealer.`);

        this.players.forEach((player, index) => {
            player.isDealer = (index === this.dealerIndex);
            player.hand = this.deck.deal(5);
            player.score = 0; // Reset score for new game
        });

        const trumpCard = this.deck.cards.pop();
        if (trumpCard) {
            this.setTrumpSuit(trumpCard.suit, trumpCard);
            console.log(`The trump card is: ${trumpCard.rank} of ${trumpCard.suit}`);

            await this.ui.initializeDeckUI(this.dealerIndex, trumpCard);

            for (const player of this.players) {
                await this.ui.initializeHandUI(player);
            }

            if (trumpCard.rank === 'A') {
                const dealer = this.players[this.dealerIndex];
                await handleDealerRob(this, dealer, trumpCard);
            }

            console.log("Starting first turn after dealing and potential robbing");
            this.startFirstTurn();
        } else {
            console.error('Failed to get a trump card from the deck');
            this.ui.showAlert('Error: Failed to get a valid trump card. The game will be reset.', () => {
                this.resetGame();
                this.startNewGame();
            });
        }

        console.log("=== New Game Setup Complete ===");
    }

    startFirstTurn() {
        this.currentTurnIndex = (this.dealerIndex + 1) % this.players.length;
        console.log(`Starting turn for player ${this.currentTurnIndex + 1}`);
        this.startTurn();
    }

    startNewHand(isNewHand = true) {
        console.log("=== Starting New Hand ===");
        console.log(`Previous dealerIndex: ${this.dealerIndex}`);

        this.resetTrick();
        this.playersWhoHaveRobbed.clear();
        this.emptySlots = this.players.map(() => new Set());

        // Move to the next dealer
        this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
        console.log(`New dealerIndex: ${this.dealerIndex}`);    
    
        // Update dealer status for all players
        this.players.forEach((player, index) => {
            player.isDealer = (index === this.dealerIndex);
            console.log(`Player ${player.id} isDealer: ${player.isDealer}`);
        });

        console.log(`Player ${this.getDealerNumber()} is the dealer for this hand (dealerIndex: ${this.dealerIndex}).`);

        this.deck.reset();
        this.deck.shuffle();

        if (this.deck.cards.length < this.players.length * 5 + 1) {
            console.error("Not enough cards in the deck to start a new hand");
            this.ui.showAlert("Error: Not enough cards to start a new hand. The game will be reset.", () => {
                this.resetGame();
                this.startNewGame();
            });
            return;
        }

        // Deal cards to players
        this.players.forEach((player) => {
            player.hand = this.deck.deal(5);
            console.log(`Dealt hand to ${player.id}:`, player.hand);
        });

        // Set trump card
        const trumpCard = this.deck.cards.pop();
        if (trumpCard && trumpCard.suit) {
            this.setTrumpSuit(trumpCard.suit, trumpCard);
            console.log('Trump card:', trumpCard);
        } else {
            console.error('Failed to get a valid trump card from the deck');
            this.ui.showAlert("Error: Failed to get a valid trump card. The game will be reset.", () => {
                this.resetGame();
                this.startNewGame();
            });
            return;
        }

        // Set the first player to the left of the dealer
        this.currentTurnIndex = (this.dealerIndex + 1) % this.players.length;
        console.log(`First player for this hand is Player ${this.currentTurnIndex + 1} (to the left of the dealer)`);    

        // Update UI and then start the game
        this.updateUIForNewHand()
        .then(() => {
            if (this.currentTrumpCard.rank === 'A') {
                const dealer = this.players[this.dealerIndex];
                return new Promise(resolve => {
                    this.ui.showAlert(`${this.ui.getPlayerName(dealer.id)} (Dealer) is robbing.`, () => {
                        handleDealerRob(this, dealer, this.currentTrumpCard, resolve);
                    });
                });
            } else {
                return Promise.resolve();
            }
        })
        .then(() => {
            this.startTurn();
        })
        .catch(error => console.error('Error in startNewHand:', error));
        console.log("=== New Hand Setup Complete ===");
    }

    updateUIForNewHand() {
        return new Promise((resolve) => {
            let updatesComplete = 0;
            const totalUpdates = this.players.length + 1; // +1 for deck UI
            const checkAllUpdatesComplete = () => {
                updatesComplete++;
                if (updatesComplete === totalUpdates) {
                    resolve();
                }
            };
            this.players.forEach(player => {
                if (this.ui && typeof this.ui.initializeHandUI === 'function') {
                    console.log(`Initializing hand UI for ${player.id}`);
                    this.ui.initializeHandUI(player, checkAllUpdatesComplete);
                } else {
                    console.error('UI method initializeHandUI is not available', this.ui);
                    checkAllUpdatesComplete();
                }
            });
            if (this.ui && typeof this.ui.initializeDeckUI === 'function') {
                this.ui.initializeDeckUI(this.dealerIndex, this.currentTrumpCard, checkAllUpdatesComplete);
            } else {
                console.error('UI method initializeDeckUI is not available', this.ui);
                checkAllUpdatesComplete();
            }
        });
    }
    
    checkForRobbingAndStartGame(trumpCard) {
        if (trumpCard.rank === 'A') {
            const dealer = this.players[this.currentTurnIndex];
            this.initiateRobbing([dealer], trumpCard, () => {
                this.isFirstTurnAfterDeal = false;
                this.startTurn();
            });
        } else {
            this.isFirstTurnAfterDeal = true;
            this.startTurn();
        }
    }

    enableHumanPlay(player) {
        const leadCard = this.trickCards.length > 0 ? this.trickCards[0].card : null;
        const leadSuit = leadCard ? leadCard.suit : null;
        const playableCards = player.hand.filter(card => 
            card !== null && canPlayCard(player, card, leadCard, leadSuit, this.currentTrumpSuit)
        );

        this.ui.highlightPlayableCards(player, playableCards);
        this.promptForCardSelection(player, playableCards);
    }

    promptForCardSelection(player, playableCards) {
        if (this.ui && typeof this.ui.disableCardSelection === 'function') {
            this.ui.disableCardSelection(player);
        }
        if (this.ui && typeof this.ui.disableCardTouchSelection === 'function') {
            this.ui.disableCardTouchSelection(player);
        }

        const handleCardSelect = (selectedCard) => {
            if (playableCards.some(card => card.suit === selectedCard.suit && card.rank === selectedCard.rank)) {
                this.ui.disableCardSelection(player);
                this.ui.disableCardTouchSelection(player);
                this.playCard(player, selectedCard);
            } else {
                this.ui.showAlert('Invalid card selection. Please choose another card.', () => {
                    this.promptForCardSelection(player, playableCards);
                });
            }
        };

        if ('ontouchstart' in window) {
            if (this.ui && typeof this.ui.enableCardTouchSelection === 'function') {
                this.ui.enableCardTouchSelection(player, handleCardSelect);
            } else {
                console.error('UI method enableCardTouchSelection is not available', this.ui);
            }
        } else {
            if (this.ui && typeof this.ui.enableCardSelection === 'function') {
                this.ui.enableCardSelection(player, handleCardSelect);
            } else {
                console.error('UI method enableCardSelection is not available', this.ui);
            }
        }
    }

    resetTrick() {
        this.clearPlayedCards();
        this.trickCards = [];
    }

    clearPlayedCards() {
        if (this.ui && typeof this.ui.clearAllPlayedCards === 'function') {
            this.ui.clearAllPlayedCards();
        } else {
            console.error('UI method clearAllPlayedCards is not available', this.ui);
            this.players.forEach(player => {
                if (this.ui && typeof this.ui.clearPlayedCard === 'function') {
                    this.ui.clearPlayedCard(player.id);
                } else {
                    console.error('UI method clearPlayedCard is not available', this.ui);
                }
            });
        }
    }

    updateScore(playerId, points) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            player.score += points;
            if (this.ui && typeof this.ui.updateScoreUI === 'function') {
                this.ui.updateScoreUI(playerId, player.score);
            } else {
                console.error('UI method updateScoreUI is not available', this.ui);
            }
        } else {
            console.error(`Player with id ${playerId} not found`);
        }
    }

    setTrumpSuit(suit, card) {
        this.currentTrumpSuit = suit;
        this.currentTrumpCard = card;
        console.log(`Trump suit set to: ${this.currentTrumpSuit}`);
        if (card) {
            console.log(`Trump card is: ${card.rank} of ${card.suit}`);
        } else {
            console.log('No specific trump card set');
        }
    }

    getCurrentTrumpSuit() {
        return this.currentTrumpSuit;
    }

    getCurrentTrumpCard() {
        return this.currentTrumpCard;
    }

    getAISelectedCard(player) {
        const leadCard = this.trickCards.length > 0 ? this.trickCards[0].card : null;
        const leadSuit = leadCard ? leadCard.suit : null;
        const playableCards = player.hand.filter(card => 
            card !== null && canPlayCard(player, card, leadCard, leadSuit, this.currentTrumpSuit)
        );

        if (playableCards.length === 0) {
            console.warn('No playable cards found for AI player. This should not happen.');
            return player.hand.find(card => card !== null);
        }

        // AI logic to select the best card...
        // For simplicity, we'll just return a random playable card
        return playableCards[Math.floor(Math.random() * playableCards.length)];
    }

    selectAICard(playableCards, leadCard, trumpSuit) {
        const redTrumpRanks = ['2', '3', '4', '6', '7', '8', '9', '10', 'Q', 'K', 'A', 'J', '5'];
        const blackTrumpRanks = ['10', '9', '8', '7', '6', '4', '3', '2', 'Q', 'K', 'A', 'J', '5'];
        const redRanks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const blackRanks = ['10', '9', '8', '7', '6', '5', '4', '3', '2', 'A', 'J', 'Q', 'K'];
    
        // If leading, choose a random card
        if (!leadCard) {
            return playableCards[Math.floor(Math.random() * playableCards.length)];
        }
    
        const trumpRanks = ['Hearts', 'Diamonds'].includes(trumpSuit) ? redTrumpRanks : blackTrumpRanks;
        const trumpCards = playableCards.filter(card => 
            card.suit === trumpSuit || (card.suit === 'Hearts' && card.rank === 'A')
        );
    
        // Find the highest trump played so far
        const highestTrumpPlayed = this.trickCards
            .filter(played => played.card.suit === trumpSuit || (played.card.suit === 'Hearts' && played.card.rank === 'A'))
            .reduce((highest, current) => 
                trumpRanks.indexOf(current.card.rank) > trumpRanks.indexOf(highest.card.rank) ? current : highest
            , { card: { rank: '2' } });  // Default to lowest rank if no trump played
    
        // If we have trumps, check if we can win with them
        if (trumpCards.length > 0) {
            const winningTrump = trumpCards.find(card => 
                trumpRanks.indexOf(card.rank) > trumpRanks.indexOf(highestTrumpPlayed.card.rank)
            );
    
            if (winningTrump) {
                // Play the lowest winning trump
                return trumpCards.reduce((lowest, current) => 
                    trumpRanks.indexOf(current.rank) > trumpRanks.indexOf(highestTrumpPlayed.card.rank) &&
                    trumpRanks.indexOf(current.rank) < trumpRanks.indexOf(lowest.rank) ? current : lowest
                );
            }
        }
    
        // If we can't win with a trump or have no trumps, play a non-trump if possible
        const nonTrumpCards = playableCards.filter(card => 
            card.suit !== trumpSuit && !(card.suit === 'Hearts' && card.rank === 'A')
        );
    
        if (nonTrumpCards.length > 0) {
            // Play the lowest non-trump
            const ranks = ['Hearts', 'Diamonds'].includes(nonTrumpCards[0].suit) ? redRanks : blackRanks;
            return nonTrumpCards.reduce((lowest, current) =>
                ranks.indexOf(current.rank) > ranks.indexOf(lowest.rank) ? current : lowest
            );
        }
    
        // If we only have trumps left, play the lowest
        return trumpCards.reduce((lowest, current) =>
            trumpRanks.indexOf(current.rank) > trumpRanks.indexOf(lowest.rank) ? current : lowest
        );
    }

    initiateRobbing(players, trumpCard, callback) {
        const dealer = players.find(p => p.isDealer);
        
        if (dealer && trumpCard.rank === 'A') {
            if (dealer.isHuman) {
                this.ui.showAlert("You (the dealer) must rob the Ace. Select a card to pay for the rob.", () => {
                    this.ui.enableCardSelection(dealer, (selectedCard) => {
                        performRob(this, dealer, selectedCard, trumpCard);
                        callback();
                    });
                });
            } else {
                const selectedCard = this.selectCardForRob(dealer);
                performRob(this, dealer, selectedCard, trumpCard);
                this.ui.showAlert(`The dealer (Player ${dealer.id}) is robbing.`, callback);
            }
        } else {
            callback();
        }
    }

    selectCardForRob(player) {
        return player.hand.find(card => !(card.suit === this.currentTrumpSuit && card.rank === 'A'));
    }

    
}

console.log('Game class defined');
export default Game;