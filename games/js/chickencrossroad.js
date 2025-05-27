// Chicken Crossroad Game - Core Logic
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chickenContainer = document.getElementById('chickenContainer');
    const chickenGame = document.getElementById('chickenGame');
    const chickenCharacter = document.getElementById('chickenCharacter');
    const chickenSidebar = document.getElementById('chickenSidebar');
    const betButton = document.getElementById('betButton');
    const cashoutBtn = document.getElementById('cashoutBtn');
    const gameOverPopup = document.getElementById('gameOverPopup');
    const winPopup = document.getElementById('winPopup');
    const newGameBtn = document.getElementById('newGameBtn');
    const newGameWinBtn = document.getElementById('newGameWinBtn');
    const gameOverMessage = document.getElementById('gameOverMessage');
    const winMessage = document.getElementById('winMessage');
    const winAmount = document.getElementById('winAmount');
    const currentMultiplier = document.getElementById('currentMultiplier');
    const currentPayout = document.getElementById('currentPayout');
    const currentBet = document.getElementById('currentBet');
    
    // Game elements
    const gamePlayingElements = document.querySelectorAll('.game-playing-content');
    const gameSetupElements = document.querySelectorAll('.game-setup-content');
    
    // Game state
    let gameStarted = false;
    let gameEnded = false;
    let currentLane = 0;
    let maxLanes = 20;
    let multiplier = 1.0;
    let intervalId = null;
    let carIntervals = [];
    let crashPoint = null;
    let betAmount = 0;
    let lastTime = 0;
    let moveChickenTimer = 0;
    let moveChickenInterval = 2000; // Move chicken every 2 seconds
    
    // Debug mode - set to false in production
    const DEBUG = false;
    
    function debug(message) {
        if (DEBUG) {
            console.log(`[CHICKEN DEBUG] ${message}`);
        }
    }
    
    // Initialize UI
    initUI();
    
    function initUI() {
        // Set up event listeners
        setupEventListeners();
        
        // Update stats from localStorage if available
        updateGameStats();
        
        debug("Game initialized");
    }
    
    function setupEventListeners() {
        // Bet button starts the game
        betButton.addEventListener('click', startGame);
        
        // Cashout button ends the game
        if (cashoutBtn) {
            cashoutBtn.addEventListener('click', () => cashOut());
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
        
        // Difficulty buttons
        const difficultyButtons = document.querySelectorAll('.difficulty-btn');
        difficultyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                difficultyButtons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
                debug(`Difficulty set to: ${btn.dataset.difficulty}`);
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
        betAmount = getBetAmount();
        if (!validateBet(betAmount)) {
            return;
        }
        
        // Get difficulty
        const difficulty = getDifficulty();
        
        // Hide any visible popups
        hidePopups();
        
        // Reset game state
        gameStarted = true;
        gameEnded = false;
        currentLane = 0;
        multiplier = 1.0;
        moveChickenTimer = 0;
        
        // Adjust move interval based on difficulty
        switch(difficulty) {
            case 'easy':
                moveChickenInterval = 2500; // Slower movement
                break;
            case 'medium':
                moveChickenInterval = 2000;
                break;
            case 'hard':
                moveChickenInterval = 1500;
                break;
            case 'extreme':
                moveChickenInterval = 1000; // Faster movement
                break;
            default:
                moveChickenInterval = 2000;
        }
        
        // Clear any existing grid and cars
        clearRoads();
        
        // Generate crash point based on difficulty
        generateCrashPoint(difficulty);
        
        // Deduct bet from balance
        updateBalance(-betAmount);
        
        // Update UI
        chickenContainer.classList.remove('game-not-started');
        chickenContainer.classList.add('game-started');
        
        // Show game playing elements and hide setup elements
        gamePlayingElements.forEach(el => {
            el.style.display = 'flex';
        });
        
        gameSetupElements.forEach(el => {
            el.style.display = 'none';
        });
        
        // Update game stats display
        updateGameDisplay();
        
        // Reset chicken position - center of left side
        const roadHeight = chickenGame.offsetHeight / 5;
        chickenCharacter.style.top = `${roadHeight * 2 + (roadHeight / 2) - 30}px`; // Center in middle row
        chickenCharacter.style.left = `0px`;
        chickenCharacter.dataset.col = '0'; // Start at leftmost column
        chickenCharacter.dataset.row = '2'; // Middle row
        
        // Generate initial grid
        generateRoads();
        
        // Add starting point indicator
        const startCell = document.querySelector('.road-cell[data-row="2"][data-col="0"]');
        if (startCell) {
            startCell.classList.add('start-cell');
            
            // Add arrow pointing right
            const arrow = document.createElement('div');
            arrow.className = 'start-arrow';
            arrow.innerHTML = '➡️';
            startCell.appendChild(arrow);
        }
        
        // Start game loop
        lastTime = Date.now();
        intervalId = setInterval(gameLoop, 50);  // 20 fps
        
        // Animate chicken at start
        chickenCharacter.classList.add('ready-animation');
        
        // Add countdown animation
        const countdown = document.createElement('div');
        countdown.className = 'countdown';
        countdown.innerHTML = '3';
        chickenGame.appendChild(countdown);
        
        setTimeout(() => {
            countdown.innerHTML = '2';
            setTimeout(() => {
                countdown.innerHTML = '1';
                setTimeout(() => {
                    countdown.innerHTML = 'GO!';
                    countdown.classList.add('go');
                    setTimeout(() => {
                        countdown.remove();
                        chickenCharacter.classList.remove('ready-animation');
                        chickenCharacter.classList.add('running-right');
                        
                        // Begin automatic movement after countdown
                        moveChickenTimer = moveChickenInterval;
                    }, 800);
                }, 800);
            }, 800);
        }, 800);
        
        debug(`Game started with bet: ${betAmount}, crash point: ${crashPoint}, difficulty: ${difficulty}, move interval: ${moveChickenInterval}ms`);
    }
    
    function getDifficulty() {
        // Check which difficulty button is active
        const difficultyButtons = document.querySelectorAll('.difficulty-btn');
        let difficulty = 'easy'; // Default
        
        difficultyButtons.forEach(btn => {
            if (btn.classList.contains('active')) {
                difficulty = btn.dataset.difficulty;
            }
        });
        
        return difficulty;
    }
    
    function gameLoop() {
        const now = Date.now();
        const deltaTime = now - lastTime;
        lastTime = now;
        
        if (gameEnded) {
            clearInterval(intervalId);
            return;
        }
        
        // Update multiplier based on elapsed time
        updateMultiplier(deltaTime);
        
        // Check for crash
        if (multiplier >= crashPoint) {
            crashGame();
        }
        
        // Spawn cars randomly
        if (Math.random() < 0.02) {  // 2% chance per frame to spawn a car
            spawnCar();
        }
        
        // Update cars positions
        updateCars();
    }
    
    function updateMultiplier(deltaTime) {
        // Increase multiplier slowly over time
        const baseIncrease = 0.001;
        
        multiplier += baseIncrease * (deltaTime / 50);
        
        // Update display
        currentMultiplier.textContent = multiplier.toFixed(2);
        
        // Update payout display
        if (currentPayout) {
            currentPayout.textContent = (betAmount * multiplier).toFixed(2);
        }
        
        // Move chicken automatically to the right
        moveChickenTimer += deltaTime;
        if (moveChickenTimer >= moveChickenInterval) {
            moveChickenTimer = 0;
            
            // Move chicken to the next column
            const nextCol = currentLane + 1;
            if (nextCol < maxLanes) {
                moveChicken(2, nextCol); // Always stay in middle row (2)
            }
        }
        
        // Generate more road ahead if needed
        if (currentLane >= (maxLanes - 10)) {
            maxLanes += 10;
            generateRoads();
        }
    }
    
    function generateRoads() {
        // Clear any existing roads
        clearRoads();
        
        // Create horizontal grid cells
        const cellWidth = 80;  // Width of each cell in pixels
        const roadHeight = chickenGame.offsetHeight / 5; // 5 lanes vertically
        
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < maxLanes; col++) {
                // Create a grid cell
                const cell = document.createElement('div');
                cell.className = 'road-cell';
                cell.style.top = `${row * roadHeight}px`;
                cell.style.left = `${col * cellWidth}px`;
                cell.style.width = `${cellWidth}px`;
                cell.style.height = `${roadHeight}px`;
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Add visual elements based on row/col
                if (col === 0 && row === 2) {
                    // Starting position
                    cell.classList.add('starting-cell');
                } else if (row % 2 === 1) {
                    // Road lanes
                    cell.classList.add('road');
                    
                    // Add fence between roads and sidewalk
                    if (col > 0 && col < maxLanes - 1 && Math.random() < 0.4) {
                        const fence = document.createElement('div');
                        fence.className = 'fence';
                        // Add chance for broken fence
                        if (Math.random() < 0.2) {
                            fence.classList.add('broken-fence');
                        }
                        cell.appendChild(fence);
                    }
                    
                    // Set traffic direction
                    cell.dataset.direction = row % 4 === 1 ? 'right' : 'left';
                } else {
                    // Grass/sidewalk
                    cell.classList.add('grass');
                }
                
                // Add multiplier indicators on cells
                if (col > currentLane && col <= currentLane + 5) {
                    // Calculate multiplier for this column
                    const colMultiplier = 1 + (col * 0.05);
                    
                    // Create multiplier indicator on some cells
                    if (row === 2 && Math.random() < 0.4) { // 40% chance to show multiplier
                        const multiplierIndicator = document.createElement('div');
                        multiplierIndicator.className = 'multiplier-indicator';
                        multiplierIndicator.textContent = `${colMultiplier.toFixed(2)}x`;
                        cell.appendChild(multiplierIndicator);
                        cell.dataset.multiplier = colMultiplier.toFixed(2);
                    }
                }
                
                chickenGame.appendChild(cell);
            }
        }
    }
    
    function handleCellClick(row, col) {
        if (!gameStarted || gameEnded) return;
        
        // Check if the cell is adjacent to current position
        const currentCol = parseInt(chickenCharacter.dataset.col || 2); // Default to middle
        const isSameRow = row === currentLane;
        const isAdjacentCol = Math.abs(col - currentCol) <= 1;
        const isRowAbove = row === currentLane + 1;
        
        if ((isSameRow && isAdjacentCol) || (isRowAbove && col === currentCol)) {
            // Valid move - update position
            moveChicken(row, col);
        }
    }
    
    function moveChicken(row, col) {
        // Calculate new position
        const cellWidth = 80;
        const roadHeight = chickenGame.offsetHeight / 5;
        const newLeft = col * cellWidth;
        const newTop = row * roadHeight;
        
        // Store previous position for animation
        const prevLeft = parseFloat(chickenCharacter.style.left) || 0;
        
        // Update chicken position with smooth animation
        chickenCharacter.style.transition = 'left 0.5s ease-out, top 0.5s ease-out';
        chickenCharacter.style.left = `${newLeft}px`;
        chickenCharacter.style.top = `${newTop + (roadHeight/2) - 30}px`; // Center in the row
        chickenCharacter.dataset.col = col;
        chickenCharacter.dataset.row = row;
        
        // Add running animation
        if (newLeft > prevLeft) {
            chickenCharacter.classList.add('running-right');
            chickenCharacter.classList.remove('running-left');
        } else if (newLeft < prevLeft) {
            chickenCharacter.classList.add('running-left');
            chickenCharacter.classList.remove('running-right');
        }
        
        // Remove running animation after movement completes
        setTimeout(() => {
            chickenCharacter.classList.remove('running-right', 'running-left');
            chickenCharacter.style.transition = '';
        }, 500);
        
        // Check if moving to a new column (moving right)
        if (col > currentLane) {
            // Update current lane (now using column for progression)
            currentLane = col;
            
            // Increase multiplier significantly for advancing forward
            const newMultiplier = 1 + (col * 0.05);
            multiplier = Math.max(multiplier, newMultiplier);
            
            // Check for multiplier bonus on this cell
            const cell = document.querySelector(`.road-cell[data-row="${row}"][data-col="${col}"]`);
            if (cell && cell.dataset.multiplier) {
                // Apply bonus multiplier
                multiplier = parseFloat(cell.dataset.multiplier);
                
                // Show multiplier effect with smooth animation
                const bonusEffect = document.createElement('div');
                bonusEffect.className = 'bonus-effect';
                bonusEffect.textContent = `${multiplier}x`;
                chickenGame.appendChild(bonusEffect);
                bonusEffect.style.left = `${newLeft + 40}px`;
                bonusEffect.style.top = `${newTop + 30}px`;
                
                // Add sparkle effect
                for (let i = 0; i < 5; i++) {
                    const sparkle = document.createElement('div');
                    sparkle.className = 'sparkle';
                    sparkle.style.left = `${newLeft + 40 + (Math.random() * 40 - 20)}px`;
                    sparkle.style.top = `${newTop + 30 + (Math.random() * 40 - 20)}px`;
                    sparkle.style.animationDelay = `${Math.random() * 0.5}s`;
                    chickenGame.appendChild(sparkle);
                    
                    setTimeout(() => {
                        sparkle.remove();
                    }, 1500);
                }
                
                setTimeout(() => {
                    bonusEffect.remove();
                }, 1000);
            }
            
            // Update display with animation
            currentMultiplier.classList.add('multiplier-update');
            currentMultiplier.textContent = multiplier.toFixed(2);
            
            if (currentPayout) {
                currentPayout.classList.add('payout-update');
                currentPayout.textContent = (betAmount * multiplier).toFixed(2);
            }
            
            setTimeout(() => {
                currentMultiplier.classList.remove('multiplier-update');
                if (currentPayout) {
                    currentPayout.classList.remove('payout-update');
                }
            }, 500);
        }
    }
    
    function clearRoads() {
        // Remove all road lanes
        const roads = document.querySelectorAll('.road-lane');
        roads.forEach(road => road.remove());
        
        // Clear all car intervals
        carIntervals.forEach(interval => clearInterval(interval));
        carIntervals = [];
        
        // Remove all cars
        const cars = document.querySelectorAll('.car');
        cars.forEach(car => car.remove());
    }
    
    function spawnCar() {
        // Only spawn cars on road cells that are near the chicken
        const visibleRows = [];
        for (let i = 1; i < 5; i += 2) { // Only roads have cars (odd rows)
            visibleRows.push(i);
        }
        
        if (visibleRows.length === 0) {
            return;
        }
        
        // Pick a random road row
        const randomRowIndex = Math.floor(Math.random() * visibleRows.length);
        const rowNumber = visibleRows[randomRowIndex];
        
        // Determine direction based on row number
        const direction = rowNumber % 4 === 1 ? 'right' : 'left';
        
        // Create a car
        const car = document.createElement('div');
        car.className = 'car';
        
        // Position car
        const gameHeight = chickenGame.offsetHeight;
        const roadHeight = gameHeight / 5;
        const visibleCols = [Math.max(0, currentLane - 2), currentLane + 6]; // Only show cars near chicken
        
        // Generate column position - close to chicken
        const colPosition = Math.max(0, currentLane - 1 + Math.floor(Math.random() * 7));
        
        car.style.top = `${rowNumber * roadHeight + (roadHeight / 2) - 20}px`; // Center in the lane
        
        // Randomize car power - stronger cars can break fences
        const carPower = Math.random();
        car.dataset.power = carPower.toFixed(2);
        
        if (direction === 'right') {
            car.style.left = `${colPosition * 80 - 100}px`;  // Start from left side
            car.dataset.speed = (Math.random() * 3) + 5;  // 5-8 pixels per frame
            car.dataset.direction = 'right';
        } else {
            car.style.left = `${colPosition * 80 + 100}px`;  // Start from right side
            car.classList.add('car-right');
            car.dataset.speed = -((Math.random() * 3) + 5);  // -5 to -8 pixels per frame
            car.dataset.direction = 'left';
        }
        
        car.dataset.row = rowNumber;
        car.dataset.col = colPosition;
        
        // Choose random car type with different break-through capabilities
        const carTypes = ['car', 'truck', 'police', 'monster-truck']; 
        // Weight toward regular cars
        let carTypeIndex = Math.floor(Math.random() * 10);
        if (carTypeIndex > 6) carTypeIndex = 1; // 30% trucks
        if (carTypeIndex > 8) carTypeIndex = 2; // 10% police
        if (carTypeIndex > 9) carTypeIndex = 3; // 5% monster truck (strongest)
        
        const carType = carTypes[Math.min(carTypeIndex, 3)];
        car.classList.add(carType);
        
        // Monster trucks and police cars have higher chance to break fences
        if (carType === 'monster-truck') {
            car.dataset.power = '0.9'; // 90% chance to break fence
        } else if (carType === 'police') {
            car.dataset.power = '0.7'; // 70% chance to break fence
        } else if (carType === 'truck') {
            car.dataset.power = '0.5'; // 50% chance to break fence
        }
        
        // Randomize car color if it's a normal car
        if (carType === 'car') {
            const colors = ['#f97316', '#3b82f6', '#ef4444', '#16a34a', '#8b5cf6'];
            car.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        }
        
        // Add car to the game with smooth entry animation
        car.style.opacity = '0';
        car.style.transform = 'scale(0.8)';
        chickenGame.appendChild(car);
        
        // Fade in the car
        setTimeout(() => {
            car.style.opacity = '1';
            car.style.transform = 'scale(1)';
        }, 50);
        
        debug(`Spawned ${carType} in row ${rowNumber}, direction: ${direction}, power: ${car.dataset.power}`);
    }
    
    function updateCars() {
        const cars = document.querySelectorAll('.car');
        const gameWidth = chickenGame.offsetWidth;
        
        cars.forEach(car => {
            // Move car based on speed
            const speed = parseFloat(car.dataset.speed);
            const currentLeft = car.style.left ? parseFloat(car.style.left) : 0;
            const newLeft = currentLeft + speed;
            car.style.left = `${newLeft}px`;
            
            // Check for fence collision
            checkFenceCollision(car);
            
            // Remove car if it's off screen or too far from chicken
            const carCol = parseInt(car.dataset.col || 0);
            if ((speed > 0 && newLeft > gameWidth + 100) || 
                (speed < 0 && newLeft < -200) || 
                (Math.abs(carCol - currentLane) > 10)) {
                car.classList.add('exiting');
                setTimeout(() => {
                    car.remove();
                }, 500);
            }
            
            // Check collision with chicken
            if (!gameEnded && isColliding(car, chickenCharacter)) {
                crashGame();
            }
        });
    }
    
    function checkFenceCollision(car) {
        // Get car position
        const carRect = car.getBoundingClientRect();
        const carRow = parseInt(car.dataset.row);
        const carCol = Math.floor((parseFloat(car.style.left) + 40) / 80); // Approximate column based on position
        const carPower = parseFloat(car.dataset.power || 0.3);
        
        // Find any fences in the path
        const fences = document.querySelectorAll(`.fence`);
        
        fences.forEach(fence => {
            const fenceRect = fence.getBoundingClientRect();
            
            // Check if car is about to hit fence
            if (!fence.classList.contains('broken') && 
                !(carRect.right < fenceRect.left || 
                  carRect.left > fenceRect.right || 
                  carRect.bottom < fenceRect.top || 
                  carRect.top > fenceRect.bottom)) {
                
                // Check if car can break fence based on power
                if (Math.random() < carPower) {
                    // Break the fence
                    fence.classList.add('broken');
                    
                    // Add breaking animation and sound
                    const breakEffect = document.createElement('div');
                    breakEffect.className = 'break-effect';
                    breakEffect.style.left = `${fenceRect.left + fenceRect.width/2}px`;
                    breakEffect.style.top = `${fenceRect.top + fenceRect.height/2}px`;
                    chickenGame.appendChild(breakEffect);
                    
                    setTimeout(() => {
                        breakEffect.remove();
                    }, 1000);
                    
                    // Play break sound
                    playSound('break');
                } else {
                    // Car hit fence but didn't break it
                    car.classList.add('bounce');
                    fence.classList.add('shake');
                    
                    // Slow down car
                    const currentSpeed = parseFloat(car.dataset.speed);
                    car.dataset.speed = (currentSpeed * 0.8).toString();
                    
                    setTimeout(() => {
                        car.classList.remove('bounce');
                        fence.classList.remove('shake');
                    }, 300);
                }
            }
        });
    }
    
    function isColliding(car, chicken) {
        // Get car and chicken positions
        const carRect = car.getBoundingClientRect();
        const chickenRect = chicken.getBoundingClientRect();
        
        // Use tighter collision box for more accurate collision
        const chickenCollisionMargin = 10; // Pixels to shrink the chicken hitbox
        const adjustedChickenRect = {
            left: chickenRect.left + chickenCollisionMargin,
            right: chickenRect.right - chickenCollisionMargin,
            top: chickenRect.top + chickenCollisionMargin,
            bottom: chickenRect.bottom - chickenCollisionMargin
        };
        
        // Check collision with visual effect
        const hasCollision = !(
            carRect.right < adjustedChickenRect.left || 
            carRect.left > adjustedChickenRect.right || 
            carRect.bottom < adjustedChickenRect.top || 
            carRect.top > adjustedChickenRect.bottom
        );
        
        // If colliding, add collision effect
        if (hasCollision && !car.classList.contains('colliding')) {
            car.classList.add('colliding');
            chickenCharacter.classList.add('hit');
            
            // Create crash effect
            const crashEffect = document.createElement('div');
            crashEffect.className = 'crash-effect';
            crashEffect.style.left = `${chickenRect.left + chickenRect.width/2}px`;
            crashEffect.style.top = `${chickenRect.top + chickenRect.height/2}px`;
            chickenGame.appendChild(crashEffect);
            
            setTimeout(() => {
                crashEffect.remove();
            }, 1000);
        }
        
        return hasCollision;
    }
    
    function crashGame() {
        if (gameEnded) return;
        
        debug(`Game crashed at multiplier: ${multiplier.toFixed(2)}`);
        
        // Set game ended flag
        gameEnded = true;
        
        // Show chicken getting hit animation
        chickenCharacter.classList.add('hit');
        
        // Play crash sound
        playSound('crash');
        
        // Show game over popup
        gameOverPopup.classList.add('show');
        
        // Update stats (loss)
        updateStats(false, -betAmount);
        
        // Add to history
        addToHistory(false);
    }
    
    function cashOut() {
        if (gameEnded || !gameStarted) return;
        
        // Calculate winnings
        const winnings = Math.floor(betAmount * multiplier);
        
        debug(`Cashed out at multiplier: ${multiplier.toFixed(2)}, winnings: ${winnings}`);
        
        // Set game ended flag
        gameEnded = true;
        
        // Add win amount to balance
        updateBalance(winnings);
        
        // Show win popup
        if (winAmount) {
            winAmount.textContent = winnings.toFixed(2);
        }
        winPopup.classList.add('show');
        
        // Play win sound
        playSound('win');
        
        // Update stats (win)
        updateStats(true, winnings - betAmount);
        
        // Add to history
        addToHistory(true);
        
        // Clear game intervals
        clearInterval(intervalId);
    }
    
    function addToHistory(isWin) {
        // Get history table body
        const historyTable = document.getElementById('historyTableBody');
        if (!historyTable) return;
        
        // Create a new row
        const row = document.createElement('tr');
        
        // Generate random game ID
        const gameId = Math.floor(Math.random() * 1000000);
        
        // Format current time
        const now = new Date();
        const timeFormatted = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // Calculate payout
        const payout = isWin ? Math.floor(betAmount * multiplier) : 0;
        
        // Set row HTML
        row.innerHTML = `
            <td>#${gameId}</td>
            <td>${timeFormatted}</td>
            <td>${betAmount}</td>
            <td style="color: ${isWin ? '#16a34a' : '#dc2626'}">
                ${multiplier.toFixed(2)}x
            </td>
            <td style="color: ${isWin ? '#16a34a' : '#dc2626'}">
                ${isWin ? '+' : '-'}${isWin ? payout : betAmount}
            </td>
        `;
        
        // Add row to table
        historyTable.prepend(row);
        
        // Limit to 10 rows
        while (historyTable.children.length > 10) {
            historyTable.removeChild(historyTable.lastChild);
        }
    }
    
    function resetGame() {
        // Reset game state
        gameStarted = false;
        gameEnded = false;
        currentLane = 0;
        multiplier = 1.0;
        
        // Clear intervals
        clearInterval(intervalId);
        clearRoads();
        
        // Reset chicken position and animation
        chickenCharacter.style.bottom = '20px';
        chickenCharacter.classList.remove('hit', 'jumping');
        
        // Update UI
        chickenContainer.classList.add('game-not-started');
        chickenContainer.classList.remove('game-started');
        
        // Reset multiplier display
        currentMultiplier.textContent = '1.00';
        
        // Hide game playing elements and show setup elements
        gamePlayingElements.forEach(el => {
            el.style.display = 'none';
        });
        
        gameSetupElements.forEach(el => {
            el.style.display = 'flex';
        });
        
        // Update stats display
        updateGameStats();
        
        debug("Game reset");
    }
    
    function hidePopups() {
        // Hide any visible popups
        gameOverPopup.classList.remove('show');
        winPopup.classList.remove('show');
    }
    
    function generateCrashPoint(difficulty = 'medium') {
        // Generate a random crash point based on house edge and difficulty
        let houseEdge = 0.05;  // Base 5% house edge
        let distributionFactor = 0.6; // Controls how steep the exponential curve is
        let minCrash = 1.1;  // Base minimum crash point
        let maxCrash = 30;  // Base maximum crash point
        
        // Adjust parameters based on difficulty
        switch(difficulty) {
            case 'easy':
                houseEdge = 0.03;  // Lower house edge
                minCrash = 1.2;    // Higher minimum
                maxCrash = 50;     // Higher maximum
                distributionFactor = 0.4; // Flatter curve (more high values)
                break;
            case 'medium':
                // Default values
                break;
            case 'hard':
                houseEdge = 0.07;  // Higher house edge
                minCrash = 1.05;   // Lower minimum
                maxCrash = 20;     // Lower maximum
                distributionFactor = 0.8; // Steeper curve (more low values)
                break;
            case 'extreme':
                houseEdge = 0.1;   // Highest house edge
                minCrash = 1.01;   // Lowest minimum
                maxCrash = 15;     // Lowest maximum
                distributionFactor = 1.0; // Steepest curve (many low values)
                break;
        }
        
        const randomValue = Math.random();
        
        // Use an exponential distribution (higher values are exponentially less likely)
        crashPoint = minCrash + (-Math.log(1 - randomValue) / distributionFactor);
        
        // Apply house edge
        crashPoint = crashPoint * (1 - houseEdge);
        
        // Cap maximum crash point
        crashPoint = Math.min(crashPoint, maxCrash);
        
        debug(`Generated crash point: ${crashPoint.toFixed(2)} for difficulty: ${difficulty}`);
        
        return crashPoint;
    }
    
    function updateGameDisplay() {
        // Update bet amount display
        if (currentBet) {
            currentBet.textContent = betAmount.toFixed(2);
        }
        
        // Reset multiplier display
        if (currentMultiplier) {
            currentMultiplier.textContent = '1.00';
        }
        
        // Set initial payout display
        if (currentPayout) {
            currentPayout.textContent = betAmount.toFixed(2);
        }
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
        localStorage.setItem('chickenGameStats', JSON.stringify(stats));
    }
    
    function getGameStats() {
        // Get game stats from localStorage or use defaults
        const defaultStats = {
            gamesPlayed: 0,
            gamesWon: 0,
            totalProfit: 0
        };
        
        try {
            const savedStats = localStorage.getItem('chickenGameStats');
            return savedStats ? JSON.parse(savedStats) : defaultStats;
        } catch (e) {
            return defaultStats;
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
            window.BetaAuth.updateBalance(amount, 'Chicken Crossroad Game');
            
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
    
    function showMessage(message) {
        alert(message);
    }
    
    function playSound(soundType) {
        // Play sound effect (placeholder)
        debug(`Playing ${soundType} sound`);
    }
}); 