// Fruit Slots Game

// Game elements
let reels = [];
let symbols = [];
let spinning = false;
let autoSpinActive = false;
let winAmount = 0;
let betAmount = 100;
let lineCount = 5;
let totalBet = betAmount * lineCount;
let spinResults = [];
let payTable = {
    '🍒': { 3: 3, 4: 6, 5: 15 },
    '🍊': { 3: 5, 4: 10, 5: 25 },
    '🍋': { 3: 8, 4: 16, 5: 40 },
    '🍉': { 3: 10, 4: 20, 5: 50 },
    '🍇': { 3: 15, 4: 30, 5: 75 },
    '🍓': { 3: 20, 4: 40, 5: 100 },
    '🍍': { 3: 25, 4: 50, 5: 125 },
    '🥝': { 3: 50, 4: 100, 5: 250 },
    '🍎': { 3: 75, 4: 150, 5: 375 },
    '7️⃣': { 3: 100, 4: 200, 5: 500 }
};

// All available symbols
const allSymbols = ['🍒', '🍊', '🍋', '🍉', '🍇', '🍓', '🍍', '🥝', '🍎', '7️⃣'];

// Symbol weights (probability distribution)
const symbolWeights = {
    '🍒': 20,  // Highest chance
    '🍊': 18,
    '🍋': 15,
    '🍉': 12,
    '🍇': 10,
    '🍓': 8,
    '🍍': 7,
    '🥝': 5,
    '🍎': 3,
    '7️⃣': 2   // Lowest chance (jackpot symbol)
};

// Paylines (patterns for winning)
const paylines = [
    [1, 1, 1, 1, 1], // Middle row
    [0, 0, 0, 0, 0], // Top row
    [2, 2, 2, 2, 2], // Bottom row
    [0, 1, 2, 1, 0], // V shape
    [2, 1, 0, 1, 2], // Inverted V shape
    [0, 0, 1, 2, 2], // Top left to bottom right
    [2, 2, 1, 0, 0], // Bottom left to top right
    [1, 0, 1, 0, 1], // Zigzag top
    [1, 2, 1, 2, 1]  // Zigzag bottom
];

// DOM elements
const reelElements = [];
const reelWrappers = [];
let winAmountDisplay;
let betAmountDisplay;
let lineCountDisplay;
let totalBetDisplay;
let spinButton;
let winLine;
let winAnimation;
let winText;

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    createReelSymbols();
    setupEventListeners();
});

// Initialize game elements
function initializeGame() {
    // Get DOM elements
    winAmountDisplay = document.getElementById('winAmount');
    betAmountDisplay = document.getElementById('betAmount');
    lineCountDisplay = document.getElementById('lineCount');
    totalBetDisplay = document.getElementById('totalBet');
    spinButton = document.getElementById('spinButton');
    winLine = document.getElementById('winLine');
    winAnimation = document.getElementById('winAnimation');
    winText = document.getElementById('winText');
    
    // Initialize reels
    for (let i = 1; i <= 5; i++) {
        reelElements[i-1] = document.getElementById('reel' + i);
        reelWrappers[i-1] = document.getElementById('reelWrapper' + i);
        reels.push([]);
    }
    
    updateBetDisplay();
}

// Create symbols for the reels
function createReelSymbols() {
    // Create a weighted array of symbols
    let weightedSymbols = [];
    for (const symbol in symbolWeights) {
        for (let i = 0; i < symbolWeights[symbol]; i++) {
            weightedSymbols.push(symbol);
        }
    }
    
    // Generate random symbols for each reel
    for (let i = 0; i < reels.length; i++) {
        let reelSymbols = [];
        
        // Generate 20 random symbols for each reel (more than what's visible)
        for (let j = 0; j < 20; j++) {
            const randomIndex = Math.floor(Math.random() * weightedSymbols.length);
            reelSymbols.push(weightedSymbols[randomIndex]);
        }
        
        // Set the symbols for this reel
        symbols[i] = reelSymbols;
        
        // Create DOM elements for each symbol
        for (let j = 0; j < reelSymbols.length; j++) {
            const symbolElement = document.createElement('div');
            symbolElement.className = 'symbol';
            symbolElement.style.top = (j * 120) + 'px';
            symbolElement.textContent = reelSymbols[j];
            reelWrappers[i].appendChild(symbolElement);
        }
    }
}

