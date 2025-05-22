// Hi-Lo Game Logic
console.log('Hi-Lo game loaded');

// Game state
let deck = [];
let currentCard = null;
let nextCard = null;
let currentBet = 0;
let gameInProgress = false;
let predictionMade = false;
let currentStreak = 0;

// Game stats
let gamesPlayed = 0;
let gamesWon = 0;
let bestStreak = 0;
let totalProfit = 0;

// Card constants
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const suitSymbols = {
    'hearts': '♥',
    'diamonds': '♦',
    'clubs': '♣',
    'spades': '♠'
};
const cardValues = {
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    'J': 11,
    'Q': 12,
    'K': 13,
    'A': 14
};

// Sound effects
const dealSound = new Audio('../assets/sounds/card-deal.mp3');
const winSound = new Audio('../assets/sounds/win.mp3');
const loseSound = new Audio('../assets/sounds/lose.mp3');
const clickSound = new Audio('../assets/sounds/click.mp3');
const chipSound = new Audio('../assets/sounds/chip.mp3');
const flipSound = new Audio('../assets/sounds/card-flip.mp3');

// DOM Elements
let currentCardElement;
let nextCardElement;
let predictionResultElement;
let betAmountElement;
let currentStreakElement;
let startButton;
let higherButton;
let lowerButton;
let newGameButton;
let gamesPlayedElement;
let gamesWonElement;
let bestStreakElement;
let totalProfitElement;

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Hi-Lo game');
    
    // Initialize DOM elements
    currentCardElement = document.getElementById('currentCard');
    nextCardElement = document.getElementById('nextCard');
    predictionResultElement = document.getElementById('predictionResult');
    betAmountElement = document.getElementById('betAmount');
    currentStreakElement = document.getElementById('currentStreak');
    startButton = document.getElementById('startButton');
    higherButton = document.getElementById('higherButton');
    lowerButton = document.getElementById('lowerButton');
    newGameButton = document.getElementById('newGameButton');
    gamesPlayedElement = document.getElementById('gamesPlayed');
    gamesWonElement = document.getElementById('gamesWon');
    bestStreakElement = document.getElementById('bestStreak');
    totalProfitElement = document.getElementById('totalProfit');
    
    // Create a fresh deck
    createDeck();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load game stats from local storage
    loadGameStats();
    
    console.log('Hi-Lo game initialized');
});

// Create and shuffle a new deck
function createDeck() {
    deck = [];
    
    for (let suit of suits) {
        for (let value of values) {
            deck.push({ suit, value });
        }
    }
    
    // Shuffle the deck
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    console.log('Deck created and shuffled', deck.length + ' cards');
}

// Set up event listeners
function setupEventListeners() {
    // Betting chips
    const chipElements = document.querySelectorAll('.chip');
    chipElements.forEach(chip => {
        chip.addEventListener('click', () => {
            if (gameInProgress) return;
            
            const chipValue = parseInt(chip.getAttribute('data-value'));
            const currentBalance = parseInt(document.querySelector('.balance-amount').textContent);
            
            if (currentBalance >= chipValue) {
                addToBet(chipValue);
                chipSound.play();
                
                // Add floating animation
                animateChip(chip);
            } else {
                showMessage('Not enough balance!', 'error');
            }
        });
    });
    
    // Start button
    startButton.addEventListener('click', () => {
        if (currentBet > 0 && !gameInProgress) {
            startGame();
            clickSound.play();
        } else if (currentBet === 0) {
            showMessage('Please place a bet first!', 'error');
        }
    });
    
    // Higher button
    higherButton.addEventListener('click', () => {
        if (gameInProgress && !predictionMade) {
            makeHigherPrediction();
            clickSound.play();
        }
    });
    
    // Lower button
    lowerButton.addEventListener('click', () => {
        if (gameInProgress && !predictionMade) {
            makeLowerPrediction();
            clickSound.play();
        }
    });
    
    // New game button
    newGameButton.addEventListener('click', () => {
        resetGame();
        clickSound.play();
    });
}

// Add to current bet
function addToBet(amount) {
    const currentBalance = parseInt(document.querySelector('.balance-amount').textContent);
    
    if (currentBalance >= amount) {
        currentBet += amount;
        betAmountElement.textContent = currentBet;
        
        // Update balance
        document.querySelector('.balance-amount').textContent = currentBalance - amount;
    }
}

// Start a new game
function startGame() {
    // Update game state
    gameInProgress = true;
    predictionMade = false;
    
    // Hide new game button and show prediction buttons
    newGameButton.style.display = 'none';
    startButton.disabled = true;
    higherButton.disabled = false;
    lowerButton.disabled = false;
    
    // Reset prediction result
    predictionResultElement.textContent = '';
    predictionResultElement.className = 'prediction-result';
    
    // Create a new deck if needed
    if (deck.length < 2) {
        createDeck();
    }
    
    // Deal current card
    currentCard = deck.pop();
    displayCard(currentCardElement, currentCard);
    
    // Prepare next card (hidden)
    nextCard = deck.pop();
    nextCardElement.innerHTML = '<div class="card-inner"></div>';
    nextCardElement.classList.add('hidden');
    
    // Play deal sound
    dealSound.play();
    
    // Update stats
    gamesPlayed++;
    gamesPlayedElement.textContent = gamesPlayed;
    saveGameStats();
}

