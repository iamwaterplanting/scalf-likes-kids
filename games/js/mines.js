// Mines Game UI Controller
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const minesContainer = document.getElementById('minesContainer');
    const minesSidebar = document.getElementById('minesSidebar');
    const betButton = document.getElementById('betButton');
    const cashoutBtn = document.getElementById('cashoutBtn');
    const minesGrid = document.getElementById('minesGrid');
    const gameOverPopup = document.getElementById('gameOverPopup');
    const winPopup = document.getElementById('winPopup');
    const newGameBtn = document.getElementById('newGameBtn');
    const newGameWinBtn = document.getElementById('newGameWinBtn');
    const gameOverMessage = document.getElementById('gameOverMessage');
    const winMessage = document.getElementById('winMessage');
    const winAmount = document.getElementById('winAmount');
    
    // Game elements
    const gamePlayingElements = document.querySelectorAll('.game-playing-content');
    const gameSetupElements = document.querySelectorAll('.game-setup-content');
    
    // Game state
    let gameStarted = false;
    let gameEnded = false;
    let minePositions = [];
    let revealedCells = [];
    
    // Debug mode - set to true for console logging
    const DEBUG = true;
    
    // Initialize UI
    initUI();
    
    function debug(message) {
        if (DEBUG) {
            console.log(`[MINES DEBUG] ${message}`);
        }
    }
    
    function initUI() {
        // Initialize game grid
        createMinesGrid();
        
        // Set up event listeners
        setupEventListeners();
        
        // Update selected mines button
        updateSelectedMinesButton();
        
        // Update stats from localStorage if available
        updateGameStats();
        
        debug("Game initialized");
    }
    
    function createMinesGrid() {
        // Clear existing grid
        minesGrid.innerHTML = '';
        
        // Create a 5x5 grid
        for (let i = 0; i < 25; i++) {
            const cell = document.createElement('div');
            cell.className = 'mine-cell';
            cell.dataset.index = i;
            
            // Add click event
            cell.addEventListener('click', () => {
                if (gameStarted && !gameEnded && !revealedCells.includes(i)) {
                    debug(`Clicked cell ${i}`);
                    revealCell(i);
                } else if (!gameStarted) {
                    // Animate the bet button to indicate user should start game
                    betButton.classList.add('pulse-animation');
                    setTimeout(() => {
                        betButton.classList.remove('pulse-animation');
                    }, 1000);
                } else if (gameEnded) {
                    // Do nothing if game has ended - popup is already showing
                }
            });
            
            minesGrid.appendChild(cell);
        }
        debug("Grid created with 25 cells");
    }
    
    function setupEventListeners() {
        // Bet button starts the game
        betButton.addEventListener('click', startGame);
        
        // Cashout button ends the game
        if (cashoutBtn) {
            cashoutBtn.addEventListener('click', () => endGame(true));
        }
        
        // New game buttons in popups
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                hidePopups();
                resetGame();
            });
        }
        
        if (newGameWinBtn) {
            newGameWinBtn.addEventListener('click', () => {
                hidePopups();
                resetGame();
            });
        }
        
        // Mine count selection
        const mineButtons = document.querySelectorAll('.mines-btn');
        mineButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                mineButtons.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Update mines count
                const minesCount = document.getElementById('minesCount');
                if (minesCount) {
                    minesCount.value = btn.dataset.mines;
                    debug(`Selected mines count: ${btn.dataset.mines}`);
                }
            });
        });
        
        // Bet amount shortcuts
        const betShortcuts = document.querySelectorAll('.bet-btn');
        betShortcuts.forEach(btn => {
            btn.addEventListener('click', () => {
                const betInput = document.getElementById('betAmount');
                const currentBalance = getCurrentBalance();
                
                if (btn.dataset.amount === '1/2') {
                    betInput.value = Math.floor(parseInt(betInput.value) / 2);
                } else if (btn.dataset.amount === '2x') {
                    betInput.value = Math.min(parseInt(betInput.value) * 2, currentBalance);
                } else if (btn.dataset.amount === 'max') {
                    betInput.value = currentBalance;
                }
            });
        });
        
        debug("Event listeners set up");
    }
    
    function startGame() {
        // Check if user is logged in
        if (!isUserLoggedIn()) {
            showMessage('Please login to play!');
            return;
        }
        
        // Get bet amount
        const betAmount = getBetAmount();
        if (!validateBet(betAmount)) {
            return;
        }
        
        // Hide any visible popups
        hidePopups();
        
        // Reset game state
        gameStarted = true;
        gameEnded = false;
        revealedCells = [];
        
        // Make sure mines count is correctly set from the UI
        const minesCount = parseInt(document.getElementById('minesCount').value) || 3;
        debug(`Starting game with ${minesCount} mines`);
        
        // Deduct bet from balance
        updateBalance(-betAmount);
        
        // Update UI
        minesContainer.classList.remove('game-not-started');
        minesContainer.classList.add('game-started');
        
        // Show game playing elements and hide setup elements
        gamePlayingElements.forEach(el => {
            el.style.display = 'flex';
        });
        
        gameSetupElements.forEach(el => {
            el.style.display = 'none';
        });
        
        // Update game stats display
        updateGameDisplay(betAmount);
        
        // Add a "started" class to the grid
        minesGrid.classList.add('game-active');
        
        // Generate mine positions
        generateMinePositions();
        
        // Log mine positions for debugging
        debug(`Game started with mine positions: ${minePositions.join(', ')}`);
    }
    
    function endGame(isWin = true) {
        if (gameEnded) return; // Prevent multiple calls
        
        // Set game ended flag
        gameEnded = true;
        
        // Handle game end based on win/loss
        if (isWin) {
            const currentWinAmount = calculateCurrentWin();
            
            if (currentWinAmount > 0) {
                // Add win amount to balance
                updateBalance(currentWinAmount);
                
                // Show win popup with the correct amount
                if (winAmount) {
                    winAmount.textContent = currentWinAmount.toFixed(2);
                }
                winPopup.classList.add('show');
                
                // Update game stats
                updateStats(true, currentWinAmount - getBetAmount());
                
                debug(`Game ended with win. Amount: ${currentWinAmount}`);
            } else {
                debug(`Game ended with no win amount. Something may be wrong.`);
            }
        } else {
            debug(`Game ended with loss.`);
        }
        
        // Reset game UI after a short delay
        setTimeout(() => {
            resetGame();
        }, 2000);
    }
    
    function resetGame() {
        // Reset game state
        gameStarted = false;
        gameEnded = false;
        revealedCells = [];
        minePositions = []; // Clear mine positions
        
        debug("Game reset, mine positions cleared");
        
        // Update UI
        minesContainer.classList.add('game-not-started');
        minesContainer.classList.remove('game-started');
        
        // Hide game playing elements and show setup elements
        gamePlayingElements.forEach(el => {
            el.style.display = 'none';
        });
        
        gameSetupElements.forEach(el => {
            el.style.display = 'flex';
        });
        
        // Make sure the bet button is visible
        if (betButton) {
            betButton.style.display = 'block';
        }
        
        // Remove "started" class from grid
        minesGrid.classList.remove('game-active');
        
        // Reset the grid
        createMinesGrid();
        
        // Update stats display
        updateGameStats();
    }
    
    function hidePopups() {
        // Hide any visible popups
        gameOverPopup.classList.remove('show');
        winPopup.classList.remove('show');
    }
    
    function revealCell(index) {
        // Add to revealed cells
        revealedCells.push(index);
        
        // Check if cell is a mine or gem
        const isMine = checkIfMine(index);
        debug(`Cell ${index} is mine: ${isMine}`);
        
        const cell = document.querySelector(`.mine-cell[data-index="${index}"]`);
        
        if (isMine) {
            // Game over - hit a mine
            cell.classList.add('revealed-mine');
            cell.innerHTML = '<i class="fas fa-bomb mine"></i>';
            
            // Play explosion sound
            playSound('explosion');
            
            // Show all mines
            revealAllMines();
            
            // Update stats (loss)
            updateStats(false, -getBetAmount());
            
            // End game with loss
            gameEnded = true;
            
            // Show game over popup briefly and auto-hide
            gameOverPopup.classList.add('show');
            
            // Auto-hide popup after 1 second
            setTimeout(() => {
                hidePopups();
                resetGame();
            }, 1000);
        } else {
            // Found a gem!
            cell.classList.add('revealed-gem');
            cell.innerHTML = '<i class="fas fa-gem gem"></i>';
            
            // Play gem sound
            playSound('gem');
            
            // Update game stats
            updateAfterGemFound();
        }
    }
    
    // Helper functions
    function getCurrentBalance() {
        const user = window.BetaAuth?.getCurrentUser();
        return user ? user.balance : 1000;
    }
    
    function isUserLoggedIn() {
        return window.BetaAuth?.getCurrentUser() !== null;
    }
    
    function getBetAmount() {
        const betInput = document.getElementById('betAmount');
        return parseInt(betInput.value) || 0;
    }
    
    function validateBet(amount) {
        const balance = getCurrentBalance();
        
        if (amount < 10) {
            showMessage('Minimum bet is 10 coins.');
            return false;
        }
        
        if (amount > 10000) {
            showMessage('Maximum bet is 10,000 coins.');
            return false;
        }
        
        if (amount > balance) {
            showMessage('Not enough coins in your balance.');
            return false;
        }
        
        return true;
    }
    
    function updateBalance(amount) {
        // Use BetaAuth to update balance
        if (window.BetaAuth) {
            debug(`Updating balance by ${amount} coins`);
            window.BetaAuth.updateBalance(amount, 'Mines Game');
            
            // Also update the UI display if available
            const balanceAmount = document.querySelector('.balance-amount');
            if (balanceAmount) {
                // Get current user
                const user = window.BetaAuth.getCurrentUser();
                if (user) {
                    balanceAmount.textContent = user.balance.toFixed(2);
                    debug(`Updated balance display to ${user.balance.toFixed(2)}`);
                }
            }
        } else {
            debug('BetaAuth not available, could not update balance');
        }
    }
    
    function updateGameDisplay(betAmount) {
        // Update bet amount display
        const betDisplay = document.getElementById('currentBet');
        if (betDisplay) {
            betDisplay.textContent = betAmount;
        }
        
        // Reset multipliers based on 0 revealed gems
        updateMultipliers();
    }
    
    function calculateCurrentWin() {
        // Calculate current win based on multiplier and bet amount
        const betAmount = getBetAmount();
        const minesCount = parseInt(document.getElementById('minesCount').value) || 3;
        const totalCells = 25;
        
        // Calculate revealed gems (excluding mines)
        const revealedGems = revealedCells.filter(cell => !minePositions.includes(cell)).length;
        
        // Get current multiplier
        const currentMultiplier = calculateMultiplier(revealedGems, minesCount, totalCells);
        
        return betAmount * currentMultiplier;
    }
    
    function updateGameStats() {
        // Update game stats from localStorage or default values
        const stats = getGameStats();
        
        const gamesPlayedElement = document.getElementById('gamesPlayed');
        const totalProfitElement = document.getElementById('totalProfit');
        const winRateElement = document.getElementById('winRate');
        
        if (gamesPlayedElement) {
            gamesPlayedElement.textContent = stats.gamesPlayed;
        }
        
        if (totalProfitElement) {
            totalProfitElement.textContent = stats.totalProfit;
        }
        
        if (winRateElement) {
            winRateElement.textContent = stats.gamesPlayed > 0 
                ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) + '%'
                : '0%';
        }
    }
    
    function updateStats(isWin, profit) {
        // Get current stats
        const stats = getGameStats();
        
        // Update stats
        stats.gamesPlayed++;
        if (isWin) {
            stats.gamesWon++;
        }
        stats.totalProfit += profit;
        
        // Save updated stats
        localStorage.setItem('minesGameStats', JSON.stringify(stats));
    }
    
    function getGameStats() {
        // Get game stats from localStorage or use defaults
        const defaultStats = {
            gamesPlayed: 0,
            gamesWon: 0,
            totalProfit: 0
        };
        
        try {
            const savedStats = localStorage.getItem('minesGameStats');
            return savedStats ? JSON.parse(savedStats) : defaultStats;
        } catch (e) {
            return defaultStats;
        }
    }
    
    function showMessage(message) {
        // For non-game-over messages, still use alert for now
        alert(message);
    }
    
    function playSound(soundType) {
        // Play sound effect (placeholder)
        debug(`Playing ${soundType} sound`);
    }
    
    function generateMinePositions() {
        // Generate random mine positions based on selected mines count
        const minesCountElement = document.getElementById('minesCount');
        let minesCount = parseInt(minesCountElement.value) || 3;
        
        // Force at least 1 mine and at most 24 mines
        minesCount = Math.max(1, Math.min(24, minesCount));
        
        // Log the selected mines count for debugging
        debug(`Generating ${minesCount} mines`);
        
        // Clear previous mine positions
        minePositions = [];
        
        // Use a direct approach to generate unique positions
        const allPositions = Array.from({ length: 25 }, (_, i) => i);
        
        // Shuffle the array using Fisher-Yates algorithm
        for (let i = allPositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
        }
        
        // Take the first N positions as mines
        minePositions = allPositions.slice(0, minesCount);
        
        debug(`Mine positions: ${minePositions.join(', ')}`);
        
        // Double-check that we have the correct number of mines
        if (minePositions.length !== minesCount) {
            debug(`ERROR: Generated ${minePositions.length} mines instead of ${minesCount}. Fixing...`);
            
            // Fix by adding or removing mines
            if (minePositions.length < minesCount) {
                // Add more mines from unused positions
                const unusedPositions = allPositions.filter(p => !minePositions.includes(p));
                while (minePositions.length < minesCount && unusedPositions.length > 0) {
                    const pos = unusedPositions.pop();
                    minePositions.push(pos);
                }
            } else {
                // Remove excess mines
                minePositions = minePositions.slice(0, minesCount);
            }
            
            debug(`Corrected mine positions: ${minePositions.join(', ')}`);
        }
    }
    
    function checkIfMine(index) {
        // Check if the index is in minePositions
        const numIndex = Number(index);
        const result = minePositions.includes(numIndex);
        debug(`Checking if ${index} is a mine: ${result} (mine positions: ${minePositions.join(', ')})`);
        return result;
    }
    
    function revealAllMines() {
        // Reveal all mines except the one that was clicked (already revealed)
        debug(`Revealing all mines: ${minePositions.join(', ')}`);
        
        minePositions.forEach(pos => {
            if (!revealedCells.includes(pos)) {
                const cell = document.querySelector(`.mine-cell[data-index="${pos}"]`);
                if (cell) {
                    cell.classList.add('revealed-mine');
                    cell.innerHTML = '<i class="fas fa-bomb mine"></i>';
                    debug(`Revealed mine at position ${pos}`);
                } else {
                    debug(`ERROR: Could not find cell for mine at position ${pos}`);
                }
            }
        });
    }
    
    function updateAfterGemFound() {
        // Update multipliers and potential payout
        updateMultipliers();
    }
    
    // Helper function to update multipliers based on revealed gems
    function updateMultipliers() {
        // Get current bet and mines count
        const betAmount = getBetAmount();
        const minesCount = parseInt(document.getElementById('minesCount').value) || 3;
        const totalCells = 25;
        const gemCount = totalCells - minesCount;
        
        // Calculate current revealed gems (excluding mines)
        const revealedGems = revealedCells.filter(cell => !minePositions.includes(cell)).length;
        
        debug(`Updating multipliers: ${revealedGems} gems revealed, ${minesCount} mines`);
        
        // Update multiplier displays
        const multiplierItems = document.querySelectorAll('.multiplier-item');
        
        // Current multiplier
        if (multiplierItems[0]) {
            const currentMultiplier = calculateMultiplier(revealedGems, minesCount, totalCells);
            multiplierItems[0].querySelector('span').textContent = `× ${currentMultiplier.toFixed(2)}`;
            
            // Set active class only on current multiplier
            multiplierItems.forEach(item => item.classList.remove('active'));
            multiplierItems[0].classList.add('active');
            
            debug(`Current multiplier: ${currentMultiplier.toFixed(2)}`);
        }
        
        // Next tile multiplier
        if (multiplierItems[1]) {
            const nextMultiplier = calculateMultiplier(revealedGems + 1, minesCount, totalCells);
            multiplierItems[1].querySelector('span').textContent = `× ${nextMultiplier.toFixed(2)}`;
        }
        
        // Tile 8 multiplier
        if (multiplierItems[2] && revealedGems < 8) {
            const tile8Multiplier = calculateMultiplier(8, minesCount, totalCells);
            multiplierItems[2].querySelector('span').textContent = `× ${tile8Multiplier.toFixed(2)}`;
        }
        
        // Tile 9 multiplier
        if (multiplierItems[3] && revealedGems < 9) {
            const tile9Multiplier = calculateMultiplier(9, minesCount, totalCells);
            multiplierItems[3].querySelector('span').textContent = `× ${tile9Multiplier.toFixed(2)}`;
        }
        
        // Update current payout based on current multiplier
        const currentPayoutDisplay = document.getElementById('currentPayout');
        if (currentPayoutDisplay) {
            const currentWin = betAmount * currentMultiplier;
            currentPayoutDisplay.textContent = currentWin.toFixed(2);
        }
        
        // Update next gem amount
        const nextGemDisplay = document.getElementById('nextGemAmount');
        if (nextGemDisplay) {
            const nextAmount = betAmount * calculateMultiplier(revealedGems + 1, minesCount, totalCells);
            nextGemDisplay.textContent = nextAmount.toFixed(2);
        }
    }
    
    // Calculate multiplier based on gems revealed and mines count
    function calculateMultiplier(revealedGems, minesCount, totalCells) {
        // Base multiplier calculation using house edge
        const houseEdge = 0.05; // 5% house edge
        const gemCount = totalCells - minesCount;
        
        if (revealedGems <= 0) return 1.0;
        
        // Formula: (totalCells / (totalCells - revealedGems)) * (1 - houseEdge) * minesDifficulty
        // Higher mine count = higher difficulty factor = higher multiplier
        let minesDifficulty = 1.0 + (minesCount / 10); // More mines = higher multiplier growth
        
        let multiplier = (totalCells / (totalCells - revealedGems)) * (1 - houseEdge) * minesDifficulty;
        
        // Cap multiplier for very high values
        multiplier = Math.min(multiplier, 250);
        
        return multiplier;
    }
    
    // Update the selected mines button based on the current value
    function updateSelectedMinesButton() {
        const minesCount = document.getElementById('minesCount').value || '3';
        debug(`Setting active button for mines count: ${minesCount}`);
        
        // Remove active class from all buttons
        const mineButtons = document.querySelectorAll('.mines-btn');
        let foundMatch = false;
        
        mineButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mines === minesCount) {
                btn.classList.add('active');
                foundMatch = true;
                debug(`Activated button for ${minesCount} mines`);
            }
        });
        
        // If no matching button was found, default to 3 mines
        if (!foundMatch) {
            const defaultButton = document.querySelector('.mines-btn[data-mines="3"]');
            if (defaultButton) {
                defaultButton.classList.add('active');
                const minesCountInput = document.getElementById('minesCount');
                if (minesCountInput) {
                    minesCountInput.value = '3';
                }
                debug(`No matching button found, defaulted to 3 mines`);
            }
        }
    }
}); 