// Set up event listeners
function setupEventListeners() {
    // Spin button
    document.getElementById('spinButton').addEventListener('click', () => {
        if (!spinning) {
            spin();
        }
    });
    
    // Auto spin toggle
    document.getElementById('autoSpinToggle').addEventListener('change', (e) => {
        autoSpinActive = e.target.checked;
        if (autoSpinActive && !spinning) {
            spin();
        }
    });
    
    // Bet amount controls
    document.getElementById('decreaseBet').addEventListener('click', () => {
        if (betAmount > 10 && !spinning) {
            betAmount -= 10;
            updateBetDisplay();
        }
    });
    
    document.getElementById('increaseBet').addEventListener('click', () => {
        if (betAmount < 1000 && !spinning) {
            betAmount += 10;
            updateBetDisplay();
        }
    });
    
    // Line count controls
    document.getElementById('decreaseLines').addEventListener('click', () => {
        if (lineCount > 1 && !spinning) {
            lineCount -= 1;
            updateBetDisplay();
        }
    });
    
    document.getElementById('increaseLines').addEventListener('click', () => {
        if (lineCount < paylines.length && !spinning) {
            lineCount += 1;
            updateBetDisplay();
        }
    });
}

// Update bet displays
function updateBetDisplay() {
    betAmountDisplay.textContent = betAmount;
    lineCountDisplay.textContent = lineCount;
    totalBet = betAmount * lineCount;
    totalBetDisplay.textContent = totalBet;
}

// Update balance display
function updateBalanceDisplay() {
    // Get balance element from the DOM
    const balanceElement = document.querySelector('.balance-amount');
    if (balanceElement) {
        // Make sure we don't display NaN
        balanceElement.textContent = isNaN(parseInt(balanceElement.textContent)) ? 0 : balanceElement.textContent;
    }
}

// Spin the reels
async function spin() {
    // Get current balance from DOM
    const balanceElement = document.querySelector('.balance-amount');
    if (!balanceElement) {
        console.error('Balance element not found');
        return;
    }
    
    const currentBalance = parseInt(balanceElement.textContent);
    
    // Check if we have enough balance
    if (currentBalance < totalBet) {
        alert('Not enough balance to place this bet!');
        return;
    }
    
    // Deduct the bet amount from balance using the auth.js updateBalance function
    if (window.updateBalance) {
        const success = await window.updateBalance(-totalBet, 'slots-bet');
        if (!success) {
            alert('Failed to place bet. Please try again.');
            return;
        }
    } else {
        // Fallback if updateBalance function is not available
        balanceElement.textContent = currentBalance - totalBet;
    }
    
    // Reset previous wins
    winAmount = 0;
    winAmountDisplay.textContent = winAmount;
    winLine.classList.remove('active');
    
    // Set spinning state
    spinning = true;
    spinButton.disabled = true;
    
    // Generate new random positions for each reel
    spinResults = [];
    const reelPromises = [];
    
    // Stagger the reel spins
    for (let i = 0; i < reels.length; i++) {
        const promise = new Promise(resolve => {
            setTimeout(() => {
                spinReel(i, resolve);
            }, i * 400); // Stagger by 400ms per reel
        });
        reelPromises.push(promise);
    }
    
    // When all reels have stopped
    Promise.all(reelPromises).then(async () => {
        spinning = false;
        spinButton.disabled = false;
        
        // Check for wins
        checkWins();
        
        // Continue auto spin if active
        if (autoSpinActive) {
            setTimeout(() => {
                const updatedBalance = parseInt(document.querySelector('.balance-amount').textContent);
                if (updatedBalance >= totalBet) {
                    spin();
                } else {
                    // Disable auto spin if not enough balance
                    document.getElementById('autoSpinToggle').checked = false;
                    autoSpinActive = false;
                }
            }, 2000);
        }
    });
}

