// BetaGames Mines Game
const { gameHistoryOperations } = require('./js/mongodb');

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const gameSetup = document.getElementById('gameSetup');
    const gamePlay = document.getElementById('gamePlay');
    const gameResult = document.getElementById('gameResult');
    const minesGrid = document.getElementById('minesGrid');
    
    // Game inputs
    const betAmountInput = document.getElementById('betAmount');
    const minesCountInput = document.getElementById('minesCount');
    const gridSizeInput = document.getElementById('gridSize');
    
    // Game display elements
    const gameBetAmount = document.getElementById('gameBetAmount');
    const gameMinesCount = document.getElementById('gameMinesCount');
    const nextReward = document.getElementById('nextReward');
    const totalWin = document.getElementById('totalWin');
    const resultText = document.getElementById('resultText');
    const resultAmount = document.getElementById('resultAmount');
    
    // Game Buttons
    const startGameBtn = document.getElementById('startGameBtn');
    const cashoutBtn = document.getElementById('cashoutBtn');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const betShortcuts = document.querySelectorAll('.bet-shortcut');
    
    // Settings Elements
    const profileSettings = document.getElementById('profileSettings');
    const settingsModal = document.getElementById('settingsModal');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const changePasswordModal = document.getElementById('changePasswordModal');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const soundToggle = document.getElementById('soundToggle');
    const volumeSlider = document.getElementById('volumeSlider');
    const animationToggle = document.getElementById('animationToggle');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const closeButtons = document.querySelectorAll('.close');
    
    // Game history
    const gameHistoryBody = document.getElementById('gameHistoryBody');
    
    // Game settings
    let betAmount = 100;
    let minesCount = 3;
    let gridSize = 5;
    let currentMultiplier = 1.0;
    let totalCells = gridSize * gridSize;
    let gemsFound = 0;
    let isPlaying = false;
    let minePositions = [];
    let revealedCells = [];
    let soundEnabled = true;
    let volumeLevel = 80;
    let animationsEnabled = true;
    
    // Sound effects
    const gemSound = new Audio('../assets/sounds/gem.mp3');
    const mineSound = new Audio('../assets/sounds/mine.mp3');
    const winSound = new Audio('../assets/sounds/win.mp3');
    const clickSound = new Audio('../assets/sounds/click.mp3');
    
    // Initialize
    initGame();
    
    function initGame() {
        // Load settings from localStorage
        loadSettings();
        
        // Add bet shortcut listeners
        betShortcuts.forEach(shortcut => {
            shortcut.addEventListener('click', () => {
                const amount = shortcut.dataset.amount;
                
                if (amount === 'max') {
                    const currentUser = window.BetaAuth?.getCurrentUser();
                    if (currentUser && currentUser.balance) {
                        betAmountInput.value = Math.min(10000, currentUser.balance);
                    } else {
                        betAmountInput.value = 10000;
                    }
                } else {
                    betAmountInput.value = amount;
                }
            });
        });
        
        // Add button listeners
        if (startGameBtn) {
            startGameBtn.addEventListener('click', startGame);
        }
        
        if (cashoutBtn) {
            cashoutBtn.addEventListener('click', cashout);
        }
        
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', resetGame);
        }
        
        // Settings modal listeners
        if (profileSettings) {
            profileSettings.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                showSettingsModal();
            });
        }
        
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                settingsModal.style.display = 'none';
                changePasswordModal.style.display = 'flex';
            });
        }
        
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                clearGameHistory();
            });
        }
        
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                saveSettings();
                settingsModal.style.display = 'none';
            });
        }
        
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                changePassword();
            });
        }
        
        // Close modals
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                settingsModal.style.display = 'none';
                changePasswordModal.style.display = 'none';
            });
        });
        
        // Load game history
        loadMinesHistory();
    }
    
    function startGame() {
        // Validate user is logged in
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (!currentUser) {
            alert('Please login to play!');
            return;
        }
        
        // Get game settings
        betAmount = parseInt(betAmountInput.value) || 100;
        minesCount = parseInt(minesCountInput.value) || 3;
        gridSize = parseInt(gridSizeInput.value) || 5;
        totalCells = gridSize * gridSize;
        
        // Validate bet amount
        if (betAmount < 10) {
            alert('Minimum bet is 10 coins.');
            return;
        }
        
        if (betAmount > 10000) {
            alert('Maximum bet is 10,000 coins.');
            return;
        }
        
        if (betAmount > currentUser.balance) {
            alert('Not enough coins in your balance.');
            return;
        }
        
        // Reset game state
        isPlaying = true;
        gemsFound = 0;
        currentMultiplier = 1.0;
        revealedCells = [];
        
        // Generate random mine positions
        generateMinePositions();
        
        // Update game display
        updateGameDisplay();
        
        // Create grid
        createMinesGrid();
        
        // Switch views
        gameSetup.style.display = 'none';
        gamePlay.style.display = 'block';
        gameResult.style.display = 'none';
        
        // Deduct bet amount
        if (window.BetaAuth) {
            window.BetaAuth.updateBalance(-betAmount, 'Mines game bet');
        }
        
        // Play start sound
        playSound(clickSound);
    }
    
    function generateMinePositions() {
        minePositions = [];
        let possiblePositions = [];
        
        // Create array of all possible positions
        for (let i = 0; i < totalCells; i++) {
            possiblePositions.push(i);
        }
        
        // Shuffle array using Fisher-Yates algorithm
        for (let i = possiblePositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [possiblePositions[i], possiblePositions[j]] = [possiblePositions[j], possiblePositions[i]];
        }
        
        // Select first n positions for mines
        minePositions = possiblePositions.slice(0, minesCount);
    }
    
    function createMinesGrid() {
        // Clear existing grid
        minesGrid.innerHTML = '';
        
        // Set grid template
        minesGrid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        
        // Create cells
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'mines-grid-cell';
            cell.dataset.index = i;
            
            // Add gem icon (hidden initially)
            const icon = document.createElement('i');
            icon.className = 'fas fa-gem';
            cell.appendChild(icon);
            
            // Add click handler
            cell.addEventListener('click', () => {
                if (isPlaying && !revealedCells.includes(i)) {
                    revealCell(i);
                }
            });
            
            minesGrid.appendChild(cell);
        }
    }
    
    function revealCell(index) {
        // Check if this is a mine
        const isMine = minePositions.includes(parseInt(index));
        const cell = minesGrid.querySelector(`[data-index="${index}"]`);
        
        if (!cell) return;
        
        // Add to revealed cells
        revealedCells.push(parseInt(index));
        
        // Update cell appearance
        if (isMine) {
            // It's a mine
            cell.classList.add('revealed-mine');
            const icon = cell.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-bomb';
            }
            
            // Play mine sound
            playSound(mineSound);
            
            // Game over
            gameOver();
        } else {
            // It's a gem
            cell.classList.add('revealed-gem');
            gemsFound++;
            
            // Play gem sound
            playSound(gemSound);
            
            // Update game stats
            updateGameStats();
            
            // Check if all safe cells have been revealed
            if (gemsFound === totalCells - minePositions.length) {
                // Player found all gems without hitting a mine
                winGame();
            }
        }
    }
    
    function updateGameStats() {
        // Calculate new multiplier based on gems found
        const safeSquares = totalCells - minesCount;
        
        // Calculate next multiplier
        // Formula is based on probability - the more mines, the higher the multiplier
        const baseFactor = totalCells / (totalCells - minesCount);
        currentMultiplier = Math.pow(baseFactor, gemsFound);
        currentMultiplier = Math.round(currentMultiplier * 100) / 100; // Round to 2 decimals
        
        // Calculate next potential reward
        const nextPotentialReward = Math.round(betAmount * currentMultiplier);
        
        // Update display
        gameBetAmount.textContent = window.BetaGames?.formatCurrency(betAmount);
        gameMinesCount.textContent = minesCount;
        nextReward.textContent = window.BetaGames?.formatCurrency(nextPotentialReward);
        totalWin.textContent = window.BetaGames?.formatCurrency(nextPotentialReward - betAmount);
    }
    
    function cashout() {
        if (!isPlaying) return;
        
        // Calculate winnings
        const winnings = Math.round(betAmount * currentMultiplier);
        
        // Update user balance
        if (window.BetaAuth) {
            window.BetaAuth.updateBalance(winnings, 'Mines game win');
        }
        
        // Play win sound
        playSound(winSound);
        
        // Update game history
        addGameToHistory({
            bet: betAmount,
            mines: minesCount,
            gemsFound: gemsFound,
            outcome: winnings - betAmount,
            grid: gridSize,
            time: new Date()
        });
        
        // Show all mines
        revealAllMines();
        
        // Show result
        gamePlay.style.display = 'none';
        gameResult.style.display = 'block';
        
        resultText.textContent = 'You Cashed Out!';
        resultText.style.color = 'var(--success-color)';
        resultAmount.textContent = window.BetaGames?.formatCurrency(winnings - betAmount);
        resultAmount.style.color = 'var(--success-color)';
        
        // Track bet in main system
        if (window.BetaGames?.trackGameBet) {
            window.BetaGames.trackGameBet('Mines', betAmount, winnings - betAmount);
        }
        
        isPlaying = false;
    }
    
    function gameOver() {
        if (!isPlaying) return;
        
        // Show all mines
        revealAllMines();
        
        // Update game history
        addGameToHistory({
            bet: betAmount,
            mines: minesCount,
            gemsFound: gemsFound,
            outcome: -betAmount,
            grid: gridSize,
            time: new Date()
        });
        
        // Show result
        gamePlay.style.display = 'none';
        gameResult.style.display = 'block';
        
        resultText.textContent = 'Game Over!';
        resultText.style.color = 'var(--danger-color)';
        resultAmount.textContent = window.BetaGames?.formatCurrency(-betAmount);
        resultAmount.style.color = 'var(--danger-color)';
        
        // Track bet in main system
        if (window.BetaGames?.trackGameBet) {
            window.BetaGames.trackGameBet('Mines', betAmount, -betAmount);
        }
        
        isPlaying = false;
    }
    
    function winGame() {
        if (!isPlaying) return;
        
        // Calculate winnings (full board clear bonus)
        const winnings = Math.round(betAmount * currentMultiplier * 1.5); // 50% bonus for clearing
        
        // Update user balance
        if (window.BetaAuth) {
            window.BetaAuth.updateBalance(winnings, 'Mines game full clear');
        }
        
        // Play win sound
        playSound(winSound);
        
        // Update game history
        addGameToHistory({
            bet: betAmount,
            mines: minesCount,
            gemsFound: gemsFound,
            outcome: winnings - betAmount,
            grid: gridSize,
            time: new Date()
        });
        
        // Show all mines
        revealAllMines();
        
        // Show result
        gamePlay.style.display = 'none';
        gameResult.style.display = 'block';
        
        resultText.textContent = 'Perfect Game! 50% Bonus';
        resultText.style.color = 'var(--success-color)';
        resultAmount.textContent = window.BetaGames?.formatCurrency(winnings - betAmount);
        resultAmount.style.color = 'var(--success-color)';
        
        // Track bet in main system
        if (window.BetaGames?.trackGameBet) {
            window.BetaGames.trackGameBet('Mines', betAmount, winnings - betAmount);
        }
        
        isPlaying = false;
    }
    
    function revealAllMines() {
        // Show all mines
        minePositions.forEach(position => {
            const cell = minesGrid.querySelector(`[data-index="${position}"]`);
            if (cell && !revealedCells.includes(position)) {
                cell.classList.add('revealed-mine');
                const icon = cell.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-bomb';
                }
            }
        });
        
        // Also reveal all unrevealed gems
        for (let i = 0; i < totalCells; i++) {
            if (!minePositions.includes(i) && !revealedCells.includes(i)) {
                const cell = minesGrid.querySelector(`[data-index="${i}"]`);
                if (cell) {
                    cell.classList.add('revealed-gem');
                    cell.style.opacity = '0.5'; // Dim the unrevealed gems
                }
            }
        }
    }
    
    function resetGame() {
        // Reset views
        gameSetup.style.display = 'block';
        gamePlay.style.display = 'none';
        gameResult.style.display = 'none';
    }
    
    function updateGameDisplay() {
        gameBetAmount.textContent = window.BetaGames?.formatCurrency(betAmount);
        gameMinesCount.textContent = minesCount;
        nextReward.textContent = window.BetaGames?.formatCurrency(betAmount);
        totalWin.textContent = window.BetaGames?.formatCurrency(0);
    }
    
    // Add a game to history
    async function addGameToHistory(game) {
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (!currentUser) return;
        game.user = currentUser.username;
        try {
            await gameHistoryOperations.addGameHistory(game);
        } catch (error) {
            console.error('Error saving mines game history:', error);
            const existingHistory = JSON.parse(localStorage.getItem('mines_history') || '[]');
            existingHistory.unshift(game);
            if (existingHistory.length > 50) {
                existingHistory.length = 50;
            }
            localStorage.setItem('mines_history', JSON.stringify(existingHistory));
        }
        const localHistory = JSON.parse(localStorage.getItem('mines_history') || '[]');
        localHistory.unshift(game);
        if (localHistory.length > 50) {
            localHistory.length = 50;
        }
        localStorage.setItem('mines_history', JSON.stringify(localHistory));
        updateMinesHistoryTable([game, ...JSON.parse(localStorage.getItem('mines_history') || '[]')]);
    }
    
    // Clear game history
    function clearGameHistory() {
        if (confirm('Are you sure you want to clear your game history?')) {
            localStorage.removeItem('mines_history');
            updateMinesHistoryTable([]);
        }
    }
    
    // Load mines game history
    async function loadMinesHistory() {
        try {
            const history = await gameHistoryOperations.getRecentHistory();
            const minesHistory = history.filter(game => game.game === 'mines');
            updateMinesHistoryTable(minesHistory);
        } catch (error) {
            console.error('Error loading mines history:', error);
            const localHistory = JSON.parse(localStorage.getItem('mines_history') || '[]');
            updateMinesHistoryTable(localHistory);
        }
    }
    
    // Update mines history table
    function updateMinesHistoryTable(history) {
        if (!gameHistoryBody) return;
        
        // Clear table
        gameHistoryBody.innerHTML = '';
        
        // Show message if no history
        if (history.length === 0) {
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = 6;
            emptyCell.className = 'empty-activity';
            emptyCell.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>No game history yet. Play your first game!</p>
                </div>
            `;
            emptyRow.appendChild(emptyCell);
            gameHistoryBody.appendChild(emptyRow);
            return;
        }
        
        // Add rows for each game
        history.forEach(game => {
            const row = document.createElement('tr');
            
            // User cell
            const userCell = document.createElement('td');
            userCell.textContent = game.user;
            
            // Bet cell
            const betCell = document.createElement('td');
            betCell.textContent = window.BetaGames?.formatCurrency(game.bet);
            
            // Mines cell
            const minesCell = document.createElement('td');
            minesCell.textContent = game.mines;
            
            // Gems Found cell
            const gemsCell = document.createElement('td');
            gemsCell.textContent = game.gemsFound;
            
            // Outcome cell
            const outcomeCell = document.createElement('td');
            outcomeCell.textContent = window.BetaGames?.formatCurrency(game.outcome);
            outcomeCell.style.color = game.outcome >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
            
            // Time cell
            const timeCell = document.createElement('td');
            timeCell.textContent = window.BetaGames?.formatTime(new Date(game.time));
            
            // Append cells to row
            row.appendChild(userCell);
            row.appendChild(betCell);
            row.appendChild(minesCell);
            row.appendChild(gemsCell);
            row.appendChild(outcomeCell);
            row.appendChild(timeCell);
            
            // Add animation class
            row.classList.add('fade-in');
            
            // Append row to table
            gameHistoryBody.appendChild(row);
        });
    }
    
    // Show settings modal
    function showSettingsModal() {
        // Load current settings
        soundToggle.checked = soundEnabled;
        volumeSlider.value = volumeLevel;
        animationToggle.checked = animationsEnabled;
        
        // Show modal
        settingsModal.style.display = 'flex';
    }
    
    // Save settings
    function saveSettings() {
        soundEnabled = soundToggle.checked;
        volumeLevel = volumeSlider.value;
        animationsEnabled = animationToggle.checked;
        
        // Save to localStorage
        localStorage.setItem('sound_enabled', soundEnabled);
        localStorage.setItem('volume_level', volumeLevel);
        localStorage.setItem('animations_enabled', animationsEnabled);
        
        // Update sound volumes
        updateSoundVolumes();
        
        // Apply animation settings
        applyAnimationSettings();
        
        // Show notification
        alert('Settings saved successfully!');
    }
    
    // Load settings
    function loadSettings() {
        // Load from localStorage with defaults
        soundEnabled = localStorage.getItem('sound_enabled') !== null
            ? localStorage.getItem('sound_enabled') === 'true'
            : true;
        
        volumeLevel = localStorage.getItem('volume_level') !== null
            ? parseInt(localStorage.getItem('volume_level'))
            : 80;
        
        animationsEnabled = localStorage.getItem('animations_enabled') !== null
            ? localStorage.getItem('animations_enabled') === 'true'
            : true;
        
        // Update sound volumes
        updateSoundVolumes();
        
        // Apply animation settings
        applyAnimationSettings();
    }
    
    // Update sound volumes
    function updateSoundVolumes() {
        const volume = soundEnabled ? volumeLevel / 100 : 0;
        gemSound.volume = volume;
        mineSound.volume = volume;
        winSound.volume = volume;
        clickSound.volume = volume;
    }
    
    // Apply animation settings
    function applyAnimationSettings() {
        if (animationsEnabled) {
            document.body.classList.remove('no-animations');
        } else {
            document.body.classList.add('no-animations');
        }
    }
    
    // Play sound helper
    function playSound(sound) {
        if (soundEnabled && sound) {
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.log('Failed to play sound:', error);
            });
        }
    }
    
    // Change password
    function changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        
        // Validate passwords match
        if (newPassword !== confirmNewPassword) {
            alert('New passwords do not match!');
            return;
        }
        
        // In a real app, would validate current password against server
        // For demo, we'll just allow the change
        
        alert('Password changed successfully!');
        changePasswordModal.style.display = 'none';
        
        // Reset form
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
    }
}); 