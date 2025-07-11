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
    const plinkoBoard = document.querySelector('.plinko-board');
    const maintenanceOverlay = document.getElementById('maintenanceOverlay');
    const adminPasswordInput = document.getElementById('adminPassword');
    const adminAccessBtn = document.getElementById('adminAccessBtn');
    
    // Admin password
    const ADMIN_PASSWORD = "howlgowl";
    
    // Check if in maintenance mode
    let maintenanceMode = false;
    
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
        ballRadius: 6,
        gravity: 0.12,
        friction: 0.9,
        elasticity: 0.65,
        glowIntensity: 0.6,
        pinGlowColors: ['#FFFFFF'],
        activePin: null,
        activePinTimeout: null,
        rapidFireMode: false,
        rapidFireCount: 0,
        maxBalls: 15,
        dropDelay: 100,
        shiftKeyDown: false
    };
    
    // Multiplier definitions with exact colors from the reference image
    const multiplierSets = {
        low: [
            {value: 50, color: '#FF0000'},  // Red
            {value: 20, color: '#FF4500'},  // Orange Red
            {value: 10, color: '#FFA500'},   // Orange
            {value: 5, color: '#FFFF00'},   // Yellow
            {value: 2, color: '#90EE90'}, // Light Green
            {value: 1.5, color: '#90EE90'}, // Light Green
            {value: 1, color: '#90EE90'}, // Light Green
            {value: 0.5, color: '#FF6347'}, // Tomato
            {value: 0.3, color: '#FF6347'}, // Tomato
            {value: 0.2, color: '#FF6347'}, // Tomato
            {value: 0.2, color: '#FF6347'}, // Tomato
            {value: 0.3, color: '#FF6347'}, // Tomato
            {value: 0.5, color: '#FF6347'}, // Tomato
            {value: 1, color: '#90EE90'}, // Light Green
            {value: 1.5, color: '#90EE90'}, // Light Green
            {value: 2, color: '#90EE90'}, // Light Green
            {value: 5, color: '#FFFF00'},   // Yellow
            {value: 10, color: '#FFA500'},  // Orange
            {value: 20, color: '#FF4500'},  // Orange Red
            {value: 50, color: '#FF0000'}   // Red
        ],
        medium: [
            {value: 50, color: '#FF0000'},  // Red
            {value: 20, color: '#FF4500'},  // Orange Red
            {value: 10, color: '#FFA500'},  // Orange
            {value: 5, color: '#FFFF00'},   // Yellow
            {value: 2, color: '#90EE90'},   // Light Green
            {value: 1.5, color: '#90EE90'}, // Light Green
            {value: 1, color: '#90EE90'},   // Light Green
            {value: 0.5, color: '#FF6347'}, // Tomato
            {value: 0.3, color: '#FF6347'}, // Tomato
            {value: 0.2, color: '#FF6347'}, // Tomato
            {value: 0.2, color: '#FF6347'}, // Tomato
            {value: 0.3, color: '#FF6347'}, // Tomato
            {value: 0.5, color: '#FF6347'}, // Tomato
            {value: 1, color: '#90EE90'},   // Light Green
            {value: 1.5, color: '#90EE90'}, // Light Green
            {value: 2, color: '#90EE90'},   // Light Green
            {value: 5, color: '#FFFF00'},   // Yellow
            {value: 10, color: '#FFA500'},  // Orange
            {value: 20, color: '#FF4500'},  // Orange Red
            {value: 50, color: '#FF0000'}   // Red
        ],
        high: [
            {value: 100, color: '#FF0000'}, // Red
            {value: 50, color: '#FF4500'},  // Orange Red
            {value: 20, color: '#FFA500'},  // Orange
            {value: 10, color: '#FFFF00'},  // Yellow
            {value: 5, color: '#90EE90'},   // Light Green
            {value: 2, color: '#90EE90'},   // Light Green
            {value: 1, color: '#90EE90'},   // Light Green
            {value: 0.5, color: '#FF6347'}, // Tomato
            {value: 0.3, color: '#FF6347'}, // Tomato
            {value: 0.2, color: '#FF6347'}, // Tomato
            {value: 0.1, color: '#FF6347'}, // Tomato
            {value: 0.1, color: '#FF6347'}, // Tomato
            {value: 0.2, color: '#FF6347'}, // Tomato
            {value: 0.3, color: '#FF6347'}, // Tomato
            {value: 0.5, color: '#FF6347'}, // Tomato
            {value: 1, color: '#90EE90'},   // Light Green
            {value: 2, color: '#90EE90'},   // Light Green
            {value: 5, color: '#90EE90'},   // Light Green
            {value: 10, color: '#FFFF00'},  // Yellow
            {value: 20, color: '#FFA500'},  // Orange
            {value: 50, color: '#FF4500'},  // Orange Red
            {value: 100, color: '#FF0000'}  // Red
        ]
    };
    
    // Check maintenance mode from Supabase
    async function checkMaintenanceMode() {
        if (!window.SupabaseDB) {
            console.error('Supabase not configured');
            return false;
        }
        
        try {
            const { data, error } = await window.SupabaseDB
                .from('settings')
                .select('value')
                .eq('key', 'maintenance_mode')
                .single();
                
            if (error) {
                console.error('Error checking maintenance mode:', error);
                return false;
            }
            
            // Check if plinko should be in maintenance mode
            const { data: plinkoSetting, error: plinkoError } = await window.SupabaseDB
                .from('settings')
                .select('value')
                .eq('key', 'plinko')
                .single();
                
            if (plinkoError && plinkoError.code !== 'PGRST116') {
                console.error('Error checking plinko setting:', plinkoError);
                return false;
            }
            
            // Game is in maintenance if general maintenance is on OR plinko-specific setting is "off"
            const generalMaintenance = data && data.value === 'on';
            const plinkoMaintenance = plinkoSetting && plinkoSetting.value === 'off';
            
            return generalMaintenance || plinkoMaintenance;
        } catch (error) {
            console.error('Error checking maintenance mode:', error);
            return false;
        }
    }
    
    // Initialize the game
    async function initGame() {
        // Check if in maintenance mode
        maintenanceMode = await checkMaintenanceMode();
        
        if (maintenanceMode) {
            // Show maintenance overlay
            if (maintenanceOverlay) {
                maintenanceOverlay.style.display = 'flex';
            }
            
            // Admin access button event
            if (adminAccessBtn) {
                adminAccessBtn.addEventListener('click', () => {
                    const password = adminPasswordInput.value;
                    if (password === ADMIN_PASSWORD) {
                        maintenanceOverlay.style.display = 'none';
                        maintenanceMode = false;
                        setupGame();
                    } else {
                        adminPasswordInput.value = '';
                        adminPasswordInput.placeholder = 'Incorrect password';
                        adminPasswordInput.style.borderColor = 'red';
                        setTimeout(() => {
                            adminPasswordInput.placeholder = '';
                            adminPasswordInput.style.borderColor = '';
                        }, 2000);
                    }
                });
            }
        } else {
            // Hide maintenance overlay
            if (maintenanceOverlay) {
                maintenanceOverlay.style.display = 'none';
            }
            
            // Setup the game
            setupGame();
        }
    }
    
    // Setup the game (only run when not in maintenance mode or after admin login)
    function setupGame() {
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
        
        // Start ambient animation
        animatePins();
        
        // Load real game history from Supabase
        loadGameHistory();
    }
    
    function resizeCanvas() {
        if (plinkoBoard) {
            const containerWidth = plinkoBoard.clientWidth;
            const containerHeight = plinkoBoard.clientHeight;
            
            // Make canvas slightly smaller than container for padding
            canvas.width = containerWidth * 0.95;
            canvas.height = containerHeight * 0.9;
            
            // Center the canvas in the container
            canvas.style.position = 'absolute';
            canvas.style.left = `${(containerWidth - canvas.width) / 2}px`;
            canvas.style.top = `${(containerHeight - canvas.height) / 10}px`;
            
            // Adjust multiplier container
            if (multiplierContainer) {
                multiplierContainer.style.width = `${canvas.width}px`;
                multiplierContainer.style.left = `${(containerWidth - canvas.width) / 2}px`;
                multiplierContainer.style.bottom = '0';
                multiplierContainer.style.padding = '0';
                multiplierContainer.style.margin = '0';
                multiplierContainer.style.boxSizing = 'border-box';
                multiplierContainer.style.position = 'absolute';
            }
        }
        
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
        const rowCount = parseInt(rowsCountSelect.value) || 16;
        gameState.pins = [];
        gameState.multipliers = [];
        
        // Calculate available space
        const boardWidth = canvas.width;
        const boardHeight = canvas.height;
        const multiplierHeight = 60;
        const topPadding = 40;
        const availableHeight = boardHeight - topPadding - multiplierHeight;
        
        // Get the current risk level to determine bucket count
        const riskLevel = riskLevelSelect.value;
        const bucketCount = multiplierSets[riskLevel].length;
        
        // Create a perfect triangle of pins that aligns with multiplier buckets
        const horizontalSpacing = boardWidth / (bucketCount - 1);
        const verticalSpacing = availableHeight / (rowCount + 1);
        
        // Create pins in triangular pattern
        for (let row = 0; row < rowCount; row++) {
            const pinsInThisRow = row + 1;
            const rowWidth = pinsInThisRow * horizontalSpacing;
            const startX = (boardWidth - rowWidth) / 2 + horizontalSpacing / 2;
            
            for (let i = 0; i < pinsInThisRow; i++) {
                const x = startX + i * horizontalSpacing;
                const y = topPadding + (row + 1) * verticalSpacing;
                
                gameState.pins.push({
                    x,
                    y,
                    radius: gameState.pinRadius,
                    glowColor: gameState.pinGlowColors[0],
                    glowSize: 0,
                    animationSpeed: 0.01 + Math.random() * 0.02
                });
            }
        }
        
        // Create multiplier buckets
        createMultiplierBuckets();
    }
    
    function createMultiplierBuckets() {
        const riskLevel = riskLevelSelect.value;
        const multipliers = multiplierSets[riskLevel];
        
        // Clear existing buckets
        multiplierContainer.innerHTML = '';
        gameState.multipliers = [];
        
        // Calculate bucket positions
        const boardWidth = canvas.width;
        const boardHeight = canvas.height;
        const bucketHeight = 60;
        const bucketCount = multipliers.length;
        const bucketWidth = boardWidth / bucketCount;
        
        // Force multiplier container to exact canvas width
        multiplierContainer.style.width = `${boardWidth}px`;
        
        for (let i = 0; i < bucketCount; i++) {
            const multiplierData = multipliers[i];
            const x = i * bucketWidth + bucketWidth / 2;
            const y = boardHeight - bucketHeight / 2;
            
            // Create visual bucket
            const bucketElement = document.createElement('div');
            bucketElement.className = 'multiplier-bucket';
            bucketElement.textContent = `${multiplierData.value}x`;
            bucketElement.dataset.value = multiplierData.value;
            bucketElement.style.width = `${bucketWidth}px`;
            bucketElement.style.backgroundColor = multiplierData.color;
            bucketElement.style.color = getContrastColor(multiplierData.color);
            bucketElement.style.margin = '0';
            bucketElement.style.padding = '0';
            bucketElement.style.boxSizing = 'border-box';
            multiplierContainer.appendChild(bucketElement);
            
            // Add to game state
            gameState.multipliers.push({
                value: multiplierData.value,
                color: multiplierData.color,
                x,
                y,
                width: bucketWidth,
                height: bucketHeight,
                element: bucketElement,
                isActive: false,
                activeTime: 0
            });
        }
    }
    
    // Determine if text should be white or black based on background color brightness
    function getContrastColor(hexColor) {
        // Convert hex to RGB
        let r = parseInt(hexColor.substring(1, 3), 16);
        let g = parseInt(hexColor.substring(3, 5), 16);
        let b = parseInt(hexColor.substring(5, 7), 16);
        
        // Calculate brightness (0-255)
        let brightness = (r * 299 + g * 587 + b * 114) / 1000;
        
        // Return white for dark backgrounds, black for light backgrounds
        return brightness > 128 ? '#000000' : '#FFFFFF';
    }
    
    function handlePlay() {
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
        
        // Add drop animation to the play button
        playButton.classList.add('drop-animation');
        setTimeout(() => {
            playButton.classList.remove('drop-animation');
        }, 500);
        
        // If we're in rapid fire mode, increment count and return if still active
        if (gameState.rapidFireMode) {
            gameState.rapidFireCount++;
            if (gameState.rapidFireCount > 20) { // Limit to 20 balls per session
                gameState.rapidFireMode = false;
                gameState.rapidFireCount = 0;
                playButton.textContent = "PLAY";
                playButton.classList.remove('active-rapid-fire');
            }
            return;
        }
        
        // Check if shift key is being held - if so, activate rapid fire mode
        if (gameState.shiftKeyDown) {
            gameState.rapidFireMode = true;
            gameState.rapidFireCount = 1;
            playButton.textContent = "DROPPING...";
            playButton.classList.add('active-rapid-fire');
            
            // Start rapid fire sequence
            const rapidFireSequence = () => {
                // Stop if we've exited rapid fire mode
                if (!gameState.rapidFireMode) return;
                
                // Check if we can still afford to drop balls
                if (currentUser.balance < betAmount) {
                    gameState.rapidFireMode = false;
                    gameState.rapidFireCount = 0;
                    playButton.textContent = "PLAY";
                    playButton.classList.remove('active-rapid-fire');
                    return;
                }
                
                // Check if we have too many balls already
                if (gameState.ballsInPlay.length >= gameState.maxBalls) {
                    // Wait and try again
                    setTimeout(rapidFireSequence, gameState.dropDelay * 2);
                    return;
                }
                
                // Drop a ball
                dropBall(betAmount);
                
                // Continue sequence
                setTimeout(rapidFireSequence, gameState.dropDelay);
            };
            
            // Start the sequence
            rapidFireSequence();
        } else {
            // Just drop a single ball
            dropBall(betAmount);
        }
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
        // Immediately deduct bet amount from balance to prevent spam glitch
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (currentUser) {
            if (currentUser.balance < betAmount) {
                alert('Not enough coins in your balance.');
                return;
            }
            // Deduct the bet amount immediately
            window.BetaAuth.updateBalance(-betAmount, 'Plinko Bet');
        }
        
        // Create a new ball at the top center of the board
        const ball = {
            x: canvas.width / 2 + (Math.random() * 10 - 5), // Smaller random offset
            y: 20, // Start slightly higher
            radius: gameState.ballRadius,
            vx: (Math.random() - 0.5) * 1.2, // Reduced initial horizontal velocity
            vy: 0.8, // Slower initial downward velocity
            betAmount,
            done: false,
            multiplier: null,
            trail: [], // For trail effect
            glowIntensity: 1.0, // For dynamic glow effect
            animationPhase: 0 // For pulsating effect
        };
        
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
            // Don't set isPlaying to false, we want to allow dropping multiple balls
        }
    }
    
    function updateBalls() {
        for (let i = 0; i < gameState.ballsInPlay.length; i++) {
            const ball = gameState.ballsInPlay[i];
            
            if (ball.done) continue;
            
            // Update trail (for visual effect)
            if (ball.trail.length > 8) ball.trail.pop();
            ball.trail.unshift({x: ball.x, y: ball.y});
            
            // Update animation phase
            ball.animationPhase += 0.1;
            if (ball.animationPhase > Math.PI * 2) ball.animationPhase = 0;
            ball.glowIntensity = 0.7 + Math.sin(ball.animationPhase) * 0.3;
            
            // Apply gravity - reduced for slower movement
            ball.vy += gameState.gravity * 0.9;
            
            // Apply speed cap to prevent extreme velocities
            const maxSpeed = 8; // Reduced max speed for more controlled movement
            if (ball.vy > maxSpeed) ball.vy = maxSpeed;
            
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
                    // Highlight this pin
                    highlightPin(pin);
                    
                    // Calculate collision normal
                    const nx = dx / distance;
                    const ny = dy / distance;
                    
                    // Calculate relative velocity
                    const relativeVelocity = ball.vx * nx + ball.vy * ny;
                    
                    // Apply impulse with improved elasticity for more natural bounces
                    const impulse = 2 * relativeVelocity * gameState.elasticity;
                    ball.vx -= impulse * nx;
                    ball.vy -= impulse * ny;
                    
                    // Apply friction - adjusted for more natural bounces
                    ball.vx *= gameState.friction;
                    
                    // Apply slight randomness for more variation in bounces
                    ball.vx += (Math.random() - 0.5) * 0.2;
                    
                    // Apply very small center bias for more natural distribution
                    const centerBias = (canvas.width / 2 - ball.x) * 0.0015;
                    ball.vx += centerBias;
                    
                    // Move ball out of collision
                    const overlap = ball.radius + pin.radius - distance;
                    ball.x += overlap * nx;
                    ball.y += overlap * ny;
                }
            }
            
            // Boundary handling - bouncy walls
            const padding = 2;
            const effectiveRadius = ball.radius + padding;
            
            if (ball.x - effectiveRadius < 0) {
                ball.x = effectiveRadius;
                ball.vx = -ball.vx * 0.95; // Slightly reduced energy for walls
            } else if (ball.x + effectiveRadius > canvas.width) {
                ball.x = canvas.width - effectiveRadius;
                ball.vx = -ball.vx * 0.95;
            }
            
            // Check for multiplier bucket collisions
            if (ball.y >= canvas.height - 65) {
                // Calculate which bucket the ball is in based on x position
                const bucketIndex = Math.floor(ball.x / (canvas.width / gameState.multipliers.length));
                const bucketIndex_clamped = Math.max(0, Math.min(bucketIndex, gameState.multipliers.length - 1));
                
                const multiplier = gameState.multipliers[bucketIndex_clamped];
                
                if (multiplier) {
                    ball.multiplier = multiplier.value;
                    ball.done = true;
                    
                    // Highlight this bucket
                    highlightBucket(multiplier);
                    
                    // Calculate payout
                    const payout = ball.betAmount * ball.multiplier;
                    
                    // Update balance - only add the profit since we already deducted the bet amount
                    const profit = payout - ball.betAmount;
                    if (window.BetaAuth) {
                        // Only add the winnings, not the full payout, since we already deducted the bet
                        window.BetaAuth.updateBalance(payout, 'Plinko Win');
                    }
                    
                    // Show result popup
                    showResult(profit);
                    
                    // Add to game history
                    addToHistory(ball.betAmount, riskLevelSelect.value, ball.multiplier, profit);
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
    
    function highlightPin(pin) {
        // Set this pin as the active pin with a glow effect
        gameState.activePin = pin;
        pin.glowSize = pin.radius * 3;
        
        // Clear any existing timeout
        if (gameState.activePinTimeout) {
            clearTimeout(gameState.activePinTimeout);
        }
        
        // Set a timeout to clear the highlight
        gameState.activePinTimeout = setTimeout(() => {
            gameState.activePin = null;
        }, 300);
    }
    
    function highlightBucket(multiplier) {
        if (!multiplier.element) return;
        
        // Add a highlight animation class
        multiplier.element.classList.add('bucket-highlight');
        
        // Remove it after animation completes
        setTimeout(() => {
            multiplier.element.classList.remove('bucket-highlight');
        }, 1000);
    }
    
    function draw() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background grid (subtle)
        drawBackgroundGrid();
        
        // Draw pins
        drawPins();
        
        // Draw multiplier slots
        drawMultiplierSlots();
        
        // Draw balls
        drawBalls();
    }
    
    function drawBackgroundGrid() {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        
        const gridSize = 30;
        
        // Draw vertical lines
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
    
    function drawPins() {
        for (const pin of gameState.pins) {
            // Base pin
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(pin.x, pin.y, pin.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw ambient glow
            const ambientSize = pin.radius * 2;
            const ambientGradient = ctx.createRadialGradient(
                pin.x, pin.y, pin.radius * 0.5,
                pin.x, pin.y, ambientSize
            );
            ambientGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
            ambientGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = ambientGradient;
            ctx.beginPath();
            ctx.arc(pin.x, pin.y, ambientSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw active glow if this is the active pin
            if (gameState.activePin === pin && pin.glowSize > 0) {
                const gradient = ctx.createRadialGradient(
                    pin.x, pin.y, pin.radius,
                    pin.x, pin.y, pin.glowSize
                );
                gradient.addColorStop(0, pin.glowColor);
                gradient.addColorStop(1, 'rgba(24, 231, 124, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(pin.x, pin.y, pin.glowSize, 0, Math.PI * 2);
                ctx.fill();
                
                // Reduce glow size for animation
                pin.glowSize *= 0.9;
            }
        }
    }
    
    function drawBalls() {
        for (const ball of gameState.ballsInPlay) {
            // Draw trail effect
            for (let i = 0; i < ball.trail.length; i++) {
                const trailPos = ball.trail[i];
                const alpha = (1 - i / ball.trail.length) * 0.3;
                const size = ball.radius * (1 - i / ball.trail.length) * 0.8;
                
                ctx.fillStyle = `rgba(24, 231, 124, ${alpha})`;
                ctx.beginPath();
                ctx.arc(trailPos.x, trailPos.y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Ball outer glow
            const glowSize = ball.radius * 3 * ball.glowIntensity;
            const glowGradient = ctx.createRadialGradient(
                ball.x, ball.y, ball.radius * 0.5,
                ball.x, ball.y, glowSize
            );
            glowGradient.addColorStop(0, 'rgba(24, 231, 124, 0.8)');
            glowGradient.addColorStop(1, 'rgba(24, 231, 124, 0)');
            
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, glowSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Ball main gradient
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
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(
                ball.x - ball.radius * 0.3,
                ball.y - ball.radius * 0.3,
                ball.radius * 0.3,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Motion blur effect when ball is moving fast
            if (Math.abs(ball.vy) > 8) {
                const blurAlpha = Math.min((Math.abs(ball.vy) - 8) / 10, 0.4);
                ctx.fillStyle = `rgba(24, 231, 124, ${blurAlpha})`;
                ctx.beginPath();
                ctx.ellipse(
                    ball.x, 
                    ball.y + ball.vy * 0.5, 
                    ball.radius * 0.7, 
                    ball.radius * 1.5, 
                    0, 0, Math.PI * 2
                );
                ctx.fill();
            }
        }
    }
    
    function drawMultiplierSlots() {
        // We don't need to draw anything here as we're using HTML elements
        // which are more reliable for positioning
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
        
        // Save to Supabase game_history table
        saveGameHistory(username, betAmount, risk, multiplier, profit);
    }
    
    // Save game history to Supabase
    async function saveGameHistory(username, betAmount, riskLevel, multiplier, result) {
        if (!window.SupabaseDB) return;
        
        try {
            const { error } = await window.SupabaseDB
                .from('game_history')
                .insert({
                    username: username,
                    game: 'Plinko',
                    bet: betAmount,
                    result: result,
                    time: new Date().toISOString()
                });
                
            if (error) {
                console.error('Error saving game history:', error);
            }
        } catch (error) {
            console.error('Error saving game history:', error);
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
    
    // Ambient pin animation
    function animatePins() {
        // Pick a random pin to highlight
        const randomIndex = Math.floor(Math.random() * gameState.pins.length);
        const randomPin = gameState.pins[randomIndex];
        
        // Set glow size
        randomPin.glowSize = randomPin.radius * 2;
        
        // Set a timeout for the next animation
        setTimeout(animatePins, 300 + Math.random() * 700);
        
        // Redraw if we're not already animating
        if (!gameState.animationFrame) {
            draw();
        }
    }
    
    // Event listener for risk level changes
    riskLevelSelect.addEventListener('change', () => {
        const risk = riskLevelSelect.value;
        gameState.multipliers = [...multiplierSets[risk]];
        drawMultipliers();
    });
    
    // Event listener for rows count changes
    rowsCountSelect.addEventListener('change', () => {
        initGameBoard();
        draw();
    });
    
    // Add CSS animation for bucket highlighting
    const style = document.createElement('style');
    style.textContent = `
        .bucket-highlight {
            animation: bucketGlow 1s ease-out;
        }
        
        @keyframes bucketGlow {
            0% { transform: scale(1); box-shadow: 0 0 5px rgba(255, 255, 255, 0.5); }
            50% { transform: scale(1.05); box-shadow: 0 0 20px var(--primary-color); }
            100% { transform: scale(1); box-shadow: 0 0 5px rgba(255, 255, 255, 0.5); }
        }
        
        .drop-animation {
            animation: dropButton 0.5s ease-out;
        }
        
        @keyframes dropButton {
            0% { transform: translateY(0); }
            50% { transform: translateY(3px); }
            100% { transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
    
    // Track shift key state
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Shift') {
            gameState.shiftKeyDown = true;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') {
            gameState.shiftKeyDown = false;
            
            // Exit rapid fire mode if active
            if (gameState.rapidFireMode) {
                gameState.rapidFireMode = false;
                gameState.rapidFireCount = 0;
                playButton.textContent = "PLAY";
                playButton.classList.remove('active-rapid-fire');
            }
        }
    });
    
    // Admin functions - add a broadcast capability and balance wipe
    // This will be triggered by the WIPEXX code
    function initAdminFeatures() {
        const redeemForm = document.getElementById('redeemForm');
        const originalSubmitHandler = redeemForm.onsubmit;
        
        redeemForm.addEventListener('submit', function(e) {
            const codeInput = document.getElementById('redeemCode');
            if (!codeInput) return;
            
            const code = codeInput.value.trim().toUpperCase();
            
            // Special admin code
            if (code === 'WIPEXX') {
                e.preventDefault();
                
                // Check if the user has admin privileges
                const currentUser = window.BetaAuth?.getCurrentUser();
                if (!currentUser || currentUser.username !== 'admin') {
                    alert('You do not have permission to use this code.');
                    return;
                }
                
                // Show admin panel
                showAdminPanel();
                
                // Clear the input
                codeInput.value = '';
                
                // Close the redeem modal
                const redeemModal = document.getElementById('redeemModal');
                if (redeemModal) {
                    redeemModal.style.display = 'none';
                }
            }
        });
    }
    
    function showAdminPanel() {
        // Create admin panel
        const adminPanel = document.createElement('div');
        adminPanel.className = 'admin-panel';
        adminPanel.innerHTML = `
            <div class="admin-panel-content">
                <h2>Admin Panel</h2>
                <div class="admin-section">
                    <h3>Broadcast Message</h3>
                    <input type="text" id="broadcastMessage" placeholder="Enter message to broadcast">
                    <button id="sendBroadcast" class="admin-button">Send Broadcast</button>
                </div>
                <div class="admin-section">
                    <h3>User Management</h3>
                    <div class="user-list" id="userList">
                        <p>Loading users...</p>
                    </div>
                </div>
                <button id="closeAdminPanel" class="admin-button close">Close</button>
            </div>
        `;
        
        document.body.appendChild(adminPanel);
        
        // Add event listeners
        document.getElementById('closeAdminPanel').addEventListener('click', () => {
            document.body.removeChild(adminPanel);
        });
        
        document.getElementById('sendBroadcast').addEventListener('click', () => {
            const message = document.getElementById('broadcastMessage').value;
            if (message) {
                broadcastMessage(message);
            }
        });
        
        // Load user list (this would connect to your backend in a real implementation)
        loadUserList();
    }
    
    function broadcastMessage(message) {
        // Create broadcast element
        const broadcast = document.createElement('div');
        broadcast.className = 'broadcast-message';
        broadcast.innerHTML = `
            <div class="broadcast-content">
                <i class="fas fa-bullhorn"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(broadcast);
        
        // Animate in
        setTimeout(() => {
            broadcast.classList.add('show');
        }, 100);
        
        // Remove after some time
        setTimeout(() => {
            broadcast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(broadcast);
            }, 500);
        }, 5000);
    }
    
    function loadUserList() {
        const userList = document.getElementById('userList');
        if (!userList) return;
        
        // In a real implementation, this would fetch from your backend
        // For demo purposes, we'll create some dummy users
        const dummyUsers = [
            { username: 'Player1', balance: 1500 },
            { username: 'LuckyGuy', balance: 2500 },
            { username: 'BigWinner', balance: 10000 },
            { username: 'CasinoKing', balance: 5000 }
        ];
        
        // Add current user if available
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (currentUser && !dummyUsers.find(u => u.username === currentUser.username)) {
            dummyUsers.push({
                username: currentUser.username,
                balance: currentUser.balance
            });
        }
        
        // Clear and populate user list
        userList.innerHTML = '';
        dummyUsers.forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = 'user-item';
            userElement.innerHTML = `
                <span class="user-name">${user.username}</span>
                <span class="user-balance">${user.balance} coins</span>
                <button class="wipe-balance" data-username="${user.username}">Wipe Balance</button>
            `;
            userList.appendChild(userElement);
        });
        
        // Add event listeners to wipe buttons
        const wipeButtons = document.querySelectorAll('.wipe-balance');
        wipeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const username = button.dataset.username;
                wipeUserBalance(username);
            });
        });
    }
    
    function wipeUserBalance(username) {
        if (confirm(`Are you sure you want to wipe ${username}'s balance?`)) {
            // In a real implementation, this would call your backend
            alert(`${username}'s balance has been wiped.`);
            
            // If it's the current user, update their balance
            const currentUser = window.BetaAuth?.getCurrentUser();
            if (currentUser && currentUser.username === username) {
                if (window.BetaAuth?.updateBalance) {
                    window.BetaAuth.updateBalance(-currentUser.balance, 'Admin Wipe');
                }
            }
        }
    }
    
    // Initialize admin features
    initAdminFeatures();
    
    // Function to handle mine game loss (will be attached to a global event)
    function handleMineGameLoss() {
        // This function will be triggered when a mine is hit in the mines game
        // We'll add it to the global namespace so it can be accessed from the mines game
        if (window.BetaGames) {
            window.BetaGames.lockMinesAfterLoss = function(minesGrid) {
                if (!minesGrid) return;
                
                // Create and append the lock overlay
                const lockOverlay = document.createElement('div');
                lockOverlay.className = 'mines-lock-overlay';
                
                // Create lock icon
                const lockIcon = document.createElement('div');
                lockIcon.className = 'mines-lock-icon';
                lockIcon.innerHTML = '<i class="fas fa-lock"></i>';
                
                // Add animation class
                lockOverlay.classList.add('animate-lock');
                
                // Append to mines grid
                lockOverlay.appendChild(lockIcon);
                minesGrid.appendChild(lockOverlay);
                
                // Disable all mine buttons
                const mineButtons = minesGrid.querySelectorAll('.mine-button');
                mineButtons.forEach(button => {
                    button.disabled = true;
                    button.classList.add('disabled');
                });
                
                // Add styling for the lock overlay if not already added
                if (!document.getElementById('mines-lock-styles')) {
                    const lockStyles = document.createElement('style');
                    lockStyles.id = 'mines-lock-styles';
                    lockStyles.textContent = `
                        .mines-lock-overlay {
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background-color: rgba(0, 0, 0, 0.7);
                            z-index: 10;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            opacity: 0;
                            transition: opacity 0.5s ease;
                        }
                        
                        .animate-lock {
                            animation: lockFadeIn 0.5s forwards;
                        }
                        
                        @keyframes lockFadeIn {
                            0% { opacity: 0; }
                            100% { opacity: 1; }
                        }
                        
                        .mines-lock-icon {
                            font-size: 48px;
                            color: #ff4444;
                            animation: lockPulse 1.5s infinite alternate;
                        }
                        
                        @keyframes lockPulse {
                            0% { transform: scale(1); text-shadow: 0 0 10px rgba(255, 68, 68, 0.7); }
                            100% { transform: scale(1.2); text-shadow: 0 0 20px rgba(255, 68, 68, 0.9); }
                        }
                        
                        .mine-button.disabled {
                            pointer-events: none;
                            opacity: 0.7;
                        }
                    `;
                    document.head.appendChild(lockStyles);
                }
            };
        }
    }
    
    // Initialize the mines game lock function
    handleMineGameLoss();
    
    // Initialize the game
    initGame();
}); 