// Spin a single reel
function spinReel(reelIndex, callback) {
    // Create a random result for this reel (3 visible symbols)
    const reelResult = [];
    for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * allSymbols.length);
        const symbolWithWeight = getRandomWeightedSymbol();
        reelResult.push(symbolWithWeight);
    }
    spinResults.push(reelResult);
    
    // Save the original symbols in case we need to restore them
    const originalSymbols = Array.from(reelWrappers[reelIndex].children);
    const originalSymbolTexts = originalSymbols.map(s => s.textContent);
    
    // Determine the random stop position
    const stopPosition = -((Math.floor(Math.random() * 10) + 10) * 120);
    
    // Update the reel wrapper with new random symbols
    reelWrappers[reelIndex].innerHTML = '';
    
    // Add symbols before the visible ones (for animation)
    for (let i = 0; i < 10; i++) {
        const symbolElement = document.createElement('div');
        symbolElement.className = 'symbol';
        symbolElement.style.top = ((i - 10) * 120) + 'px';
        symbolElement.textContent = getRandomWeightedSymbol();
        reelWrappers[reelIndex].appendChild(symbolElement);
    }
    
    // Add the actual result symbols
    for (let i = 0; i < reelResult.length; i++) {
        const symbolElement = document.createElement('div');
        symbolElement.className = 'symbol';
        symbolElement.style.top = (i * 120) + 'px';
        symbolElement.textContent = reelResult[i];
        reelWrappers[reelIndex].appendChild(symbolElement);
    }
    
    // Add symbols after the visible ones (for animation)
    for (let i = 0; i < 10; i++) {
        const symbolElement = document.createElement('div');
        symbolElement.className = 'symbol';
        symbolElement.style.top = ((i + reelResult.length) * 120) + 'px';
        symbolElement.textContent = getRandomWeightedSymbol();
        reelWrappers[reelIndex].appendChild(symbolElement);
    }
    
    // Animate the spin
    reelWrappers[reelIndex].style.transition = 'none';
    reelWrappers[reelIndex].style.transform = 'translateY(0)';
    
    // Force reflow
    void reelWrappers[reelIndex].offsetHeight;
    
    // Start the spinning animation
    reelWrappers[reelIndex].style.transition = 'transform 3s cubic-bezier(0.17, 0.84, 0.44, 1)';
    reelWrappers[reelIndex].style.transform = `translateY(${stopPosition}px)`;
    
    // Wait for animation to complete
    setTimeout(() => {
        try {
            // Position the reel at the final position with the result symbols
            reelWrappers[reelIndex].style.transition = 'none';
            reelWrappers[reelIndex].style.transform = 'translateY(-1200px)';
            
            // Clear and re-add only the result symbols
            reelWrappers[reelIndex].innerHTML = '';
            
            // Add the result symbols with proper positioning
            for (let i = 0; i < reelResult.length; i++) {
                const symbolElement = document.createElement('div');
                symbolElement.className = 'symbol';
                symbolElement.style.top = (i * 120) + 'px';
                symbolElement.textContent = reelResult[i];
                reelWrappers[reelIndex].appendChild(symbolElement);
            }
            
            // Error handling - if symbols disappeared, restore them
            if (reelWrappers[reelIndex].children.length === 0) {
                console.error('Symbols disappeared, restoring...');
                for (let i = 0; i < Math.min(reelResult.length, 3); i++) {
                    const symbolElement = document.createElement('div');
                    symbolElement.className = 'symbol';
                    symbolElement.style.top = (i * 120) + 'px';
                    symbolElement.textContent = reelResult[i] || getRandomWeightedSymbol();
                    reelWrappers[reelIndex].appendChild(symbolElement);
                }
            }
        } catch (error) {
            console.error('Error in spinReel:', error);
            // If there's an error, ensure we have symbols
            for (let i = 0; i < 3; i++) {
                const symbolElement = document.createElement('div');
                symbolElement.className = 'symbol';
                symbolElement.style.top = (i * 120) + 'px';
                symbolElement.textContent = getRandomWeightedSymbol();
                reelWrappers[reelIndex].appendChild(symbolElement);
            }
        }
        
        // Animation complete callback
        callback();
    }, 3000);
}

// Helper function to get a random symbol based on weights
function getRandomWeightedSymbol() {
    // Create a weighted array of symbols
    let weightedSymbols = [];
    for (const symbol in symbolWeights) {
        for (let i = 0; i < symbolWeights[symbol]; i++) {
            weightedSymbols.push(symbol);
        }
    }
    
    const randomIndex = Math.floor(Math.random() * weightedSymbols.length);
    return weightedSymbols[randomIndex];
}

