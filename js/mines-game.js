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
        betAmount: 100,
        minesCount: 3,
        gridSize: 5,
        gemsFound: 0,
        totalWin: 0,
        nextReward: 0,
        mines: [],
        revealed: []
    };
    
    // Initialize game
    init();
    
    function init() {
        // Set default values
        betAmount.value = gameState.betAmount;
        minesCount.value = gameState.minesCount;
        gridSize.value = gameState.gridSize;
        
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
        loadGameHistory();
    }
    
    // Start a new game
    async function startGame() {
        // Check if user is logged in
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (!currentUser) {
            alert('Please login to play!');
            return;
        }
        
        // Get game settings
        gameState.betAmount = parseInt(betAmount.value) || 100;
        gameState.minesCount = parseInt(minesCount.value) || 3;
        gameState.gridSize = parseInt(gridSize.value) || 5;
        
        // Validate settings
        if (gameState.betAmount < 10) {
            alert('Minimum bet is 10 coins.');
            return;
        }
        
        if (gameState.betAmount > 10000) {
            alert('Maximum bet is 10,000 coins.');
            return;
        }
        
        if (gameState.betAmount > currentUser.balance) {
            alert('Not enough coins in your balance.');
            return;
        }
        
        if (gameState.minesCount >= gameState.gridSize * gameState.gridSize) {
            alert('Too many mines for this grid size!');
            return;
        }
        
        // Deduct bet amount
        await window.BetaAuth.updateBalance(-gameState.betAmount, 'mines');
        
        // Initialize game state
        gameState.isPlaying = true;
        gameState.gemsFound = 0;
        gameState.totalWin = 0;
        gameState.nextReward = gameState.betAmount;
        gameState.mines = [];
        gameState.revealed = [];
        
        // Place mines randomly
        const totalCells = gameState.gridSize * gameState.gridSize;
        while (gameState.mines.length < gameState.minesCount) {
            const mine = Math.floor(Math.random() * totalCells);
            if (!gameState.mines.includes(mine)) {
                gameState.mines.push(mine);
            }
        }
        
        // Update UI
        gameSetup.style.display = 'none';
        gamePlay.style.display = 'block';
        gameResult.style.display = 'none';
        
        gameBetAmount.textContent = formatCurrency(gameState.betAmount);
        gameMinesCount.textContent = gameState.minesCount;
        nextReward.textContent = formatCurrency(gameState.nextReward);
        totalWin.textContent = formatCurrency(gameState.totalWin);
        
        // Create grid
        createGrid();
    }
    
    // Create the mines grid
    function createGrid() {
        minesGrid.innerHTML = '';
        minesGrid.style.gridTemplateColumns = `repeat(${gameState.gridSize}, 1fr)`;
        
        for (let i = 0; i < gameState.gridSize * gameState.gridSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'mine-cell';
            cell.dataset.index = i;
            
            cell.addEventListener('click', () => revealCell(i));
            
            minesGrid.appendChild(cell);
        }
    }
    
    // Reveal a cell
    async function revealCell(index) {
        if (!gameState.isPlaying || gameState.revealed.includes(index)) return;
        
        const cell = minesGrid.children[index];
        gameState.revealed.push(index);
        
        if (gameState.mines.includes(index)) {
            // Hit a mine
            gameState.isPlaying = false;
            cell.classList.add('mine');
            
            // Reveal all mines
            gameState.mines.forEach(mineIndex => {
                if (mineIndex !== index) {
                    minesGrid.children[mineIndex].classList.add('mine');
                }
            });
            
            // Show result
            showResult(false);
        } else {
            // Found a gem
            cell.classList.add('gem');
            gameState.gemsFound++;
            
            // Calculate next reward
            const multiplier = 1 + (gameState.gemsFound * 0.1);
            gameState.nextReward = Math.floor(gameState.betAmount * multiplier);
            gameState.totalWin = gameState.nextReward;
            
            // Update UI
            nextReward.textContent = formatCurrency(gameState.nextReward);
            totalWin.textContent = formatCurrency(gameState.totalWin);
        }
    }
    
    // Cash out
    async function cashout() {
        if (!gameState.isPlaying) return;
        
        gameState.isPlaying = false;
        
        // Add winnings to balance
        await window.BetaAuth.updateBalance(gameState.totalWin, 'mines');
        
        // Show result
        showResult(true);
    }
    
    // Show game result
    async function showResult(won) {
        gamePlay.style.display = 'none';
        gameResult.style.display = 'block';
        
        if (won) {
            resultText.textContent = 'You Won!';
            resultAmount.textContent = `+${formatCurrency(gameState.totalWin)}`;
            resultAmount.className = 'win';
        } else {
            resultText.textContent = 'You Lost!';
            resultAmount.textContent = `-${formatCurrency(gameState.betAmount)}`;
            resultAmount.className = 'loss';
        }
        
        // Add to game history
        const gameData = {
            user: window.BetaAuth?.getCurrentUser()?.username || 'Guest',
            game: 'mines',
            bet: gameState.betAmount,
            mines: gameState.minesCount,
            gemsFound: gameState.gemsFound,
            outcome: won ? gameState.totalWin : -gameState.betAmount,
            grid: gameState.gridSize
        };
        
        await gameHistoryOperations.addGameHistory(gameData);
        
        // Reload game history
        loadGameHistory();
    }
    
    // Reset the game
    function resetGame() {
        gameSetup.style.display = 'block';
        gamePlay.style.display = 'none';
        gameResult.style.display = 'none';
        
        // Reset game state
        gameState = {
            isPlaying: false,
            betAmount: 100,
            minesCount: 3,
            gridSize: 5,
            gemsFound: 0,
            totalWin: 0,
            nextReward: 0,
            mines: [],
            revealed: []
        };
        
        // Reset UI
        betAmount.value = gameState.betAmount;
        minesCount.value = gameState.minesCount;
        gridSize.value = gameState.gridSize;
    }
    
    // Load game history
    async function loadGameHistory() {
        try {
            const history = await gameHistoryOperations.getRecentHistory();
            const minesHistory = history.filter(game => game.game === 'mines');
            updateGameHistoryTable(minesHistory);
        } catch (error) {
            console.error('Error loading game history:', error);
        }
    }
    
    // Update game history table
    function updateGameHistoryTable(history) {
        if (!gameHistoryBody) return;
        
        gameHistoryBody.innerHTML = '';
        
        history.forEach(game => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${game.user}</td>
                <td>${formatCurrency(game.bet)}</td>
                <td>${game.mines}</td>
                <td>${game.gemsFound}</td>
                <td class="${game.outcome >= 0 ? 'win' : 'loss'}">${formatCurrency(game.outcome)}</td>
                <td>${formatTime(game.time)}</td>
            `;
            
            gameHistoryBody.appendChild(row);
        });
    }
    
    // Format currency
    function formatCurrency(amount) {
        return new Intl.NumberFormat().format(amount);
    }
    
    // Format time
    function formatTime(date) {
        return new Date(date).toLocaleString();
    }
}); 