// Display a card
function displayCard(cardElement, card) {
    const cardInner = cardElement.querySelector('.card-inner');
    cardInner.innerHTML = '';
    
    // Card value
    const valueElement = document.createElement('div');
    valueElement.className = 'card-value';
    valueElement.textContent = card.value;
    
    // Card suit symbol
    const suitElement = document.createElement('div');
    suitElement.className = `card-suit ${card.suit}`;
    suitElement.textContent = suitSymbols[card.suit];
    
    cardInner.appendChild(valueElement);
    cardInner.appendChild(suitElement);
    
    // Add small suit icon in top left
    const smallSuitElement = document.createElement('div');
    smallSuitElement.className = `card-suit-small ${card.suit}`;
    smallSuitElement.textContent = suitSymbols[card.suit];
    smallSuitElement.style.position = 'absolute';
    smallSuitElement.style.top = '10px';
    smallSuitElement.style.left = '10px';
    smallSuitElement.style.fontSize = '14px';
    
    cardInner.appendChild(smallSuitElement);
    
    // Remove hidden class if present
    cardElement.classList.remove('hidden');
}

// Make higher prediction
function makeHigherPrediction() {
    predictionMade = true;
    higherButton.disabled = true;
    lowerButton.disabled = true;
    
    // Reveal next card with animation
    setTimeout(() => {
        revealNextCard();
        
        // Check if prediction is correct
        const currentValue = cardValues[currentCard.value];
        const nextValue = cardValues[nextCard.value];
        
        if (nextValue > currentValue) {
            // Correct prediction
            winPrediction();
        } else {
            // Wrong prediction
            losePrediction();
        }
    }, 1000);
}

// Make lower prediction
function makeLowerPrediction() {
    predictionMade = true;
    higherButton.disabled = true;
    lowerButton.disabled = true;
    
    // Reveal next card with animation
    setTimeout(() => {
        revealNextCard();
        
        // Check if prediction is correct
        const currentValue = cardValues[currentCard.value];
        const nextValue = cardValues[nextCard.value];
        
        if (nextValue < currentValue) {
            // Correct prediction
            winPrediction();
        } else {
            // Wrong prediction
            losePrediction();
        }
    }, 1000);
}

// Reveal the next card
function revealNextCard() {
    // Play flip sound
    flipSound.play();
    
    // Add flip animation
    nextCardElement.classList.add('card-reveal');
    
    // Display the card
    setTimeout(() => {
        displayCard(nextCardElement, nextCard);
    }, 400); // Adjusted timing to match the animation keyframe midpoint
}

// Win prediction
function winPrediction() {
    // Update streak
    currentStreak++;
    currentStreakElement.textContent = currentStreak;
    
    if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
        bestStreakElement.textContent = bestStreak;
    }
    
    // Add win animation after card is revealed
    setTimeout(() => {
        nextCardElement.classList.add('card-win');
        
        // Show result message
        setTimeout(() => {
            predictionResultElement.textContent = 'Correct! You win!';
            predictionResultElement.className = 'prediction-result show result-win';
            winSound.play();
        }, 300);
        
        // Payout winnings
        setTimeout(() => {
            payoutWin();
            
            // Update stats
            gamesWon++;
            gamesWonElement.textContent = gamesWon;
            saveGameStats();
            
            // Show new game button
            newGameButton.style.display = 'block';
        }, 1000);
    }, 600);
    
    // Game is no longer in progress
    gameInProgress = false;
}

// Lose prediction
function losePrediction() {
    // Reset streak
    currentStreak = 0;
    currentStreakElement.textContent = currentStreak;
    
    // Add lose animation after card is revealed
    setTimeout(() => {
        nextCardElement.classList.add('card-lose');
        
        // Show result message
        setTimeout(() => {
            predictionResultElement.textContent = 'Wrong! You lose!';
            predictionResultElement.className = 'prediction-result show result-lose';
            loseSound.play();
        }, 300);
        
        // Update stats
        saveGameStats();
        
        // Show new game button
        setTimeout(() => {
            newGameButton.style.display = 'block';
        }, 1000);
    }, 600);
    
    // Game is no longer in progress
    gameInProgress = false;
}

// Payout for win (1:1)
function payoutWin() {
    const winAmount = currentBet * 2; // Return bet + win same amount
    const currentBalance = parseInt(document.querySelector('.balance-amount').textContent);
    document.querySelector('.balance-amount').textContent = currentBalance + winAmount;
    
    // Update total profit
    totalProfit += currentBet;
    totalProfitElement.textContent = totalProfit;
    
    // Animate chips
    animateWinningChips();
}

