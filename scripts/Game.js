// Game.js

import { canPlayCard, initiateRobbing, checkAndHandleRobbing, performRob, handleDealerRob } from './CardRules.js';
import Deck from './Deck.js';

class Game {
    constructor(ui) {
        this.players = [
            { id: 'player1', isHuman: true, hand: [], isDealer: false, score: 0 },
            { id: 'player2', isHuman: false, hand: [], isDealer: false, score: 0 },
            { id: 'player3', isHuman: false, hand: [], isDealer: false, score: 0 },
            { id: 'player4', isHuman: false, hand: [], isDealer: false, score: 0 }
        ];
        this.currentTurnIndex = 0;
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

    startTurn() {
        if (this.gameEnded) {
            return;
        }
        const currentPlayer = this.players[this.currentTurnIndex];
        console.log(`Starting turn for ${currentPlayer.id}`);
        
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
            if (this.isFirstTurnAfterDeal && this.currentTrumpCard.rank === 'A' && currentPlayer.isDealer) {
                handleDealerRob(this, currentPlayer, this.currentTrumpCard, () => {
                    this.isFirstTurnAfterDeal = false;
                    handleTurn();
                });
            } else {
                checkAndHandleRobbing(this, currentPlayer, this.currentTrumpCard, handleTurn);
            }
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

        console.log(`${player.id} played: ${card.rank} of ${card.suit}`);

        const playerIndex = this.players.findIndex(p => p.id === player.id);
        const playedCardIndex = player.hand.findIndex(c => c.suit === card.suit && c.rank === card.rank);

        // Remove the card from the player's hand
        player.hand.splice(playedCardIndex, 1);
        
        // Add the index to empty slots
        this.emptySlots[playerIndex].add(playedCardIndex);

        this.trickCards.push({ player: player.id, card: card });

        const updateUI = () => {
            return new Promise(resolve => {
                if (this.ui && typeof this.ui.showPlayedCard === 'function') {
                    this.ui.showPlayedCard(player, card);
                }
                if (this.ui && typeof this.ui.updatePlayerHandUI === 'function') {
                    this.ui.updatePlayerHandUI(player, this.emptySlots[playerIndex]);
                }
                setTimeout(resolve, 100);
            });
        };

        updateUI().then(() => {
            console.log("Cards in trick so far:", this.trickCards);
            console.log(`${player.id}'s hand after playing:`, player.hand);
    
            if (this.trickCards.length === 4) {
                this.trickInProgress = true;
                console.log("All cards played for this trick.");
                setTimeout(() => this.evaluateTrick(), 1000);
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

        this.ui.showAlert(`Player ${winningPlayer} wins the trick!`, () => {
            this.clearPlayedCards();
            this.trickInProgress = false;
            this.trickCards = [];

            if (this.checkForWinner()) {
                this.endGame();
            } else if (this.players.some(p => p.hand.length === 0)) {
                this.startNewHand();
            } else {
                this.currentTurnIndex = this.players.findIndex(p => p.id === winningPlayer);
                this.startTurn();
            }
        });
    }

    checkForWinner() {
        const winner = this.players.find(player => player.score >= 25);
        return winner !== undefined;
    }

    endGame() {
        const winner = this.players.find(player => player.score >= 25);
        const newDealerIndex = (this.players.findIndex(p => p.isDealer) + 1) % 4;
        const newDealer = this.players[newDealerIndex];

        this.ui.showAlert(`Player ${winner.id} wins! Player ${newDealer.id} deals for the new game.`, () => {
            this.resetGame();
            this.startNewGame(newDealerIndex);
        });
    }

    resetGame() {
        this.players.forEach(player => {
            player.score = 0;
            player.hand = [];
            player.isDealer = false;
            
            // Update the UI to show the reset score
            if (this.ui && typeof this.ui.updateScoreUI === 'function') {
                this.ui.updateScoreUI(player.id, player.score);
            } else {
                console.error('UI method updateScoreUI is not available', this.ui);
            }
        });
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

    startNewGame(newDealerIndex) {
        this.players[newDealerIndex].isDealer = true;
        this.currentTurnIndex = newDealerIndex;
        this.startNewHand();
    }

    startNewHand() {
        console.log("Starting a new hand");
        
        this.resetTrick();
        this.playersWhoHaveRobbed.clear();
        this.emptySlots = this.players.map(() => new Set());
    
        // Update dealer
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
        const dealerIndex = this.currentTurnIndex;
        
        this.deck.reset();
        this.deck.shuffle();
    
        if (this.deck.cards.length < this.players.length * 5 + 1) {
            console.error("Not enough cards in the deck to start a new hand");
            this.ui.showAlert("Error: Not enough cards to start a new hand. The game will be reset.", () => {
                this.resetGame();
                this.startNewGame(Math.floor(Math.random() * this.players.length));
            });
            return;
        }
    
        // Deal cards to players
        this.players.forEach((player, index) => {
            player.isDealer = (index === dealerIndex);
            player.hand = this.deck.deal(5);
            console.log(`Dealt hand to ${player.id}:`, player.hand);
        });
    
        // Set trump card
        const trumpCard = this.deck.cards.pop();
        if (trumpCard && trumpCard.suit) {
            this.setTrumpSuit(trumpCard.suit, trumpCard);
            console.log('Trump card:', trumpCard); // Add this log
        } else {
            console.error('Failed to get a valid trump card from the deck');
            this.ui.showAlert("Error: Failed to get a valid trump card. The game will be reset.", () => {
                this.resetGame();
                this.startNewGame(Math.floor(Math.random() * this.players.length));
            });
            return;
        }
    
        // Set the first player to the left of the dealer
        this.currentTurnIndex = (dealerIndex + 1) % this.players.length;
    
        // Update UI and then start the game
        this.updateUIForNewHand()
            .then(() => {
                if (trumpCard.rank === 'A') {
                    const dealer = this.players[dealerIndex];
                    return new Promise(resolve => {
                        handleDealerRob(this, dealer, trumpCard, resolve);
                    });
                } else {
                    this.isFirstTurnAfterDeal = true;
                    return Promise.resolve();
                }
            })
            .then(() => {
                this.startTurn();
            })
            .catch(error => console.error('Error in startNewHand:', error));
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
                    console.log(`Initializing hand UI for ${player.id}`); // Add this log
                    this.ui.initializeHandUI(player, checkAllUpdatesComplete);
                } else {
                    console.error('UI method initializeHandUI is not available', this.ui);
                    checkAllUpdatesComplete();
                }
            });
            if (this.ui && typeof this.ui.initializeDeckUI === 'function') {
                this.ui.initializeDeckUI(this.currentTurnIndex, this.currentTrumpCard, checkAllUpdatesComplete);
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
        if (!this.playersWhoHaveRobbed.has(player.id)) {
            checkAndHandleRobbing(this, player, this.currentTrumpCard, () => {
                this.promptForCardSelection(player);
            });
        } else {
            this.promptForCardSelection(player);
        }
    }

    promptForCardSelection(player) {
        if (this.ui && typeof this.ui.enableCardSelection === 'function') {
            // Disable any existing card selection before enabling a new one
            this.ui.disableCardSelection(player);
            
            this.ui.enableCardSelection(player, (selectedCard) => {
                const leadCard = this.trickCards.length > 0 ? this.trickCards[0].card : null;
                const leadSuit = leadCard ? leadCard.suit : null;

                if (canPlayCard(player, selectedCard, leadCard, leadSuit, this.currentTrumpSuit)) {
                    this.ui.disableCardSelection(player);  // Disable selection after a valid card is chosen
                    this.playCard(player, selectedCard);
                } else {
                    this.ui.showAlert('Invalid card selection. Please choose another card.', () => {
                        // We don't need to call promptForCardSelection again here
                        // The existing event listeners will allow the player to select another card
                    });
                }
            });
        } else {
            console.error('UI method enableCardSelection is not available', this.ui);
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
            canPlayCard(player, card, leadCard, leadSuit, this.currentTrumpSuit)
        );
    
        if (playableCards.length === 0) {
            console.warn('No playable cards found for AI player. This should not happen.');
            return player.hand[Math.floor(Math.random() * player.hand.length)];
        }
    
        const redTrumpRanks = ['2', '3', '4', '6', '7', '8', '9', '10', 'Q', 'K', 'A', 'J', '5'];
        const blackTrumpRanks = ['10', '9', '8', '7', '6', '4', '3', '2', 'Q', 'K', 'A', 'J', '5'];
        const redRanks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const blackRanks = ['10', '9', '8', '7', '6', '5', '4', '3', '2', 'A', 'J', 'Q', 'K'];
    
        const trumpCards = playableCards.filter(card => 
            card.suit === this.currentTrumpSuit || (card.suit === 'Hearts' && card.rank === 'A')
        );
    
        const trumpRanks = ['Hearts', 'Diamonds'].includes(this.currentTrumpSuit) ? redTrumpRanks : blackTrumpRanks;
    
        // If leading, prefer to lead a non-trump if possible
        if (!leadCard) {
            const nonTrumpCards = playableCards.filter(card => card.suit !== this.currentTrumpSuit && !(card.suit === 'Hearts' && card.rank === 'A'));
            if (nonTrumpCards.length > 0) {
                const ranks = ['Hearts', 'Diamonds'].includes(nonTrumpCards[0].suit) ? redRanks : blackRanks;
                return nonTrumpCards.reduce((highest, current) =>
                    ranks.indexOf(current.rank) < ranks.indexOf(highest.rank) ? current : highest
                );
            }
        }
    
        // If trump was led, play highest trump if possible, unless only Ace of Hearts
        if (leadCard && (leadCard.suit === this.currentTrumpSuit || (leadCard.suit === 'Hearts' && leadCard.rank === 'A'))) {
            if (trumpCards.length > 0) {
                if (trumpCards.length === 1 && trumpCards[0].suit === 'Hearts' && trumpCards[0].rank === 'A') {
                    // If only trump is Ace of Hearts, play lowest non-trump
                    const nonTrumpCards = playableCards.filter(card => card.suit !== this.currentTrumpSuit && !(card.suit === 'Hearts' && card.rank === 'A'));
                    const ranks = ['Hearts', 'Diamonds'].includes(nonTrumpCards[0].suit) ? redRanks : blackRanks;
                    return nonTrumpCards.reduce((lowest, current) =>
                        ranks.indexOf(current.rank) > ranks.indexOf(lowest.rank) ? current : lowest
                    );
                }
                return trumpCards.reduce((highest, current) =>
                    trumpRanks.indexOf(current.rank) < trumpRanks.indexOf(highest.rank) ? current : highest
                );
            }
        }
    
        // If following suit, play highest card of the suit
        const leadSuitCards = playableCards.filter(card => card.suit === leadSuit);
        if (leadSuitCards.length > 0) {
            const ranks = ['Hearts', 'Diamonds'].includes(leadSuit) ? redRanks : blackRanks;
            return leadSuitCards.reduce((highest, current) =>
                ranks.indexOf(current.rank) < ranks.indexOf(highest.rank) ? current : highest
            );
        }
    
        // If can't follow suit and have trump, play lowest trump
        if (trumpCards.length > 0) {
            return trumpCards.reduce((lowest, current) =>
                trumpRanks.indexOf(current.rank) > trumpRanks.indexOf(lowest.rank) ? current : lowest
            );
        }
    
        // If can't follow suit and don't have trump, play lowest card
        const ranks = ['Hearts', 'Diamonds'].includes(playableCards[0].suit) ? redRanks : blackRanks;
        return playableCards.reduce((lowest, current) =>
            ranks.indexOf(current.rank) > ranks.indexOf(lowest.rank) ? current : lowest
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