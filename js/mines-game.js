// BetaGames Mines Game
document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const minesGrid = document.getElementById('minesGrid');
    const betAmount = document.getElementById('betAmount');
    const minesCount = document.getElementById('minesCount');
    const betButton = document.getElementById('betButton');
    const cashoutBtn = document.getElementById('cashoutBtn');
    const nextGemAmount = document.getElementById('nextGemAmount');
    const totalProfit = document.getElementById('totalProfit');
    const manualBtns = document.querySelectorAll('.manual-btn');
    
    // Game state
    let gameState = {
        isPlaying: false,
        currentBet: 50,
        mines: [],
        revealedCells: [],
        minePositions: [],
        totalCells: 25,
        nextPayout: 0,
        currentProfit: 0
    };
    
    // Initialize game
    initGame();
    
    function initGame() {
        // Set default values
        betAmount.value = gameState.currentBet;
        
        // Clear existing grid
        while (minesGrid.firstChild) {
            minesGrid.removeChild(minesGrid.firstChild);
        }
        
        // Create grid cells
        for (let i = 0; i < gameState.totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'mine-cell';
            cell.dataset.index = i;
            
            // Add click event for revealing cells
            cell.addEventListener('click', () => {
                if (!gameState.isPlaying) return;
                
                // Don't allow clicking already revealed cells
                if (gameState.revealedCells.includes(i)) return;
                
                revealCell(i);
            });
            
            minesGrid.appendChild(cell);
        }
        
        // Event listeners
        betButton.addEventListener('click', startGame);
        cashoutBtn.addEventListener('click', cashout);
        
        // Bet amount shortcuts
        manualBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.amount;
                const currentUser = window.BetaAuth?.getCurrentUser();
                const userBalance = currentUser ? currentUser.balance : 1000;
                
                if (action === '1/2') {
                    betAmount.value = Math.max(10, Math.floor(parseInt(betAmount.value) / 2));
                } else if (action === '2x') {
                    const newAmount = parseInt(betAmount.value) * 2;
                    betAmount.value = Math.min(userBalance, newAmount);
                } else if (action === 'max') {
                    betAmount.value = userBalance;
                }
            });
        });
        
        // Update the bet amount when input changes
        betAmount.addEventListener('change', () => {
            const amount = parseInt(betAmount.value);
            const currentUser = window.BetaAuth?.getCurrentUser();
            const userBalance = currentUser ? currentUser.balance : 1000;
            
            if (isNaN(amount) || amount < 10) {
                betAmount.value = 10;
            } else if (amount > userBalance) {
                betAmount.value = userBalance;
            }
        });
        
        // Update display
        updateDisplay();
    }
    
    // Start a new game
    function startGame() {
        // Get current values
        const bet = parseInt(betAmount.value);
        const mines = parseInt(minesCount.value);
        
        // Validate bet
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (!currentUser) {
            alert('Please log in to play');
            return;
        }
        
        if (currentUser.balance < bet) {
            alert('Insufficient balance');
            return;
        }
        
        // Update game state
        gameState = {
            isPlaying: true,
            currentBet: bet,
            mines: mines,
            revealedCells: [],
            minePositions: generateMinePositions(mines),
            totalCells: 25,
            nextPayout: calculateNextPayout(bet, mines, 0),
            currentProfit: 0
        };
        
        // Update UI
        betButton.style.display = 'none';
        cashoutBtn.style.display = 'block';
        betAmount.disabled = true;
        minesCount.disabled = true;
        
        // Reset grid appearance
        const cells = minesGrid.querySelectorAll('.mine-cell');
        cells.forEach(cell => {
            cell.className = 'mine-cell';
            while (cell.firstChild) {
                cell.removeChild(cell.firstChild);
            }
        });
        
        // Deduct bet amount from balance
        window.BetaAuth.updateBalance(-gameState.currentBet, 'mines_bet');
        
        // Update displays
        updateDisplay();
    }
    
    // Generate random mine positions
    function generateMinePositions(count) {
        const positions = new Set();
        while (positions.size < count) {
            positions.add(Math.floor(Math.random() * gameState.totalCells));
        }
        return Array.from(positions);
    }
    
    // Calculate next gem payout based on current game state
    function calculateNextPayout(bet, mineCount, revealedCount) {
        const totalCells = gameState.totalCells;
        const safeCells = totalCells - mineCount;
        const remainingSafeCells = safeCells - revealedCount;
        
        if (remainingSafeCells <= 0) return 0;
        
        // Calculate multiplier based on probability
        // House edge: 5%
        const fairMultiplier = totalCells / remainingSafeCells;
        const multiplier = fairMultiplier * 0.95; // Apply 5% house edge
        
        return Math.floor(bet * multiplier);
    }
    
    // Reveal a cell
    function revealCell(index) {
        if (!gameState.isPlaying || gameState.revealedCells.includes(index)) return;
        
        const cell = minesGrid.children[index];
        const isMine = gameState.minePositions.includes(parseInt(index));
        
        // Add to revealed cells
        gameState.revealedCells.push(parseInt(index));
        
        if (isMine) {
            // Hit a mine - game over
            cell.classList.add('revealed-mine');
            
            // Create mine element
            const mine = document.createElement('div');
            mine.className = 'mine';
            cell.appendChild(mine);
            
            // Show all mines
            revealAllMines();
            
            // Game over
            gameOver(false);
        } else {
            // Found a gem
            cell.classList.add('revealed-gem');
            
            // Create gem element
            const gem = document.createElement('div');
            gem.className = 'gem';
            cell.appendChild(gem);
            
            // Update current profit
            gameState.currentProfit = gameState.nextPayout - gameState.currentBet;
            
            // Calculate next payout
            gameState.nextPayout = calculateNextPayout(
                gameState.currentBet, 
                gameState.mines, 
                gameState.revealedCells.length
            );
            
            // Update display
            updateDisplay();
            
            // Check if all safe cells revealed
            const totalSafeCells = gameState.totalCells - gameState.mines;
            if (gameState.revealedCells.length >= totalSafeCells) {
                // All safe cells revealed - auto cashout
                cashout();
            }
        }
    }
    
    // Reveal all mines
    function revealAllMines() {
        gameState.minePositions.forEach(minePos => {
            if (!gameState.revealedCells.includes(minePos)) {
                const mineCell = minesGrid.children[minePos];
                mineCell.classList.add('revealed-mine');
                
                // Create mine element
                const mine = document.createElement('div');
                mine.className = 'mine';
                mineCell.appendChild(mine);
            }
        });
    }
    
    // Update game display
    function updateDisplay() {
        // Update next payout
        nextGemAmount.textContent = gameState.nextPayout.toFixed(2);
        
        // Update total profit
        totalProfit.textContent = gameState.currentProfit.toFixed(2);
        if (gameState.currentProfit > 0) {
            totalProfit.style.color = '#00cc00';
        } else if (gameState.currentProfit < 0) {
            totalProfit.style.color = '#ff3333';
        } else {
            totalProfit.style.color = 'white';
        }
    }
    
    // Cashout function
    function cashout() {
        if (!gameState.isPlaying) return;
        
        // Calculate final payout (current next payout - 1)
        const finalPayout = gameState.nextPayout;
        
        // Add winnings to balance
        window.BetaAuth.updateBalance(finalPayout, 'mines_win');
        
        // Record game in history
        recordGame(true, finalPayout);
        
        // Reset game state
        gameEnded();
    }
    
    // Game over
    function gameOver(success) {
        if (!gameState.isPlaying) return;
        
        if (!success) {
            // Record loss in history
            recordGame(false, 0);
        }
        
        // Reset game state
        gameEnded();
    }
    
    // Common end-game functions
    function gameEnded() {
        gameState.isPlaying = false;
        
        // Update UI
        betButton.style.display = 'block';
        cashoutBtn.style.display = 'none';
        betAmount.disabled = false;
        minesCount.disabled = false;
        
        // Delay before allowing new game
        setTimeout(() => {
            // Reset profit display after delay
            gameState.currentProfit = 0;
            gameState.nextPayout = 0;
            updateDisplay();
        }, 3000);
    }
    
    // Record game in history
    async function recordGame(won, payout) {
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (!currentUser) return;
        
        const username = currentUser.username;
        const gameRecord = {
            user: username,
            game: 'Mines',
            bet: gameState.currentBet,
            result: won ? payout - gameState.currentBet : -gameState.currentBet,
            time: new Date().toISOString(),
            details: {
                mineCount: gameState.mines,
                revealedCount: gameState.revealedCells.length,
                minePositions: gameState.minePositions
            }
        };
        
        try {
            // Track bet using BetaGames global function
            window.BetaGames.trackGameBet(
                'Mines', 
                gameState.currentBet, 
                won ? payout - gameState.currentBet : -gameState.currentBet
            );
        } catch (error) {
            console.error('Error recording game history:', error);
        }
    }
}); 