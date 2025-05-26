// Mines Game UI Controller
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const minesContainer = document.getElementById('minesContainer');
    const minesSidebar = document.getElementById('minesSidebar');
    const betButton = document.getElementById('betButton');
    const cashoutBtn = document.getElementById('cashoutBtn');
    const minesGrid = document.getElementById('minesGrid');
    
    // Game elements
    const gamePlayingElements = document.querySelectorAll('.game-playing-content');
    const gameSetupElements = document.querySelectorAll('.game-setup-content');
    
    // Game state
    let gameStarted = false;
    let gameEnded = false;
    let minePositions = [];
    let revealedCells = [];
    
    // Initialize UI
    initUI();
    
    function initUI() {
        // Initialize game grid
        createMinesGrid();
        
        // Set up event listeners
        setupEventListeners();
        
        // Update stats from localStorage if available
        updateGameStats();
    }
    
    function createMinesGrid() {
        // Clear existing grid
        minesGrid.innerHTML = '';
        
        // Create a 5x5 grid
        for (let i = 0; i < 25; i++) {
            const cell = document.createElement('div');
            cell.className = 'mines-grid-cell';
            cell.dataset.index = i;
            
            // Add click event
            cell.addEventListener('click', () => {
                if (gameStarted && !gameEnded && !revealedCells.includes(i)) {
                    revealCell(i);
                } else if (!gameStarted) {
                    // Animate the bet button to indicate user should start game
                    betButton.classList.add('pulse-animation');
                    setTimeout(() => {
                        betButton.classList.remove('pulse-animation');
                    }, 1000);
                } else if (gameEnded) {
                    // Show message when clicking after game ended
                    showMessage('Game has ended. Start a new game to play again!');
                }
            });
            
            minesGrid.appendChild(cell);
        }
    }
    
    function setupEventListeners() {
        // Bet button starts the game
        betButton.addEventListener('click', startGame);
        
        // Cashout button ends the game
        if (cashoutBtn) {
            cashoutBtn.addEventListener('click', endGame);
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
        
        // Reset game state
        gameStarted = true;
        gameEnded = false;
        revealedCells = [];
        
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
    }
    
    function endGame(isWin = true) {
        // Handle game end (cashout)
        if (isWin) {
            const currentWinAmount = calculateCurrentWin();
            
            if (currentWinAmount > 0) {
                // Add win amount to balance
                updateBalance(currentWinAmount);
                
                // Show win message
                showMessage(`You won ${currentWinAmount} coins!`);
                
                // Update game stats
                updateStats(true, currentWinAmount - getBetAmount());
            }
        }
        
        // Set game ended flag
        gameEnded = true;
        
        // Reset game state after delay
        setTimeout(() => {
            resetGame();
        }, 1000);
    }
    
    function resetGame() {
        // Reset game state
        gameStarted = false;
        gameEnded = false;
        revealedCells = [];
        
        // Update UI
        minesContainer.classList.add('game-not-started');
        minesContainer.classList.remove('game-started');
        
        // Hide game playing elements and show setup elements
        gamePlayingElements.forEach(el => {
            el.style.display = 'none';
        });
        
        gameSetupElements.forEach(el => {
            el.style.display = 'block';
        });
        
        // Remove "started" class from grid
        minesGrid.classList.remove('game-active');
        
        // Reset the grid
        createMinesGrid();
        
        // Update stats display
        updateGameStats();
    }
    
    function revealCell(index) {
        // Add to revealed cells
        revealedCells.push(index);
        
        // Check if cell is a mine or gem
        const isMine = checkIfMine(index);
        
        const cell = document.querySelector(`.mines-grid-cell[data-index="${index}"]`);
        
        if (isMine) {
            // Game over - hit a mine
            cell.classList.add('revealed-mine');
            cell.innerHTML = '<i class="fas fa-bomb"></i>';
            
            // Play explosion sound
            playSound('explosion');
            
            // Show all mines
            revealAllMines();
            
            // Update stats (loss)
            updateStats(false, -getBetAmount());
            
            // End game with loss
            gameEnded = true;
            
            setTimeout(() => {
                showMessage('Game Over! You hit a mine!');
                resetGame();
            }, 1500);
        } else {
            // Found a gem!
            cell.classList.add('revealed-gem');
            cell.innerHTML = '<i class="fas fa-gem"></i>';
            
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
            window.BetaAuth.updateBalance(amount, 'Mines Game');
        }
    }
    
    function updateGameDisplay(betAmount) {
        // Update bet amount display
        const betDisplay = document.getElementById('currentBet');
        if (betDisplay) {
            betDisplay.textContent = betAmount;
        }
        
        // Reset next gem and current payout displays
        const nextGemDisplay = document.getElementById('nextGemAmount');
        if (nextGemDisplay) {
            const nextAmount = calculateNextPayout(betAmount);
            nextGemDisplay.textContent = nextAmount.toFixed(2);
        }
        
        const currentPayoutDisplay = document.getElementById('currentPayout');
        if (currentPayoutDisplay) {
            currentPayoutDisplay.textContent = '0.00';
        }
    }
    
    function calculateNextPayout(betAmount) {
        // Simple calculation - can be made more sophisticated
        return betAmount * 1.2;
    }
    
    function calculateCurrentWin() {
        // Simple calculation for demo purposes
        return getBetAmount() * 1.5; // 50% profit for demo
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
        // Simple alert for now, can be replaced with custom modal
        alert(message);
    }
    
    function playSound(soundType) {
        // Play sound effect (placeholder)
        console.log(`Playing ${soundType} sound`);
    }
    
    function generateMinePositions() {
        // Generate random mine positions based on selected mines count
        const minesCount = parseInt(document.getElementById('minesCount').value) || 3;
        minePositions = [];
        
        while (minePositions.length < minesCount) {
            const pos = Math.floor(Math.random() * 25);
            if (!minePositions.includes(pos)) {
                minePositions.push(pos);
            }
        }
        
        console.log('Mine positions:', minePositions);
    }
    
    function checkIfMine(index) {
        // Check if the index is in minePositions
        return minePositions.includes(index);
    }
    
    function revealAllMines() {
        // Reveal all mines except the one that was clicked (already revealed)
        minePositions.forEach(pos => {
            if (!revealedCells.includes(pos)) {
                const cell = document.querySelector(`.mines-grid-cell[data-index="${pos}"]`);
                if (cell) {
                    cell.classList.add('revealed-mine');
                    cell.innerHTML = '<i class="fas fa-bomb"></i>';
                }
            }
        });
    }
    
    function updateAfterGemFound() {
        // Update multipliers and potential payout
        const currentPayoutDisplay = document.getElementById('currentPayout');
        if (currentPayoutDisplay) {
            const currentWin = calculateCurrentWin();
            currentPayoutDisplay.textContent = currentWin.toFixed(2);
        }
    }
}); 