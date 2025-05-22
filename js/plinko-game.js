// BetaGames Plinko Game Implementation
document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const canvas = document.getElementById('plinkoCanvas');
    const ctx = canvas.getContext('2d');
    const betAmountInput = document.getElementById('betAmount');
    const riskLevelSelect = document.getElementById('riskLevel');
    const rowsCountSelect = document.getElementById('rowsCount');
    const playButton = document.getElementById('playButton');
    const autoPlayButton = document.getElementById('autoPlayButton');
    const autoBetCountInput = document.getElementById('autoBetCount');
    const manualTab = document.getElementById('manualTab');
    const autoTab = document.getElementById('autoTab');
    const manualBetPanel = document.getElementById('manualBetPanel');
    const autoBetPanel = document.getElementById('autoBetPanel');
    const resultPopup = document.getElementById('resultPopup');
    const resultAmount = document.getElementById('resultAmount');
    const multiplierContainer = document.getElementById('multiplierContainer');
    const gameHistoryBody = document.getElementById('gameHistoryBody');
    
    // Game state
    let gameState = {
        isPlaying: false,
        autoPlayInterval: null,
        autoPlayCount: 0,
        maxAutoPlays: 0,
        gameHistory: [],
        ballsInPlay: [],
        pins: [],
        multipliers: [],
        pinRadius: 4,
        ballRadius: 10,
        gravity: 0.2,
        friction: 0.8,
        elasticity: 0.6
    };
    
    // Multiplier definitions for different risk levels
    const multiplierSets = {
        low: [0.5, 0.8, 1.0, 1.2, 1.5, 1.7, 2.0, 3.0, 5.0, 0.5, 0.8, 1.0, 1.2, 1.5, 1.7, 2.0],
        medium: [0.3, 0.5, 0.8, 1.0, 1.5, 2.0, 3.0, 5.0, 10.0, 0.3, 0.5, 0.8, 1.0, 1.5, 2.0, 3.0],
        high: [0.2, 0.3, 0.5, 0.8, 1.0, 2.0, 3.0, 5.0, 10.0, 20.0, 0.2, 0.3, 0.5, 0.8, 1.0, 2.0]
    };
    
    // Initialize the game
    initGame();
    
    function initGame() {
        // Setup canvas size
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Setup event listeners
        playButton.addEventListener('click', handlePlay);
        autoPlayButton.addEventListener('click', handleAutoPlay);
        manualTab.addEventListener('click', () => switchBetMode('manual'));
        autoTab.addEventListener('click', () => switchBetMode('auto'));
        
        // Setup bet amount shortcuts
        setupBetShortcuts();
        
        // Initialize peg positions based on rows
        initGameBoard();
        
        // Draw initial state
        draw();
        
        // Load game history with some sample data
        loadGameHistory();
    }
    
    function resizeCanvas() {
        const boardDiv = document.querySelector('.plinko-board');
        canvas.width = boardDiv.clientWidth;
        canvas.height = boardDiv.clientHeight;
        
        // Reinitialize game board when canvas size changes
        if (gameState.pins.length > 0) {
            initGameBoard();
        }
    }
    
    function switchBetMode(mode) {
        if (mode === 'manual') {
            manualTab.classList.add('active');
            autoTab.classList.remove('active');
            manualBetPanel.style.display = 'block';
            autoBetPanel.style.display = 'none';
        } else {
            autoTab.classList.add('active');
            manualTab.classList.remove('active');
            autoBetPanel.style.display = 'block';
            manualBetPanel.style.display = 'none';
        }
    }
    
    function setupBetShortcuts() {
        const shortcuts = document.querySelectorAll('.bet-shortcut');
        shortcuts.forEach(shortcut => {
            shortcut.addEventListener('click', () => {
                const value = shortcut.dataset.value;
                const currentUser = window.BetaAuth?.getCurrentUser();
                
                if (value === 'max' && currentUser) {
                    betAmountInput.value = currentUser.balance || 100;
                } else if (value === '½') {
                    betAmountInput.value = (parseFloat(betAmountInput.value) / 2).toFixed(2);
                } else {
                    betAmountInput.value = value;
                }
            });
        });
    }
    
    function initGameBoard() {
        const rowCount = parseInt(rowsCountSelect.value);
        gameState.pins = [];
        gameState.multipliers = [];
        
        // Calculate pin spacing
        const boardWidth = canvas.width;
        const boardHeight = canvas.height;
        const horizontalPadding = 50;
        const verticalPadding = 80;
        const availableWidth = boardWidth - (horizontalPadding * 2);
        const availableHeight = boardHeight - (verticalPadding * 2) - 50; // Extra space for buckets
        
        const pinSpacing = Math.min(availableWidth / rowCount, availableHeight / rowCount);
        
        // Create pins in triangular pattern
        for (let row = 0; row < rowCount; row++) {
            const pinsInRow = row + 1;
            const rowWidth = pinsInRow * pinSpacing;
            const startX = (boardWidth - rowWidth) / 2 + pinSpacing / 2;
            
            for (let pin = 0; pin < pinsInRow; pin++) {
                const x = startX + pin * pinSpacing;
                const y = verticalPadding + row * pinSpacing;
                
                gameState.pins.push({ x, y, radius: gameState.pinRadius });
            }
        }
        
        // Create multiplier buckets
        createMultiplierBuckets();
    }
    
    function createMultiplierBuckets() {
        const riskLevel = riskLevelSelect.value;
        const multipliers = multiplierSets[riskLevel];
        const bucketCount = multipliers.length;
        
        // Clear existing buckets
        multiplierContainer.innerHTML = '';
        gameState.multipliers = [];
        
        // Calculate bucket positions
        const boardWidth = canvas.width;
        const boardHeight = canvas.height;
        const horizontalPadding = 20;
        const bucketWidth = (boardWidth - (horizontalPadding * 2)) / bucketCount;
        
        for (let i = 0; i < bucketCount; i++) {
            const multiplier = multipliers[i];
            const x = horizontalPadding + (i * bucketWidth) + bucketWidth / 2;
            const y = boardHeight - 30;
            
            // Create visual bucket
            const bucketElement = document.createElement('div');
            bucketElement.className = 'multiplier-bucket';
            bucketElement.textContent = `${multiplier}x`;
            bucketElement.dataset.value = multiplier;
            bucketElement.style.width = `${bucketWidth - 4}px`;
            multiplierContainer.appendChild(bucketElement);
            
            // Add to game state
            gameState.multipliers.push({
                value: multiplier,
                x,
                y,
                width: bucketWidth
            });
        }
        
        // Color the buckets based on multiplier values
        colorMultiplierBuckets();
    }
    
    function colorMultiplierBuckets() {
        const buckets = document.querySelectorAll('.multiplier-bucket');
        
        buckets.forEach(bucket => {
            const value = parseFloat(bucket.dataset.value);
            
            if (value < 1.0) {
                bucket.style.backgroundColor = 'rgba(255, 68, 68, 0.7)'; // Red
                bucket.style.color = '#fff';
            } else if (value >= 1.0 && value < 2.0) {
                bucket.style.backgroundColor = 'rgba(255, 193, 7, 0.7)'; // Yellow
                bucket.style.color = '#000';
            } else {
                bucket.style.backgroundColor = 'rgba(24, 231, 124, 0.7)'; // Green
                bucket.style.color = '#000';
            }
        });
    }
    
    function handlePlay() {
        if (gameState.isPlaying) return;
        
        // Validate user is logged in
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (!currentUser) {
            alert('Please login to play!');
            return;
        }
        
        // Get bet amount
        const betAmount = parseFloat(betAmountInput.value);
        
        // Validate bet amount
        if (isNaN(betAmount) || betAmount <= 0) {
            alert('Please enter a valid bet amount.');
            return;
        }
        
        if (betAmount > currentUser.balance) {
            alert('Not enough coins in your balance.');
            return;
        }
        
        // Update game state
        gameState.isPlaying = true;
        
        // Disable play button during game
        playButton.disabled = true;
        
        // Drop the ball
        dropBall(betAmount);
    }
    
    function handleAutoPlay() {
        if (gameState.isPlaying || gameState.autoPlayInterval) return;
        
        // Validate user is logged in
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (!currentUser) {
            alert('Please login to play!');
            return;
        }
        
        // Get auto play settings
        const betAmount = parseFloat(betAmountInput.value);
        const autoBetCount = parseInt(autoBetCountInput.value);
        
        // Validate settings
        if (isNaN(betAmount) || betAmount <= 0) {
            alert('Please enter a valid bet amount.');
            return;
        }
        
        if (isNaN(autoBetCount) || autoBetCount <= 0) {
            alert('Please enter a valid number of bets.');
            return;
        }
        
        if (betAmount * autoBetCount > currentUser.balance) {
            alert('Not enough coins in your balance for all auto bets.');
            return;
        }
        
        // Update game state
        gameState.autoPlayCount = 0;
        gameState.maxAutoPlays = autoBetCount;
        
        // Disable buttons during auto play
        autoPlayButton.disabled = true;
        
        // Start auto play
        gameState.autoPlayInterval = setInterval(() => {
            if (gameState.isPlaying) return;
            
            if (gameState.autoPlayCount >= gameState.maxAutoPlays) {
                clearInterval(gameState.autoPlayInterval);
                gameState.autoPlayInterval = null;
                autoPlayButton.disabled = false;
                return;
            }
            
            gameState.autoPlayCount++;
            dropBall(betAmount);
        }, 2000);
    }
    
    function dropBall(betAmount) {
        // Create a new ball at the top center of the board
        const ball = {
            x: canvas.width / 2,
            y: 30,
            radius: gameState.ballRadius,
            vx: 0,
            vy: 0,
            betAmount,
            done: false,
            multiplier: null
        };
        
        // Add some random horizontal velocity
        ball.vx = (Math.random() - 0.5) * 2;
        
        // Add ball to game state
        gameState.ballsInPlay.push(ball);
        
        // Start animation loop if not already running
        if (!gameState.animationFrame) {
            gameState.animationFrame = requestAnimationFrame(update);
        }
    }
    
    function update() {
        // Update ball positions
        updateBalls();
        
        // Draw current state
        draw();
        
        // Continue animation if needed
        if (gameState.ballsInPlay.length > 0) {
            gameState.animationFrame = requestAnimationFrame(update);
        } else {
            gameState.animationFrame = null;
            gameState.isPlaying = false;
            playButton.disabled = false;
        }
    }
    
    function updateBalls() {
        for (let i = 0; i < gameState.ballsInPlay.length; i++) {
            const ball = gameState.ballsInPlay[i];
            
            if (ball.done) continue;
            
            // Apply gravity
            ball.vy += gameState.gravity;
            
            // Update position
            ball.x += ball.vx;
            ball.y += ball.vy;
            
            // Check for collisions with pins
            for (const pin of gameState.pins) {
                const dx = ball.x - pin.x;
                const dy = ball.y - pin.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Collision detected
                if (distance < ball.radius + pin.radius) {
                    // Calculate collision normal
                    const nx = dx / distance;
                    const ny = dy / distance;
                    
                    // Calculate relative velocity
                    const relativeVelocity = ball.vx * nx + ball.vy * ny;
                    
                    // Apply impulse
                    const impulse = 2 * relativeVelocity * gameState.elasticity;
                    ball.vx -= impulse * nx;
                    ball.vy -= impulse * ny;
                    
                    // Apply friction
                    ball.vx *= gameState.friction;
                    
                    // Move ball out of collision
                    const overlap = ball.radius + pin.radius - distance;
                    ball.x += overlap * nx;
                    ball.y += overlap * ny;
                }
            }
            
            // Check for wall collisions
            if (ball.x - ball.radius < 0) {
                ball.x = ball.radius;
                ball.vx = -ball.vx * gameState.friction;
            } else if (ball.x + ball.radius > canvas.width) {
                ball.x = canvas.width - ball.radius;
                ball.vx = -ball.vx * gameState.friction;
            }
            
            // Check for multiplier bucket collisions
            if (ball.y > canvas.height - 50) {
                for (const multiplier of gameState.multipliers) {
                    const leftEdge = multiplier.x - multiplier.width / 2;
                    const rightEdge = multiplier.x + multiplier.width / 2;
                    
                    if (ball.x >= leftEdge && ball.x <= rightEdge) {
                        ball.multiplier = multiplier.value;
                        ball.done = true;
                        
                        // Calculate payout
                        const payout = ball.betAmount * ball.multiplier;
                        
                        // Update balance
                        const profit = payout - ball.betAmount;
                        if (window.BetaAuth) {
                            window.BetaAuth.updateBalance(profit, 'Plinko Game');
                        }
                        
                        // Show result popup
                        showResult(profit);
                        
                        // Add to game history
                        addToHistory(ball.betAmount, riskLevelSelect.value, ball.multiplier, profit);
                        
                        break;
                    }
                }
            }
            
            // Remove ball if it falls off the bottom
            if (ball.y > canvas.height + 50) {
                ball.done = true;
            }
        }
        
        // Remove completed balls
        gameState.ballsInPlay = gameState.ballsInPlay.filter(ball => !ball.done);
    }
    
    function draw() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw pins
        drawPins();
        
        // Draw balls
        drawBalls();
        
        // Draw multiplier slots
        drawMultiplierSlots();
    }
    
    function drawPins() {
        ctx.fillStyle = '#FFFFFF';
        
        for (const pin of gameState.pins) {
            ctx.beginPath();
            ctx.arc(pin.x, pin.y, pin.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    function drawBalls() {
        for (const ball of gameState.ballsInPlay) {
            // Ball gradient
            const gradient = ctx.createRadialGradient(
                ball.x - ball.radius * 0.3,
                ball.y - ball.radius * 0.3,
                0,
                ball.x,
                ball.y,
                ball.radius
            );
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(1, '#18E77C');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Ball highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(
                ball.x - ball.radius * 0.3,
                ball.y - ball.radius * 0.3,
                ball.radius * 0.3,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }
    
    function drawMultiplierSlots() {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        
        for (const multiplier of gameState.multipliers) {
            const left = multiplier.x - multiplier.width / 2;
            const right = multiplier.x + multiplier.width / 2;
            
            // Draw divider lines
            ctx.beginPath();
            ctx.moveTo(left, canvas.height - 50);
            ctx.lineTo(left, canvas.height);
            ctx.stroke();
            
            if (multiplier === gameState.multipliers[gameState.multipliers.length - 1]) {
                ctx.beginPath();
                ctx.moveTo(right, canvas.height - 50);
                ctx.lineTo(right, canvas.height);
                ctx.stroke();
            }
        }
    }
    
    function showResult(profit) {
        resultAmount.textContent = (profit >= 0 ? '+' : '') + profit.toFixed(2);
        resultAmount.className = 'result-amount ' + (profit >= 0 ? 'win' : 'loss');
        
        resultPopup.classList.add('show');
        
        setTimeout(() => {
            resultPopup.classList.remove('show');
        }, 2000);
    }
    
    function addToHistory(betAmount, risk, multiplier, profit) {
        const currentUser = window.BetaAuth?.getCurrentUser();
        const username = currentUser ? currentUser.username : 'Guest';
        
        const historyItem = {
            user: username,
            betAmount,
            risk,
            multiplier,
            payout: profit,
            time: new Date()
        };
        
        // Add to local history
        gameState.gameHistory.unshift(historyItem);
        
        // Keep history at a reasonable size
        if (gameState.gameHistory.length > 20) {
            gameState.gameHistory.pop();
        }
        
        // Update history table
        updateHistoryTable();
        
        // Track in main system if available
        if (window.BetaGames?.trackGameBet) {
            window.BetaGames.trackGameBet('Plinko', betAmount, profit);
        }
    }
    
    function updateHistoryTable() {
        gameHistoryBody.innerHTML = '';
        
        for (const item of gameState.gameHistory) {
            const row = document.createElement('tr');
            
            // User cell
            const userCell = document.createElement('td');
            userCell.textContent = item.user;
            
            // Bet amount cell
            const betCell = document.createElement('td');
            betCell.textContent = item.betAmount.toFixed(2);
            
            // Risk cell
            const riskCell = document.createElement('td');
            riskCell.textContent = item.risk.charAt(0).toUpperCase() + item.risk.slice(1);
            
            // Multiplier cell
            const multiplierCell = document.createElement('td');
            multiplierCell.textContent = item.multiplier + 'x';
            
            // Payout cell
            const payoutCell = document.createElement('td');
            payoutCell.textContent = (item.payout >= 0 ? '+' : '') + item.payout.toFixed(2);
            payoutCell.className = item.payout >= 0 ? 'win' : 'loss';
            
            // Time cell
            const timeCell = document.createElement('td');
            timeCell.textContent = formatTime(item.time);
            
            // Add cells to row
            row.appendChild(userCell);
            row.appendChild(betCell);
            row.appendChild(riskCell);
            row.appendChild(multiplierCell);
            row.appendChild(payoutCell);
            row.appendChild(timeCell);
            
            // Add row to table
            gameHistoryBody.appendChild(row);
        }
    }
    
    // Format time as relative string (e.g., "2m ago")
    function formatTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        
        if (diffSec < 60) {
            return 'just now';
        } else if (diffMin < 60) {
            return `${diffMin}m ago`;
        } else {
            return `${diffHour}h ago`;
        }
    }
    
    // Load initial game history with sample data
    function loadGameHistory() {
        const riskLevels = ['low', 'medium', 'high'];
        const usernames = ['Player123', 'LuckyGuy', 'BigWinner', 'CasinoKing', 'PlinkoMaster'];
        
        // Get current user if available
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (currentUser) {
            usernames.push(currentUser.username);
        }
        
        // Generate random history
        for (let i = 0; i < 10; i++) {
            const username = usernames[Math.floor(Math.random() * usernames.length)];
            const betAmount = Math.random() * 100 + 10;
            const risk = riskLevels[Math.floor(Math.random() * riskLevels.length)];
            const multiplier = multiplierSets[risk][Math.floor(Math.random() * multiplierSets[risk].length)];
            const payout = betAmount * multiplier - betAmount;
            
            gameState.gameHistory.push({
                user: username,
                betAmount,
                risk,
                multiplier,
                payout,
                time: new Date(Date.now() - Math.random() * 3600000)
            });
        }
        
        // Sort by time (most recent first)
        gameState.gameHistory.sort((a, b) => b.time - a.time);
        
        // Update history table
        updateHistoryTable();
    }
    
    // Event listener for risk level changes
    riskLevelSelect.addEventListener('change', () => {
        createMultiplierBuckets();
    });
    
    // Event listener for rows count changes
    rowsCountSelect.addEventListener('change', () => {
        initGameBoard();
        draw();
    });
}); 