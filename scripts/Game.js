// Game.js

import { canPlayCard } from './CardRules.js';
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

    async startTurn() {
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
                    console.log('AI player hand before getAISelectedCard:', currentPlayer.hand);
                    const aiCard = this.getAISelectedCard(currentPlayer);
                    console.log('Selected AI card:', aiCard);
                    if (aiCard && typeof aiCard === 'object' && aiCard.rank && aiCard.suit) {
                        this.playCard(currentPlayer, aiCard);
                    } else {
                        console.error(`AI player ${currentPlayer.id} couldn't select a valid card`, aiCard);
                        // Handle this error case, perhaps by skipping the turn or ending the game
                    }
                }, 1000);
            }
        };

        if (!this.playersWhoHaveRobbed.has(currentPlayer.id)) {
            try {
                await this.checkAndHandleRobbing(currentPlayer, this.currentTrumpCard);
                handleTurn();
            } catch (error) {
                console.error("Error during robbing check:", error);
                // Optionally handle the error, perhaps by skipping the turn or showing an alert
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

        if (!card || typeof card !== 'object' || !card.rank || !card.suit) {
            console.error('Invalid card passed to playCard:', card);
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
        this.emptySlots = this.players.map(() => new Set());  // Reset empty slots
        
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
            player.score = 0;  // Reset score for new game
            console.log(`Dealt hand to ${player.id}:`, JSON.stringify(player.hand));
        });

        const trumpCard = this.deck.cards.pop();
        if (trumpCard) {
            this.setTrumpSuit(trumpCard.suit, trumpCard);
            console.log(`The trump card is: ${trumpCard.rank} of ${trumpCard.suit}`);

            this.ui.initializeDeckUI(this.dealerIndex, trumpCard);

            const initializeHandPromises = this.players.map(player => 
                new Promise(resolve => {
                    this.ui.initializeHandUI(player, () => {
                        console.log(`Initialized UI for ${player.id}'s hand`);
                        resolve();
                    });
                })
            );

            await Promise.all(initializeHandPromises)
            console.log("All hands initialized");
            if (trumpCard.rank === 'A') {
                const dealer = this.players[this.dealerIndex];
                await this.handleDealerRob(dealer, trumpCard);
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
                        this.handleDealerRob(dealer, this.currentTrumpCard, resolve);
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
        console.log('Player hand:', player.hand); // Add this log
        let playableCards;
        if (!leadCard) {
            // If there's no lead card, all cards are playable
            playableCards = player.hand.filter(card => card !== null);
        } else {
            playableCards = player.hand.filter(card => 
                card !== null && canPlayCard(player, card, leadCard, leadSuit, this.currentTrumpSuit)
            );
        }

        console.log('Playable cards:', playableCards); // Add this log
        this.ui.highlightPlayableCards(player, playableCards);
        this.promptForCardSelection(player, playableCards);
    }

    promptForCardSelection(player, playableCards) {
        if (this.ui && typeof this.ui.disableCardSelection === 'function') {
            this.ui.disableCardSelection(player);
        }

        const handleCardSelect = (selectedCard) => {
            if (playableCards.some(card => card.suit === selectedCard.suit && card.rank === selectedCard.rank)) {
                this.ui.disableCardSelection(player);
                this.playCard(player, selectedCard);
            } else {
                this.ui.showAlert('Invalid card selection. Please choose another card.', () => {
                    this.promptForCardSelection(player, playableCards);
                });
            }
        };

        if ('ontouchstart' in window) {
            if (this.ui && typeof this.ui.enableCardSelection === 'function') {
                this.ui.enableCardSelection(player, handleCardSelect);
            } else {
                console.error('UI method enableCardSelection is not available', this.ui);
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
        console.log('AI player hand:', player.hand);
        
        // Filter out null or undefined cards
        const validHand = player.hand.filter(card => card != null);
        console.log('Valid cards in AI hand:', validHand);

        if (validHand.length === 0) {
            console.error('No valid cards in AI player hand');
            return null;
        }

        const leadCard = this.trickCards.length > 0 ? this.trickCards[0].card : null;
        const leadSuit = leadCard ? leadCard.suit : null;
        console.log('Lead card:', leadCard, 'Lead suit:', leadSuit, 'Trump suit:', this.currentTrumpSuit);

        const playableCards = validHand.filter(card => 
            canPlayCard(player, card, leadCard, leadSuit, this.currentTrumpSuit)
        );

        console.log('Playable cards for AI:', playableCards);

        if (playableCards.length === 0) {
            console.error('No playable cards found for AI player. This should not happen.');
            return null;
        }

        // Select a random playable card
        const selectedCard = playableCards[Math.floor(Math.random() * playableCards.length)];
        console.log('Selected AI card:', selectedCard);
        return selectedCard;
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

    async initiateRobbing(players, trumpCard) {
        const dealer = players.find(p => p.isDealer);
        
        if (dealer && trumpCard.rank === 'A' && !this.playersWhoHaveRobbed.has(dealer.id)) {
            await this.handleDealerRob(dealer, trumpCard);
        } else {
            const playerWithAce = players.find(p => 
                p.hand.some(card => card.suit === trumpCard.suit && card.rank === 'A') && 
                !this.playersWhoHaveRobbed.has(p.id)
            );

            if (playerWithAce) {
                await this.handlePlayerRob(playerWithAce, trumpCard);
            }
        }
    }

    async checkAndHandleRobbing(player, trumpCard) {
        console.log(`Checking robbing for ${player.id}. Has robbed: ${this.playersWhoHaveRobbed.has(player.id)}`);

        if (this.playersWhoHaveRobbed.has(player.id)) {
            console.log(`${player.id} has already robbed this hand. Skipping rob check.`);
            return;
        }

        const aceOfTrumps = player.hand.find(card => card && card.suit === trumpCard.suit && card.rank === 'A');

        if (aceOfTrumps) {
            await this.handlePlayerRob(player, trumpCard);
            this.playersWhoHaveRobbed.add(player.id);
            console.log(`${player.id} has now robbed. Added to playersWhoHaveRobbed.`);
        }
    }

    handleDealerRob(dealer, trumpCard) {
        return new Promise((resolve) => {
            if (this.playersWhoHaveRobbed.has(dealer.id)) {
                console.log(`Dealer ${dealer.id} has already robbed this hand.`);
                resolve();
                return;
            }

            this.ui.showAlert(`${this.ui.getPlayerName(dealer.id)} (Dealer) is robbing.`, () => {
                if (dealer.isHuman) {
                    this.ui.showAlert("You (the dealer) must rob the Ace. Select a card to pay for the rob.", () => {
                        this.ui.enableCardSelection(dealer, (selectedCard) => {
                            if (selectedCard.suit === trumpCard.suit && selectedCard.rank === 'A') {
                                this.ui.showAlert("You cannot use the Ace of trumps to pay for the rob. Please select another card.", () => {
                                    this.ui.enableCardSelection(dealer, (newSelectedCard) => {
                                        this.performRob(dealer, newSelectedCard, trumpCard);
                                        this.playersWhoHaveRobbed.add(dealer.id);
                                        this.isFirstTurnAfterDeal = false;
                                        console.log("Human dealer rob completed");
                                        resolve();
                                    });
                                });
                            } else {
                                this.performRob(dealer, selectedCard, trumpCard);
                                this.playersWhoHaveRobbed.add(dealer.id);
                                this.isFirstTurnAfterDeal = false;
                                console.log("Human dealer rob completed");
                                resolve();
                            }
                        });
                    });
                } else {
                    const selectedCard = this.selectCardForRob(dealer, trumpCard.suit);
                    this.performRob(dealer, selectedCard, trumpCard);
                    this.playersWhoHaveRobbed.add(dealer.id);
                    this.isFirstTurnAfterDeal = false;
                    console.log("AI dealer rob completed");
                    resolve();
                }
            });
        });
    }
    handlePlayerRob(player, trumpCard) {
        return new Promise((resolve) => {
            if (player.isHuman) {
                this.ui.showAlert("You must rob. Select a card to pay for the rob.", () => {
                    const enableRobSelection = () => {
                        this.ui.enableCardSelectionForRob(player, trumpCard.suit, (selectedCard) => {
                            if (selectedCard.suit === trumpCard.suit && selectedCard.rank === 'A') {
                                this.ui.showAlert("You cannot use the Ace of trumps to pay for the rob. Please select another card.", enableRobSelection);
                            } else {
                                this.performRob(player, selectedCard, trumpCard);
                                console.log('Player hand after robbing:', player.hand); // Add this log
                                resolve();
                            }
                        });
                    };
                    enableRobSelection();
                });
            } else {
                const selectedCard = this.selectCardForRob(player, trumpCard.suit);
                this.performRob(player, selectedCard, trumpCard);
                this.playersWhoHaveRobbed.add(player.id);
                this.ui.showAlert(`${this.ui.getPlayerName(player.id)} is robbing.`, () => {
                    this.ui.updatePlayerHandUIAfterRob(player, player.hand.findIndex(card => card === null), trumpCard);
                    resolve();
                });
            }
        });
    }

    performRob(player, selectedCard, trumpCard) {
        if (!trumpCard || typeof trumpCard !== 'object') {
            console.error('Invalid trumpCard in performRob:', trumpCard);
            return;
        }
        console.log(`${player.id}'s hand before robbing:`, JSON.stringify(player.hand));
        console.log(`${player.id} is robbing. Discarding ${selectedCard.rank} of ${selectedCard.suit} and taking ${trumpCard.rank} of ${trumpCard.suit}`);

        // Check if the selected card is the Ace of trumps
        if (selectedCard.suit === trumpCard.suit && selectedCard.rank === 'A') {
            console.error("Cannot use Ace of trumps to pay for rob");
            if (player.isHuman) {
                this.ui.showAlert("You cannot use the Ace of trumps to pay for the rob. Please select another card.", () => {
                    this.ui.enableCardSelectionForRob(player, trumpCard.suit, (newSelectedCard) => {
                        this.performRob(player, newSelectedCard, trumpCard);
                    });
                });
            } else {
                // For AI, select a different card
                console.warn("AI attempted to rob with Ace of trumps. Selecting a different card.");
                const newSelectedCard = this.selectCardForRob(player, trumpCard.suit);
                this.performRob(player, newSelectedCard, trumpCard);
            }
            return;
        }

        const initialHandSize = player.hand.length;
        const discardedCardIndex = player.hand.findIndex(card =>
            card.suit === selectedCard.suit && card.rank === selectedCard.rank
        );

        console.log(`Discarding card at index ${discardedCardIndex}`);

        // Remove the selected card
        player.hand.splice(discardedCardIndex, 1);

        console.log(`Hand after discarding:`, JSON.stringify(player.hand));

        // Add the trump card at the same index
        player.hand.splice(discardedCardIndex, 0, trumpCard);

        console.log(`Hand after adding trump card:`, JSON.stringify(player.hand));

        if (this.ui && typeof this.ui.updatePlayerHandUIAfterRob === 'function') {
            this.ui.updatePlayerHandUIAfterRob(player, discardedCardIndex, trumpCard);
        } else {
            console.error('UI method updatePlayerHandUIAfterRob is not available', this.ui);
        }

        if (this.ui && typeof this.ui.updateDeckUIAfterRob === 'function') {
            const dealerIndex = this.players.findIndex(p => p.isDealer);
            this.ui.updateDeckUIAfterRob(dealerIndex);
        } else {
            console.error('UI method updateDeckUIAfterRob is not available', this.ui);
        }

        console.log(`${player.id}'s hand after robbing:`, JSON.stringify(player.hand));

        if (player.hand.length !== initialHandSize) {
            console.error(`Error in robbing process: Hand size changed from ${initialHandSize} to ${player.hand.length}`);
        }

        this.playersWhoHaveRobbed.add(player.id);
        console.log(`${player.id} has now robbed. Added to playersWhoHaveRobbed.`);
    }

    selectCardForRob(player, trumpSuit) {
        // Filter out the Ace of trumps and return the first valid card
        const validCards = player.hand.filter(card => 
            card !== null && !(card.suit === trumpSuit && card.rank === 'A')
        );

        if (validCards.length === 0) {
            console.error(`No valid cards found for ${player.id} to rob with.`);
            return null;
        }

        // For simplicity, we're selecting the first valid card
        // You might want to implement a more sophisticated selection strategy for AI players
        return validCards[0];
    }

}

console.log('Game class defined');
export default Game;