// Reset game for next round
function resetGame() {
    // Update game state
    gameInProgress = false;
    predictionMade = false;
    currentBet = 0;
    
    // Reset UI
    currentCardElement.innerHTML = '<div class="card-inner"><span class="card-value">?</span><span class="card-suit"></span></div>';
    nextCardElement.innerHTML = '<div class="card-inner"><span class="card-value">?</span><span class="card-suit"></span></div>';
    nextCardElement.classList.add('hidden');
    
    // Clear animation classes
    nextCardElement.classList.remove('card-reveal', 'card-win', 'card-lose');
    currentCardElement.classList.remove('card-reveal', 'card-win', 'card-lose');
    
    betAmountElement.textContent = '0';
    predictionResultElement.textContent = '';
    predictionResultElement.className = 'prediction-result';
    
    // Reset buttons
    newGameButton.style.display = 'none';
    startButton.disabled = false;
    higherButton.disabled = true;
    lowerButton.disabled = true;
    
    // Create a new deck if needed
    if (deck.length < 5) {
        createDeck();
    }
}

// Show a temporary message
function showMessage(message, type = 'info') {
    const messageElement = document.createElement('div');
    messageElement.className = `game-message ${type}`;
    messageElement.textContent = message;
    
    document.querySelector('.game-container').appendChild(messageElement);
    
    setTimeout(() => {
        messageElement.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        messageElement.classList.remove('show');
        setTimeout(() => {
            messageElement.remove();
        }, 500);
    }, 2000);
}

// Animate chip when selected
function animateChip(chipElement) {
    const rect = chipElement.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    // Create floating chip
    const floatingChip = document.createElement('div');
    floatingChip.className = 'chips-float ' + chipElement.className;
    floatingChip.textContent = chipElement.textContent;
    floatingChip.style.position = 'fixed';
    floatingChip.style.left = x + 'px';
    floatingChip.style.top = y + 'px';
    floatingChip.style.transform = 'translate(-50%, -50%)';
    
    document.body.appendChild(floatingChip);
    
    // Animate to bet amount
    const betRect = betAmountElement.getBoundingClientRect();
    const targetX = betRect.left + betRect.width / 2;
    const targetY = betRect.top + betRect.height / 2;
    
    floatingChip.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    setTimeout(() => {
        floatingChip.style.left = targetX + 'px';
        floatingChip.style.top = targetY + 'px';
        floatingChip.style.opacity = '0';
    }, 50);
    
    // Remove after animation
    setTimeout(() => {
        floatingChip.remove();
    }, 600);
}

// Animate winning chips
function animateWinningChips() {
    const betRect = betAmountElement.getBoundingClientRect();
    const balanceRect = document.querySelector('.balance-amount').getBoundingClientRect();
    
    // Create multiple chips
    for (let i = 0; i < 5; i++) {
        const floatingChip = document.createElement('div');
        floatingChip.className = 'chips-float chip';
        floatingChip.textContent = '💰';
        floatingChip.style.position = 'fixed';
        floatingChip.style.left = betRect.left + betRect.width / 2 + 'px';
        floatingChip.style.top = betRect.top + betRect.height / 2 + 'px';
        floatingChip.style.transform = 'translate(-50%, -50%)';
        
        document.body.appendChild(floatingChip);
        
        // Add small random offset for each chip
        const randomX = Math.random() * 40 - 20;
        const randomY = Math.random() * 40 - 20;
        const randomDelay = Math.random() * 300;
        
        // Animate to balance
        floatingChip.style.transition = `all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${randomDelay}ms`;
        setTimeout(() => {
            floatingChip.style.left = balanceRect.left + balanceRect.width / 2 + randomX + 'px';
            floatingChip.style.top = balanceRect.top + balanceRect.height / 2 + randomY + 'px';
            floatingChip.style.opacity = '0';
        }, 50);
        
        // Remove after animation
        setTimeout(() => {
            floatingChip.remove();
        }, 1000 + randomDelay);
    }
    
    // Pulse balance
    setTimeout(() => {
        document.querySelector('.balance').classList.add('pulse-once');
        setTimeout(() => {
            document.querySelector('.balance').classList.remove('pulse-once');
        }, 500);
    }, 600);
}

// Save game stats to local storage
function saveGameStats() {
    const stats = {
        gamesPlayed,
        gamesWon,
        bestStreak,
        totalProfit
    };
    
    localStorage.setItem('hiloStats', JSON.stringify(stats));
}

// Load game stats from local storage
function loadGameStats() {
    const statsJson = localStorage.getItem('hiloStats');
    
    if (statsJson) {
        const stats = JSON.parse(statsJson);
        
        gamesPlayed = stats.gamesPlayed || 0;
        gamesWon = stats.gamesWon || 0;
        bestStreak = stats.bestStreak || 0;
        totalProfit = stats.totalProfit || 0;
        
        gamesPlayedElement.textContent = gamesPlayed;
        gamesWonElement.textContent = gamesWon;
        bestStreakElement.textContent = bestStreak;
        totalProfitElement.textContent = totalProfit;
    }
} 