// BetaGames Mines Game
const { gameHistoryOperations } = require('./mongodb');

document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const gameSetup = document.getElementById('gameSetup');
    const gamePlay = document.getElementById('gamePlay');
    const gameResult = document.getElementById('gameResult');
    const minesGrid = document.getElementById('minesGrid');
    const betAmount = document.getElementById('betAmount');
    const minesCount = document.getElementById('minesCount');
    const gridSize = document.getElementById('gridSize');
    const startGameBtn = document.getElementById('startGameBtn');
    const cashoutBtn = document.getElementById('cashoutBtn');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const gameBetAmount = document.getElementById('gameBetAmount');
    const gameMinesCount = document.getElementById('gameMinesCount');
    const nextReward = document.getElementById('nextReward');
    const totalWin = document.getElementById('totalWin');
    const resultText = document.getElementById('resultText');
    const resultAmount = document.getElementById('resultAmount');
    const gameHistoryBody = document.getElementById('gameHistoryBody');
    const betShortcuts = document.querySelectorAll('.bet-shortcut');
    
    // Game state
    let gameState = {
        isPlaying: false,
        currentBet: 0,
        mines: [],
        revealed: [],
        multiplier: 1,
        profit: 0
    };
    
    // Initialize game
    initGame();
    
    function initGame() {
        // Set default values
        betAmount.value = gameState.currentBet;
        minesCount.value = gameState.mines.length;
        gridSize.value = Math.sqrt(gameState.mines.length);
        
        // Event listeners
        startGameBtn.addEventListener('click', startGame);
        cashoutBtn.addEventListener('click', cashout);
        playAgainBtn.addEventListener('click', resetGame);
        
        // Bet shortcuts
        betShortcuts.forEach(shortcut => {
            shortcut.addEventListener('click', () => {
                const amount = shortcut.dataset.amount;
                
                if (amount === 'max') {
                    const currentUser = window.BetaAuth?.getCurrentUser();
                    if (currentUser && currentUser.balance) {
                        betAmount.value = Math.min(10000, currentUser.balance);
                    } else {
                        betAmount.value = 10000;
                    }
                } else {
                    betAmount.value = amount;
                }
            });
        });
        
        // Load game history
        loadMinesHistory();
    }
    
    // Start a new game
    function startGame() {
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (!currentUser) {
            alert('Please log in to play');
            return;
        }
        
        if (currentUser.balance < gameState.currentBet) {
            alert('Insufficient balance');
            return;
        }
        
        // Reset game state
        gameState = {
            isPlaying: true,
            currentBet: gameState.currentBet,
            mines: [],
            revealed: [],
            multiplier: 1,
            profit: 0
        };
        
        // Generate mines
        const mineCount = parseInt(minesCount.value) || 3;
        generateMines(mineCount);
        
        // Update UI
        updateUI();
        
        // Deduct bet amount
        window.BetaAuth.updateBalance(-gameState.currentBet, 'mines_bet');
    }
    
    // Generate random mine positions
    function generateMines(count) {
        const positions = new Set();
        while (positions.size < count) {
            positions.add(Math.floor(Math.random() * gameState.mines.length));
        }
        gameState.mines = Array.from(positions);
        minesCount.value = gameState.mines.length;
        gridSize.value = Math.sqrt(gameState.mines.length);
        
        // Update UI
        updateUI();
    }
    
    // Reveal a cell
    function revealCell(index) {
        if (gameState.revealed.includes(index)) return;
        
        const cell = minesGrid.children[index];
        gameState.revealed.push(index);
        
        if (gameState.mines.includes(index)) {
            // Hit a mine
            gameOver(false);
        } else {
            // Safe cell
            cell.classList.add('revealed');
            
            // Update multiplier and profit
            updateMultiplier();
            
            // Update UI
            updateUI();
        }
    }
    
    // Update multiplier based on revealed cells
    function updateMultiplier() {
        const mineCount = gameState.mines.length;
        const revealedCount = gameState.revealed.length;
        
        // Calculate multiplier based on mine count and revealed cells
        const baseMultiplier = 1 + (mineCount * 0.2);
        const revealedBonus = revealedCount * 0.1;
        
        gameState.multiplier = baseMultiplier + revealedBonus;
        gameState.profit = Math.floor(gameState.currentBet * gameState.multiplier);
        
        // Update UI
        updateUI();
    }
    
    // Cash out
    function cashout() {
        if (!gameState.isPlaying) return;
        
        // Add winnings to balance
        window.BetaAuth.updateBalance(gameState.profit, 'mines_win');
        
        // Record game result
        addGameToHistory(true);
        
        // Reset game state
        gameState.isPlaying = false;
        
        // Update UI
        updateUI();
    }
    
    // Game over
    function gameOver(won) {
        if (!won) {
            // Record loss
            addGameToHistory(false);
        }
        
        // Reset game state
        gameState.isPlaying = false;
        
        // Update UI
        updateUI();
    }
    
    // Update UI elements
    function updateUI() {
        const multiplierDisplay = document.getElementById('currentMultiplier');
        const profitDisplay = document.getElementById('currentProfit');
        const cashoutButton = document.getElementById('cashoutBtn');
        const startButton = document.getElementById('startGameBtn');
        
        if (multiplierDisplay) {
            multiplierDisplay.textContent = gameState.multiplier.toFixed(2) + 'x';
        }
        
        if (profitDisplay) {
            profitDisplay.textContent = gameState.profit;
        }
        
        if (cashoutButton) {
            cashoutButton.disabled = !gameState.isPlaying;
        }
        
        if (startButton) {
            startButton.disabled = gameState.isPlaying;
        }
    }
    
    // Reset the game
    function resetGame() {
        gameSetup.style.display = 'block';
        gamePlay.style.display = 'none';
        gameResult.style.display = 'none';
        
        // Reset game state
        gameState = {
            isPlaying: false,
            currentBet: 0,
            mines: [],
            revealed: [],
            multiplier: 1,
            profit: 0
        };
        
        // Reset UI
        betAmount.value = gameState.currentBet;
        minesCount.value = gameState.mines.length;
        gridSize.value = Math.sqrt(gameState.mines.length);
    }
    
    // Add game to history
    async function addGameToHistory(won) {
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (!currentUser) return;
        
        const gameRecord = {
            user: currentUser.username,
            game: 'mines',
            bet: gameState.currentBet,
            result: won ? gameState.profit : -gameState.currentBet,
            time: new Date().toISOString(),
            details: {
                mineCount: gameState.mines.length,
                revealedCount: gameState.revealed.length,
                multiplier: gameState.multiplier
            }
        };
        
        try {
            // Save to Supabase
            const { data: savedRecord, error } = await window.SupabaseDB
                .from('game_history')
                .insert([gameRecord])
                .select()
                .single();

            if (error) throw error;

            // Update local history
            const historyTable = document.getElementById('minesHistoryBody');
            if (historyTable) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${gameRecord.user}</td>
                    <td>${gameRecord.bet}</td>
                    <td>${gameRecord.result >= 0 ? '+' + gameRecord.result : gameRecord.result}</td>
                    <td>${gameRecord.details.mineCount} mines</td>
                    <td>${gameRecord.details.revealedCount} revealed</td>
                    <td>${gameRecord.details.multiplier.toFixed(2)}x</td>
                `;
                historyTable.insertBefore(row, historyTable.firstChild);
            }
        } catch (error) {
            console.error('Error saving game history:', error);
            // Fall back to local storage
            const history = JSON.parse(localStorage.getItem('mines_history') || '[]');
            history.unshift(gameRecord);
            localStorage.setItem('mines_history', JSON.stringify(history));
            
            // Update local history display
            const historyTable = document.getElementById('minesHistoryBody');
            if (historyTable) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${gameRecord.user}</td>
                    <td>${gameRecord.bet}</td>
                    <td>${gameRecord.result >= 0 ? '+' + gameRecord.result : gameRecord.result}</td>
                    <td>${gameRecord.details.mineCount} mines</td>
                    <td>${gameRecord.details.revealedCount} revealed</td>
                    <td>${gameRecord.details.multiplier.toFixed(2)}x</td>
                `;
                historyTable.insertBefore(row, historyTable.firstChild);
            }
        }
    }
    
    // Load mines game history
    async function loadMinesHistory() {
        const historyTable = document.getElementById('minesHistoryBody');
        if (!historyTable) return;
        
        try {
            // Load from Supabase
            const { data: history, error } = await window.SupabaseDB
                .from('game_history')
                .select('*')
                .eq('game', 'mines')
                .order('time', { ascending: false })
                .limit(10);

            if (error) throw error;

            // Display history
            history.forEach(record => {
            const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${record.user}</td>
                    <td>${record.bet}</td>
                    <td>${record.result >= 0 ? '+' + record.result : record.result}</td>
                    <td>${record.details.mineCount} mines</td>
                    <td>${record.details.revealedCount} revealed</td>
                    <td>${record.details.multiplier.toFixed(2)}x</td>
                `;
                historyTable.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading mines history:', error);
            // Fall back to local storage
            const history = JSON.parse(localStorage.getItem('mines_history') || '[]');
            history.slice(0, 10).forEach(record => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${record.user}</td>
                    <td>${record.bet}</td>
                    <td>${record.result >= 0 ? '+' + record.result : record.result}</td>
                    <td>${record.details.mineCount} mines</td>
                    <td>${record.details.revealedCount} revealed</td>
                    <td>${record.details.multiplier.toFixed(2)}x</td>
                `;
                historyTable.appendChild(row);
            });
        }
    }
}); 