// Check for winning combinations
async function checkWins() {
    let totalWin = 0;
    let winLines = [];
    
    // Check each active payline
    for (let i = 0; i < lineCount; i++) {
        const payline = paylines[i];
        
        // Get symbols on this payline
        const lineSymbols = [];
        for (let j = 0; j < spinResults.length; j++) {
            lineSymbols.push(spinResults[j][payline[j]]);
        }
        
        // Count consecutive symbols from left to right
        let currentSymbol = lineSymbols[0];
        let count = 1;
        
        for (let j = 1; j < lineSymbols.length; j++) {
            if (lineSymbols[j] === currentSymbol) {
                count++;
            } else {
                break;
            }
        }
        
        // Check for wins (need at least 3 matching)
        if (count >= 3 && payTable[currentSymbol] && payTable[currentSymbol][count]) {
            const multiplier = payTable[currentSymbol][count];
            const win = betAmount * multiplier;
            totalWin += win;
            winLines.push({
                paylineIndex: i,
                count: count,
                symbol: currentSymbol,
                win: win
            });
        }
    }
    
    // Update win amount display
    winAmount = totalWin;
    winAmountDisplay.textContent = winAmount;
    
    // Add winnings to balance
    if (winAmount > 0) {
        // Use auth.js updateBalance function to add winnings
        if (window.updateBalance) {
            await window.updateBalance(winAmount, 'slots-win');
        } else {
            // Fallback if updateBalance function is not available
            const balanceElement = document.querySelector('.balance-amount');
            if (balanceElement) {
                const currentBalance = parseInt(balanceElement.textContent);
                balanceElement.textContent = currentBalance + winAmount;
            }
        }
        
        // Show win animations
        showWinAnimation(winAmount);
        
        // Highlight win line
        winLine.classList.add('active');
    }
    
    // Record game in history
    addGameToHistory(totalWin > 0);
}

// Show win animation
function showWinAnimation(amount) {
    winAnimation.classList.add('active');
    
    // Determine the win text based on amount
    let winMessage = '';
    if (amount >= totalBet * 20) {
        winMessage = 'MEGA WIN!';
    } else if (amount >= totalBet * 10) {
        winMessage = 'SUPER WIN!';
    } else if (amount >= totalBet * 5) {
        winMessage = 'BIG WIN!';
    } else {
        winMessage = 'YOU WIN!';
    }
    
    winText.textContent = winMessage + ' ' + amount;
    winText.classList.add('active');
    
    // Create falling coins
    for (let i = 0; i < Math.min(amount / 100, 20); i++) {
        createCoin();
    }
    
    // Reset animations after delay
    setTimeout(() => {
        winAnimation.classList.remove('active');
        winText.classList.remove('active');
        winAnimation.innerHTML = '<div class="win-text" id="winText">BIG WIN!</div>';
        winText = document.getElementById('winText');
    }, 3000);
}

// Create a falling coin animation
function createCoin() {
    const coin = document.createElement('div');
    coin.className = 'coin';
    coin.style.left = Math.random() * 100 + '%';
    coin.style.animationDelay = (Math.random() * 1.5) + 's';
    winAnimation.appendChild(coin);
    
    // Remove the coin after animation
    setTimeout(() => {
        if (winAnimation.contains(coin)) {
            winAnimation.removeChild(coin);
        }
    }, 3500);
}

// Add game to history
function addGameToHistory(isWin) {
    // Get current time
    const now = new Date();
    const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                      now.getMinutes().toString().padStart(2, '0');
    
    // Get username
    let username = 'Guest';
    const usernameElement = document.getElementById('username');
    if (usernameElement && usernameElement.textContent) {
        username = usernameElement.textContent;
    }
    
    // Calculate multiplier
    const multiplier = winAmount > 0 ? (winAmount / totalBet).toFixed(2) + 'x' : '0x';
    
    // Create table row
    const historyBody = document.getElementById('gameHistoryBody');
    if (historyBody) {
        const row = document.createElement('tr');
        
        // Add cells
        row.innerHTML = `
            <td>${username}</td>
            <td>${betAmount}</td>
            <td>${lineCount}</td>
            <td class="${isWin ? 'win-amount' : 'lose-amount'}">${isWin ? '+' + winAmount : '-' + totalBet}</td>
            <td>${multiplier}</td>
            <td>${timeString}</td>
        `;
        
        // Add to table
        if (historyBody.firstChild) {
            historyBody.insertBefore(row, historyBody.firstChild);
        } else {
            historyBody.appendChild(row);
        }
        
        // Limit history to 10 rows
        while (historyBody.children.length > 10) {
            historyBody.removeChild(historyBody.lastChild);
        }
    }
    
    // Add to global activity if function exists
    if (typeof addToRecentActivity === 'function') {
        try {
            addToRecentActivity({
                username: username,
                game: 'Slots',
                bet: totalBet,
                outcome: isWin ? '+' + winAmount : '-' + totalBet,
                timestamp: now
            });
        } catch (e) {
            console.error('Failed to add to recent activity:', e);
        }
    }
} 