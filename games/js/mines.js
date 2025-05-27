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
    
    // Debug mode - set to true temporarily to diagnose issues
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
            cell.className = 'mine-cell'; // Changed to match CSS class
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
        
        // Log directly to console for debugging
        console.log(`Starting game with ${minesCount} mines - this should match what's displayed in the UI`);
        
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
        
        // Add direct console logging of the mine positions
        console.log(`GAME STARTED with ${minePositions.length} mines at positions: ${minePositions.join(', ')}`);
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
        
        // Enable all buttons and form controls
        document.querySelectorAll('.mines-btn, #betAmount, #minesCount').forEach(el => {
            el.disabled = false;
        });
        
        // Make sure the bet button is visible and enabled
        if (betButton) {
            betButton.style.display = 'block';
            betButton.disabled = false;
        }
        
        // Remove "started" class from grid
        minesGrid.classList.remove('game-active');
        
        // Reset the grid
        createMinesGrid();
        
        // Update stats display
        updateGameStats();
        
        // Restore the mines count selection functionality
        updateSelectedMinesButton();
    }
    
    function hidePopups() {
        // Hide any visible popups
        gameOverPopup.classList.remove('show');
        winPopup.classList.remove('show');
    }
    
    function revealCell(index) {
        // Make sure index is a number
        const numIndex = parseInt(index);
        
        // Add to revealed cells
        revealedCells.push(numIndex);
        
        console.log(`REVEAL CELL: Clicked on cell ${numIndex}`);
        
        // Check if cell is a mine or gem
        const isMine = checkIfMine(numIndex);
        console.log(`REVEAL RESULT: Cell ${numIndex} is ${isMine ? 'a MINE!' : 'a gem'}`);
        
        const cell = document.querySelector(`.mine-cell[data-index="${numIndex}"]`);
        
        if (isMine) {
            // Game over - hit a mine
            cell.classList.add('revealed-mine');
            cell.innerHTML = '<i class="fas fa-bomb mine"></i>'; // Added "mine" class for animations
            
            console.log(`GAME OVER: Hit a mine at position ${numIndex}`);
            
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
            
            // Disable further clicks on the grid
            minesGrid.classList.add('game-ended');
            
            // Auto-hide popup after 1 second
            setTimeout(() => {
                hidePopups();
                resetGame();
            }, 1500);
        } else {
            // Found a gem!
            cell.classList.add('revealed-gem');
            cell.innerHTML = '<i class="fas fa-gem gem"></i>'; // Added "gem" class for animations
            
            console.log(`FOUND GEM: Revealed a gem at position ${numIndex}`);
            
            // Play gem sound
            playSound('gem');
            
            // Update game stats
            updateAfterGemFound();
            
            // Check if all non-mine cells have been revealed
            const totalCells = 25;
            const minesCount = minePositions.length;
            const gemCount = totalCells - minesCount;
            
            if (revealedCells.filter(cell => !checkIfMine(cell)).length >= gemCount) {
                // All gems found - auto win!
                endGame(true);
            }
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
        const revealedGems = revealedCells.filter(cell => !checkIfMine(cell)).length;
        
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
    
    function checkIfMine(index) {
        // Make sure index is a number
        const numIndex = parseInt(index);
        
        // Direct console logging to help diagnose the issue
        console.log(`CHECKING MINE: Cell ${index} (now ${numIndex}), mine positions: ${minePositions.join(', ')}`);
        
        // Fix: Simply use includes() to check if the index is in minePositions
        return minePositions.includes(numIndex);
    }
    
    function revealAllMines() {
        // Log for debugging
        console.log(`REVEALING ALL MINES: ${minePositions.join(', ')}`);
        
        // Reveal all mines except the one that was clicked (already revealed)
        minePositions.forEach(pos => {
            // Convert to number for consistent comparison
            const minePos = parseInt(pos);
            
            // Check if this mine has already been revealed
            const isRevealed = revealedCells.includes(minePos);
            
            // Only reveal mines that haven't been clicked yet
            if (!isRevealed) {
                const cell = document.querySelector(`.mine-cell[data-index="${minePos}"]`);
                if (cell) {
                    cell.classList.add('revealed-mine');
                    cell.innerHTML = '<i class="fas fa-bomb mine"></i>';
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
        const revealedGems = revealedCells.filter(cell => !checkIfMine(cell)).length;
        
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
        
        // Generate unique positions
        const allPositions = Array.from({ length: 25 }, (_, i) => i);
        
        // Shuffle the array using Fisher-Yates algorithm
        for (let i = allPositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
        }
        
        // Take the first N positions as mines (ensure they're numbers)
        minePositions = allPositions.slice(0, minesCount).map(Number);
        
        // Log mine positions for debugging
        console.log(`MINES DEBUG - Generated mine positions: ${minePositions.join(', ')}`);
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