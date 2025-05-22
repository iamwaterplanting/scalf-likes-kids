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
    const currentBetDisplay = document.getElementById('currentBet');
    const currentPayoutDisplay = document.getElementById('currentPayout');
    const manualBtns = document.querySelectorAll('.manual-btn');
    const minesBtns = document.querySelectorAll('.mines-btn');
    
    // Game state
    let gameState = {
        isPlaying: false,
        currentBet: 50,
        mines: 3,
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
        
        // Mines count selector buttons
        minesBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                minesBtns.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Update mines count
                const mines = btn.dataset.mines;
                minesCount.value = mines;
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
        minesBtns.forEach(btn => btn.disabled = true);
        
        // Display current bet
        if (currentBetDisplay) {
            currentBetDisplay.textContent = gameState.currentBet.toFixed(2);
        }
        
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
            const mine = document.createElement('i');
            mine.className = 'fas fa-bomb mine';
            cell.appendChild(mine);
            
            // Show all mines
            revealAllMines();
            
            // Game over
            gameOver(false);
        } else {
            // Found a gem
            cell.classList.add('revealed-gem');
            
            // Create gem element
            const gem = document.createElement('i');
            gem.className = 'fas fa-gem gem';
            cell.appendChild(gem);
            
            // Update next payout and profit
            gameState.currentProfit = calculateNextPayout(gameState.currentBet, gameState.mines, gameState.revealedCells.length - 1) - gameState.currentBet;
            gameState.nextPayout = calculateNextPayout(gameState.currentBet, gameState.mines, gameState.revealedCells.length);
            
            // Update display
            updateDisplay();
            
            // Check if all safe cells are revealed (win)
            const totalSafeCells = gameState.totalCells - gameState.mines;
            if (gameState.revealedCells.length >= totalSafeCells) {
                gameOver(true);
            }
        }
    }
    
    // Reveal all mines
    function revealAllMines() {
        const cells = minesGrid.children;
        
        gameState.minePositions.forEach(pos => {
            if (!gameState.revealedCells.includes(pos)) {
                const cell = cells[pos];
                cell.classList.add('revealed-mine');
                
                const mine = document.createElement('i');
                mine.className = 'fas fa-bomb mine';
                cell.appendChild(mine);
            }
        });
    }
    
    // Update game display
    function updateDisplay() {
        // Update next gem amount
        if (nextGemAmount) {
            nextGemAmount.textContent = gameState.nextPayout.toFixed(2);
        }
        
        // Update total profit
        if (totalProfit) {
            totalProfit.textContent = gameState.currentProfit.toFixed(2);
        }
        
        // Update current payout
        if (currentPayoutDisplay && gameState.isPlaying) {
            const currentPayout = gameState.currentBet + gameState.currentProfit;
            currentPayoutDisplay.textContent = currentPayout.toFixed(2);
        }
    }
    
    // Cashout
    function cashout() {
        if (!gameState.isPlaying || gameState.revealedCells.length === 0) return;
        
        // Calculate winnings
        const winnings = gameState.currentBet + gameState.currentProfit;
        
        // Add winnings to balance
        window.BetaAuth.updateBalance(winnings, 'mines_cashout');
        
        // Record game
        recordGame(true, winnings);
        
        // End game
        gameEnded();
    }
    
    // Handle game over
    function gameOver(success) {
        if (success) {
            // User won (all safe cells revealed)
            const winnings = gameState.currentBet + gameState.currentProfit;
            window.BetaAuth.updateBalance(winnings, 'mines_win');
            recordGame(true, winnings);
        } else {
            // User lost (hit a mine)
            recordGame(false, 0);
        }
        
        // End game
        gameEnded();
    }
    
    // Reset game state after end
    function gameEnded() {
        gameState.isPlaying = false;
        
        // Update UI
        betButton.style.display = 'block';
        cashoutBtn.style.display = 'none';
        betAmount.disabled = false;
        minesBtns.forEach(btn => btn.disabled = false);
        
        // Reset next values
        gameState.nextPayout = 0;
        gameState.currentProfit = 0;
        
        // Update display
        updateDisplay();
    }
    
    // Record game in history
    async function recordGame(won, payout) {
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (!currentUser) return;
        
        const gameData = {
            user: currentUser.username,
            game: 'mines',
            bet: gameState.currentBet,
            mines: gameState.mines,
            gems: gameState.revealedCells.length,
            outcome: won ? payout - gameState.currentBet : -gameState.currentBet
        };
        
        try {
            await window.gameHistoryOperations?.addGameHistory(gameData);
            // Update game history table if it exists
            const gameHistoryBody = document.getElementById('gameHistoryBody');
            if (gameHistoryBody) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${gameData.user}</td>
                    <td>${gameData.bet}</td>
                    <td>${gameData.mines}</td>
                    <td>${gameData.gems}</td>
                    <td class="${won ? 'win' : 'loss'}">${won ? '+' + (payout - gameState.currentBet) : -gameData.bet}</td>
                    <td>${new Date().toLocaleTimeString()}</td>
                `;
                gameHistoryBody.prepend(row);
            }
        } catch (error) {
            console.error('Error recording game:', error);
        }
    }
}); 