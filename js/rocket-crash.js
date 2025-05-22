// BetaGames Rocket Crash Game Implementation

// Global state synchronization
const SYNC_INTERVAL = 1000; // Sync every 1 second
const GAME_ID_KEY = 'rocketcrash_game_id';
const GLOBAL_STATE_KEY = 'rocketcrash_global_state';
const GLOBAL_BETS_KEY = 'rocketcrash_global_bets';
const CRASH_HISTORY_KEY = 'rocketcrash_crash_history';
let lastSyncTime = 0;
let supabaseEnabled = false; // Flag to track if Supabase is available

// Sound effects
const SOUNDS = {
    BET: new Audio('../assets/sounds/bet.mp3'),
    CASHOUT: new Audio('../assets/sounds/cashout.mp3'),
    CRASH: new Audio('../assets/sounds/crash.mp3'),
    WIN: new Audio('../assets/sounds/win.mp3')
};

// Helper function to play sounds
function playSound(sound) {
    // Check if sounds are enabled in settings
    const soundsEnabled = localStorage.getItem('soundsEnabled') !== 'false';
    if (!soundsEnabled) return;
    
    // Get volume from settings (default 0.5)
    const volume = parseFloat(localStorage.getItem('soundVolume') || '0.5');
    
    // Play the sound
    if (SOUNDS[sound]) {
        SOUNDS[sound].volume = volume;
        SOUNDS[sound].currentTime = 0;
        SOUNDS[sound].play().catch(e => console.error(`Error playing ${sound} sound:`, e));
    }
}

// Sound functions
function playCrashSound() {
    playSound('CRASH');
}

function playBetSound() {
    playSound('BET');
}

function playCashoutSound() {
    playSound('CASHOUT');
}

function playWinSound() {
    playSound('WIN');
}

document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const canvas = document.getElementById('rocketCanvas');
    const ctx = canvas.getContext('2d');
    const betAmountInput = document.getElementById('betAmount');
    const autoCashoutInput = document.getElementById('autoCashout');
    const betButton = document.getElementById('betButton');
    const cashoutButton = document.getElementById('cashoutButton');
    const multiplierDisplay = document.getElementById('multiplierDisplay');
    const activeBetsList = document.getElementById('activeBetsList');
    const gameHistoryBody = document.getElementById('gameHistoryBody');
    const rocketBoard = document.querySelector('.rocket-board');
    const countdownDisplay = document.getElementById('countdownDisplay');
    const crashHistoryDisplay = document.getElementById('crashHistory');
    
    // Game state
    let gameState = {
        isPlaying: false,
        gameActive: false,
        currentMultiplier: 1.00,
        gameHistory: [],
        activeBets: [],
        recentCrashes: [],
        countdownTime: 5, // 5 seconds countdown between games
        currentCountdown: 0,
        gameId: generateGameId(), // Unique ID for each game instance
        serverStartTime: 0, // When the current game started on server
        localStartTime: 0, // Local timestamp when game started
        rocket: {
            x: 0,
            y: 0,
            width: 60,  // Increased size
            height: 120, // Increased size
            angle: 0,
            scale: 1
        },
        particles: [],
        stars: [],
        crashChance: 0.001, // Reduced chance of crashing per frame
        growthRate: 0.3,    // Reduced growth rate for slower climbs
        maxMultiplier: 1000, // Increased maximum possible multiplier
        updateInterval: null,
        houseEdge: 0.01, // Reduced to 1% house edge to make winning much easier
        crashPoint: 0, // The predetermined crash point
        lastSyncedMultiplier: 1.00 // For synchronization
    };
    
    // Initialize the game
    initGame();
    
    // Generate a unique game ID
    function generateGameId() {
        return Date.now().toString() + Math.random().toString().slice(2, 8);
    }
    
    // Check if Supabase is available
    function checkSupabase() {
        if (window.SupabaseDB) {
            supabaseEnabled = true;
            console.log('Supabase is available for real-time synchronization');
            
            // Setup subscription to listen for game state changes
            setupSupabaseSubscription();
            return true;
        } else {
            console.log('Supabase not available, using localStorage for synchronization');
            return false;
        }
    }
    
    // Setup Supabase real-time subscription
    function setupSupabaseSubscription() {
        if (!supabaseEnabled) return;
        
        try {
            // Subscribe to game state changes
            window.SupabaseDB
                .channel('rocket-crash-channel')
                .on('broadcast', { event: 'game_state_update' }, payload => {
                    handleSupabaseStateUpdate(payload);
                })
                .on('broadcast', { event: 'game_bets_update' }, payload => {
                    handleSupabaseBetsUpdate(payload);
                })
                .on('broadcast', { event: 'game_crash' }, payload => {
                    handleSupabaseCrash(payload);
                })
                .subscribe();
                
            console.log('Subscribed to Supabase real-time updates');
        } catch (error) {
            console.error('Error setting up Supabase subscription:', error);
            supabaseEnabled = false;
        }
    }
    
    // Handle Supabase game state update
    function handleSupabaseStateUpdate(payload) {
        if (!payload || !payload.payload) return;
        
        const data = payload.payload;
        
        // Update game state from Supabase data
        if (data.gameActive && !gameState.gameActive) {
            // Game started
            gameState.gameActive = true;
            gameState.serverStartTime = data.serverStartTime;
            gameState.localStartTime = Date.now();
            gameState.crashPoint = data.crashPoint;
            
            // Calculate current multiplier based on elapsed time
            const elapsedSeconds = (Date.now() - gameState.serverStartTime) / 1000;
            const targetMultiplier = calculateMultiplierAtTime(elapsedSeconds);
            gameState.currentMultiplier = targetMultiplier;
            
            joinRunningGame();
        } else if (data.gameActive && gameState.gameActive) {
            // Sync multiplier if needed
            if (Math.abs(data.currentMultiplier - gameState.currentMultiplier) > 0.5) {
                gameState.currentMultiplier = data.currentMultiplier;
                updateMultiplierDisplay();
            }
        } else if (!data.gameActive && gameState.gameActive) {
            // Game crashed
            handleCrash();
        } else if (data.currentCountdown > 0 && !gameState.gameActive) {
            // Update countdown
            gameState.currentCountdown = data.currentCountdown;
            if (countdownDisplay) {
                countdownDisplay.textContent = `Next launch: ${gameState.currentCountdown}s`;
                countdownDisplay.style.display = 'block';
            }
        }
    }
    
    // Handle Supabase bets update
    function handleSupabaseBetsUpdate(payload) {
        if (!payload || !payload.payload) return;
        
        const data = payload.payload;
        
        // Update active bets
        gameState.activeBets = data.activeBets;
        updateActiveBetsList();
    }
    
    // Handle Supabase crash event
    function handleSupabaseCrash(payload) {
        if (!payload || !payload.payload) return;
        
        const data = payload.payload;
        
        // Update crash history
        gameState.recentCrashes = data.recentCrashes;
        updateCrashHistoryDisplay();
        
        // If we're still in a game, handle the crash
        if (gameState.gameActive) {
            handleCrash();
        }
    }
    
    // Broadcast game state via Supabase
    async function broadcastGameState() {
        if (!supabaseEnabled) return;
        
        try {
            const data = {
                gameActive: gameState.gameActive,
                currentMultiplier: gameState.currentMultiplier,
                serverStartTime: gameState.serverStartTime,
                currentCountdown: gameState.currentCountdown,
                crashPoint: gameState.crashPoint,
                lastUpdate: Date.now()
            };
            
            await window.SupabaseDB
                .channel('rocket-crash-channel')
                .send({
                    type: 'broadcast',
                    event: 'game_state_update',
                    payload: data
                });
        } catch (error) {
            console.error('Error broadcasting game state:', error);
        }
    }
    
    // Broadcast active bets via Supabase
    async function broadcastBets() {
        if (!supabaseEnabled) return;
        
        try {
            await window.SupabaseDB
                .channel('rocket-crash-channel')
                .send({
                    type: 'broadcast',
                    event: 'game_bets_update',
                    payload: {
                        activeBets: gameState.activeBets
                    }
                });
        } catch (error) {
            console.error('Error broadcasting bets:', error);
        }
    }
    
    // Broadcast crash event via Supabase
    async function broadcastCrash() {
        if (!supabaseEnabled) return;
        
        try {
            await window.SupabaseDB
                .channel('rocket-crash-channel')
                .send({
                    type: 'broadcast',
                    event: 'game_crash',
                    payload: {
                        recentCrashes: gameState.recentCrashes,
                        crashPoint: gameState.crashPoint
                    }
                });
        } catch (error) {
            console.error('Error broadcasting crash:', error);
        }
    }
    
    // Load or initialize global state
    function initGlobalState() {
        // First check if Supabase is available
        checkSupabase();
        
        // Fallback to localStorage
        let globalState = localStorage.getItem(GLOBAL_STATE_KEY);
        
        if (globalState) {
            try {
                globalState = JSON.parse(globalState);
                
                // If stored game is still active, sync with it
                if (globalState.gameActive && Date.now() - globalState.lastUpdate < 10000) {
                    // Game is still active, sync with it
                    gameState.gameActive = globalState.gameActive;
                    gameState.currentMultiplier = globalState.currentMultiplier;
                    gameState.serverStartTime = globalState.serverStartTime;
                    gameState.localStartTime = Date.now();
                    gameState.crashPoint = globalState.crashPoint;
                    gameState.currentCountdown = globalState.currentCountdown;
                    
                    // Load active bets
                    loadGlobalBets();
                    
                    // If game is in countdown, update UI
                    if (globalState.currentCountdown > 0) {
                        showCountdown(globalState.currentCountdown);
                    } else {
                        // Game is already running, sync and join
                        joinRunningGame();
                    }
                } else {
                    // Previous game ended or timed out, start a new one
                    startGameCountdown();
                }
            } catch (e) {
                console.error("Error parsing global state", e);
                startGameCountdown();
            }
        } else {
            // No existing game, start a new one
            startGameCountdown();
        }
        
        // Load crash history
        loadCrashHistory();
        
        // Start synchronization loop
        startSyncLoop();
    }
    
    // Save the current game state globally
    function saveGlobalState() {
        const globalState = {
            gameActive: gameState.gameActive,
            currentMultiplier: gameState.currentMultiplier,
            serverStartTime: gameState.serverStartTime,
            currentCountdown: gameState.currentCountdown,
            crashPoint: gameState.crashPoint,
            lastUpdate: Date.now()
        };
        
        // Save to localStorage as fallback
        localStorage.setItem(GLOBAL_STATE_KEY, JSON.stringify(globalState));
        
        // If Supabase is available, broadcast the state
        if (supabaseEnabled) {
            broadcastGameState();
        }
    }
    
    // Save active bets globally
    function saveGlobalBets() {
        // Save to localStorage as fallback
        localStorage.setItem(GLOBAL_BETS_KEY, JSON.stringify(gameState.activeBets));
        
        // If Supabase is available, broadcast the bets
        if (supabaseEnabled) {
            broadcastBets();
        }
    }
    
    // Load bets from global storage
    function loadGlobalBets() {
        let bets = localStorage.getItem(GLOBAL_BETS_KEY);
        if (bets) {
            try {
                gameState.activeBets = JSON.parse(bets);
                updateActiveBetsList();
            } catch (e) {
                console.error("Error loading global bets", e);
            }
        }
    }
    
    // Save crash history globally
    function saveCrashHistory() {
        // Save to localStorage as fallback
        localStorage.setItem(CRASH_HISTORY_KEY, JSON.stringify(gameState.recentCrashes));
        
        // If Supabase is available, broadcast the crash
        if (supabaseEnabled) {
            broadcastCrash();
        }
    }
    
    // Load crash history from global storage
    function loadCrashHistory() {
        let history = localStorage.getItem(CRASH_HISTORY_KEY);
        if (history) {
            try {
                gameState.recentCrashes = JSON.parse(history);
                updateCrashHistoryDisplay();
            } catch (e) {
                console.error("Error loading crash history", e);
                initRecentCrashes(); // Use defaults if error
            }
        } else {
            initRecentCrashes(); // Initialize with defaults
        }
    }
    
    // Sync game state with global state
    function syncGameState() {
        const now = Date.now();
        
        // Only sync every SYNC_INTERVAL ms to avoid too frequent updates
        if (now - lastSyncTime < SYNC_INTERVAL) return;
        lastSyncTime = now;
        
        // First, check if there's a newer game state
        let globalState = localStorage.getItem(GLOBAL_STATE_KEY);
        
        if (globalState) {
            try {
                globalState = JSON.parse(globalState);
                
                // If the stored game is newer, and not from this instance, sync with it
                if (globalState.lastUpdate > lastSyncTime - SYNC_INTERVAL * 2) {
                    // Update countdown if we're in countdown phase
                    if (globalState.currentCountdown > 0 && !gameState.gameActive) {
                        gameState.currentCountdown = globalState.currentCountdown;
                        if (countdownDisplay) {
                            countdownDisplay.textContent = `Next launch: ${gameState.currentCountdown}s`;
                            countdownDisplay.style.display = 'block';
                        }
                    }
                    
                    // If we're not in a game but global state is, join it
                    if (globalState.gameActive && !gameState.gameActive) {
                        gameState.gameActive = true;
                        gameState.serverStartTime = globalState.serverStartTime;
                        gameState.localStartTime = now;
                        gameState.crashPoint = globalState.crashPoint;
                        
                        // Calculate current multiplier based on elapsed time
                        const elapsedSeconds = (now - gameState.serverStartTime) / 1000;
                        const targetMultiplier = calculateMultiplierAtTime(elapsedSeconds);
                        gameState.currentMultiplier = targetMultiplier;
                        
                        joinRunningGame();
                    }
                    
                    // Sync multiplier if we're both in a game
                    if (globalState.gameActive && gameState.gameActive) {
                        // If the difference is significant, resync
                        if (Math.abs(globalState.currentMultiplier - gameState.currentMultiplier) > 0.5) {
                            gameState.currentMultiplier = globalState.currentMultiplier;
                            updateMultiplierDisplay();
                        }
                    }
                    
                    // If global game ended but we're still active, handle crash
                    if (!globalState.gameActive && gameState.gameActive) {
                        handleCrash();
                    }
                }
            } catch (e) {
                console.error("Error syncing game state", e);
            }
        }
        
        // Then, save our current state
        if (gameState.gameActive || gameState.currentCountdown > 0) {
            saveGlobalState();
        }
        
        // Sync bets
        loadGlobalBets();
    }
    
    // Start sync loop
    function startSyncLoop() {
        setInterval(syncGameState, SYNC_INTERVAL);
    }
    
    // Calculate multiplier at a given time point
    function calculateMultiplierAtTime(seconds) {
        // Use the same growth formula as in the game
        let multiplier = 1.0;
        for (let i = 0; i < seconds * 10; i++) {
            const increment = 0.1 * gameState.growthRate * multiplier;
            multiplier += increment;
        }
        return Math.min(multiplier, gameState.maxMultiplier);
    }
    
    // Join a running game
    function joinRunningGame() {
        // Clear any existing animation frame
        if (gameState.animationFrame) {
            cancelAnimationFrame(gameState.animationFrame);
        }
        
        // Set UI to game mode
        if (countdownDisplay) {
            countdownDisplay.style.display = 'none';
        }
        
        // Start the game animation from current point
        let lastTimestamp = performance.now();
        const updateMultiplier = (timestamp) => {
            // Calculate delta time for smooth animation
            const deltaTime = timestamp - lastTimestamp;
            lastTimestamp = timestamp;
            
            // Increase multiplier with delta time
            const increment = (deltaTime / 1000) * gameState.growthRate * gameState.currentMultiplier;
            gameState.currentMultiplier += increment;
            
            // Limit to max multiplier
            if (gameState.currentMultiplier > gameState.maxMultiplier) {
                gameState.currentMultiplier = gameState.maxMultiplier;
            }
            
            // Check if we've reached the crash point
            if (gameState.currentMultiplier >= gameState.crashPoint) {
                handleCrash();
                return;
            }
            
            // Update rocket position and scale
            updateRocket(deltaTime);
            
            // Update UI
            updateMultiplierDisplay();
            
            // Check auto cashouts
            checkAutoCashouts();
            
            // Create particles
            createRocketParticles();
            
            // Draw game
            draw();
            
            // Continue animation if game is still active
            if (gameState.gameActive) {
                gameState.animationFrame = requestAnimationFrame(updateMultiplier);
            }
        };
        
        // Start the animation
        gameState.animationFrame = requestAnimationFrame(updateMultiplier);
    }
    
    function initGame() {
        // Setup canvas size
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Setup event listeners
        betButton.addEventListener('click', handleBet);
        cashoutButton.addEventListener('click', handleCashout);
        
        // Setup bet amount shortcuts
        setupBetShortcuts();
        
        // Initialize stars
        initStars();
        
        // Draw initial state
        draw();
        
        // Load game history with some sample data
        loadGameHistory();
        
        // Initialize global state
        initGlobalState();
    }
    
    // Show countdown display
    function showCountdown(seconds) {
        gameState.currentCountdown = seconds;
        if (countdownDisplay) {
            countdownDisplay.textContent = `Next launch: ${seconds}s`;
            countdownDisplay.style.display = 'block';
        }
    }
    
    function initRecentCrashes() {
        // Add some sample crash points
        gameState.recentCrashes = [
            { multiplier: 1.24, color: '#ff4444' },
            { multiplier: 2.78, color: '#18e77c' },
            { multiplier: 1.05, color: '#ff4444' },
            { multiplier: 4.23, color: '#18e77c' },
            { multiplier: 1.92, color: '#18e77c' },
            { multiplier: 3.45, color: '#18e77c' },
            { multiplier: 1.14, color: '#ff4444' },
            { multiplier: 8.73, color: '#18e77c' }
        ];
        saveCrashHistory();
    }
    
    function updateCrashHistoryDisplay() {
        if (!crashHistoryDisplay) return;
        
        // Clear current display
        crashHistoryDisplay.innerHTML = '';
        
        // Add each crash point
        gameState.recentCrashes.forEach(crash => {
            const crashItem = document.createElement('div');
            crashItem.className = 'crash-item';
            crashItem.textContent = crash.multiplier.toFixed(2) + 'x';
            crashItem.style.color = crash.color;
            crashHistoryDisplay.appendChild(crashItem);
        });
    }
    
    function resizeCanvas() {
        if (rocketBoard) {
            const containerWidth = rocketBoard.clientWidth;
            const containerHeight = rocketBoard.clientHeight;
            
            // Make canvas fill the container
            canvas.width = containerWidth;
            canvas.height = containerHeight;
            
            // Position rocket in the bottom center
            gameState.rocket.x = containerWidth / 2;
            gameState.rocket.y = containerHeight - 120;
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
    
    function initStars() {
        // Create background stars
        gameState.stars = [];
        const starCount = 150; // More stars for better visuals
        
        for (let i = 0; i < starCount; i++) {
            gameState.stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 3 + 1, // Larger stars
                speed: Math.random() * 0.5 + 0.1,
                opacity: Math.random() * 0.8 + 0.2
            });
        }
    }
    
    function startGameCountdown() {
        // Make sure we're not already in a game
        if (gameState.gameActive) return;
        
        // Reset countdown
        gameState.currentCountdown = gameState.countdownTime;
        
        // Set the server start time to a future point
        gameState.serverStartTime = Date.now() + (gameState.countdownTime * 1000);
        
        // Pre-generate the crash point for this game
        gameState.crashPoint = generateCrashPoint();
        
        // Update display
        if (countdownDisplay) {
            countdownDisplay.textContent = `Next launch: ${gameState.currentCountdown}s`;
            countdownDisplay.style.display = 'block';
        }
        
        // Save global state
        saveGlobalState();
        
        // Start countdown interval
        const countdownInterval = setInterval(() => {
            gameState.currentCountdown--;
            
            if (countdownDisplay) {
                countdownDisplay.textContent = `Next launch: ${gameState.currentCountdown}s`;
            }
            
            // Save updated countdown
            saveGlobalState();
            
            if (gameState.currentCountdown <= 0) {
                clearInterval(countdownInterval);
                if (countdownDisplay) {
                    countdownDisplay.style.display = 'none';
                }
                startNewGame();
            }
        }, 1000);
    }
    
    function startNewGame() {
        if (gameState.gameActive) return; // Prevent multiple games
        
        gameState.gameActive = true;
        gameState.currentMultiplier = 1.00;
        gameState.particles = [];
        gameState.localStartTime = Date.now();
        
        // Reset rocket position
        gameState.rocket.y = canvas.height - 120;
        gameState.rocket.scale = 1;
        gameState.rocket.angle = 0;
        
        // Update UI
        updateMultiplierDisplay();
        
        // Enable bet button, disable cashout
        betButton.disabled = false;
        cashoutButton.style.display = 'none';
        
        // Save global state
        saveGlobalState();
        
        // Start multiplier update loop
        let lastTimestamp = performance.now();
        const updateMultiplier = (timestamp) => {
            // Calculate delta time for smooth animation
            const deltaTime = timestamp - lastTimestamp;
            lastTimestamp = timestamp;
            
            // Increase multiplier with delta time to maintain consistent speed
            // We use exponential growth for the multiplier to make it more exciting
            // Reduced growth rate for slower climb
            const increment = (deltaTime / 1000) * gameState.growthRate * gameState.currentMultiplier;
            gameState.currentMultiplier += increment;
            
            // Limit to max multiplier
            if (gameState.currentMultiplier > gameState.maxMultiplier) {
                gameState.currentMultiplier = gameState.maxMultiplier;
            }
            
            // Check if we've reached the crash point
            if (gameState.currentMultiplier >= gameState.crashPoint) {
                handleCrash();
                return;
            }
            
            // Update rocket position and scale
            updateRocket(deltaTime);
            
            // Update UI
            updateMultiplierDisplay();
            
            // Check auto cashouts
            checkAutoCashouts();
            
            // Create particles
            createRocketParticles();
            
            // Draw game
            draw();
            
            // Save global state periodically
            if (timestamp % 100 < 20) {
                saveGlobalState();
            }
            
            // Continue animation if game is still active
            if (gameState.gameActive) {
                gameState.animationFrame = requestAnimationFrame(updateMultiplier);
            }
        };
        
        // Start the animation
        gameState.animationFrame = requestAnimationFrame(updateMultiplier);
    }
    
    function generateCrashPoint() {
        // Generate a crash point with a house edge
        // The formula ensures the expected value is (1 - houseEdge)
        const houseEdge = gameState.houseEdge;
        const r = Math.random();
        
        // Only 5% chance of crashing at minimum point
        if (r < 0.05) {
            return 1.30; // Minimum crash point is 1.30x
        }
        
        // Generate using a distribution that gives an expected value adjusted for house edge
        const lambda = Math.log(1 / (1 - houseEdge));
        let result = Math.max(1.30, Math.exp(r * lambda) / (1 - houseEdge));
        
        // Increase chance of higher multipliers for very player-friendly experience
        if (Math.random() < 0.60) { // 60% chance of boost
            result = result * (1 + Math.random() * 2); // Boost up to 3x
        }
        
        // Add bonus multipliers occasionally
        if (Math.random() < 0.20) { // 20% chance of jackpot boost
            result = result * (2 + Math.random() * 5); // Big 2x-7x boost
        }
        
        // Round to 2 decimal places
        return Math.round(result * 100) / 100;
    }
    
    function updateRocket(deltaTime) {
        // Update rocket y position - slower movement
        const speedFactor = 0.03; // Reduced for slower ascent
        gameState.rocket.y -= speedFactor * deltaTime * (1 + Math.log10(gameState.currentMultiplier));
        
        // Add slight rotation based on multiplier
        gameState.rocket.angle = Math.sin(gameState.currentMultiplier * 0.05) * 0.1;
        
        // Scale rocket based on distance from bottom
        const distanceFromBottom = canvas.height - gameState.rocket.y;
        const scaleFactor = 1 - distanceFromBottom / canvas.height * 0.3; // Less scaling
        gameState.rocket.scale = Math.max(0.7, scaleFactor); // Minimum scale increased
    }
    
    function createRocketParticles() {
        // Add new particles
        if (Math.random() < 0.5) { // Increased particle rate
            const rocketBottomX = gameState.rocket.x;
            const rocketBottomY = gameState.rocket.y + gameState.rocket.height * 0.5 * gameState.rocket.scale;
            
            // Create flame trail
            for (let i = 0; i < 3; i++) { // Multiple particles per frame
                gameState.particles.push({
                    x: rocketBottomX + (Math.random() - 0.5) * 25 * gameState.rocket.scale,
                    y: rocketBottomY,
                    radius: Math.random() * 6 + 3, // Larger particles
                    color: Math.random() < 0.7 ? '#ff4b2b' : '#ff9d00',
                    alpha: 1,
                    vx: (Math.random() - 0.5) * 2,
                    vy: Math.random() * 3 + 1.5, // Faster falling
                    life: Math.random() * 40 + 30 // Longer life
                });
            }
        }
        
        // Update existing particles
        for (let i = 0; i < gameState.particles.length; i++) {
            const particle = gameState.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.alpha -= 0.015; // Slower fade
            particle.life--;
            
            // Remove dead particles
            if (particle.life <= 0 || particle.alpha <= 0) {
                gameState.particles.splice(i, 1);
                i--;
            }
        }
    }
    
    function updateMultiplierDisplay() {
        multiplierDisplay.textContent = gameState.currentMultiplier.toFixed(2) + 'x';
        
        // Change color based on multiplier for visual feedback
        if (gameState.currentMultiplier >= 10) {
            multiplierDisplay.style.color = '#ff9d00';
            multiplierDisplay.style.textShadow = '0 0 20px rgba(255, 157, 0, 0.7)';
        } else if (gameState.currentMultiplier >= 5) {
            multiplierDisplay.style.color = '#18e77c';
            multiplierDisplay.style.textShadow = '0 0 20px rgba(24, 231, 124, 0.7)';
        } else if (gameState.currentMultiplier >= 2) {
            multiplierDisplay.style.color = '#4287f5';
            multiplierDisplay.style.textShadow = '0 0 20px rgba(66, 135, 245, 0.7)';
        } else {
            multiplierDisplay.style.color = '#fff';
            multiplierDisplay.style.textShadow = '0 0 20px rgba(255, 255, 255, 0.5)';
        }
    }
    
    function checkAutoCashouts() {
        // Check if any active bets should auto cashout
        for (let i = 0; i < gameState.activeBets.length; i++) {
            const bet = gameState.activeBets[i];
            
            if (!bet.cashedOut && bet.autoCashout <= gameState.currentMultiplier) {
                cashoutBet(bet, true);
            }
        }
    }
    
    function handleBet() {
        // Validate user is logged in
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (!currentUser) {
            alert('Please login to play!');
            return;
        }
        
        // Get bet amount
        const betAmount = parseFloat(betAmountInput.value);
        const autoCashout = parseFloat(autoCashoutInput.value);
        
        // Validate bet amount
        if (isNaN(betAmount) || betAmount <= 0) {
            alert('Please enter a valid bet amount.');
            return;
        }
        
        if (betAmount > currentUser.balance) {
            alert('Not enough coins in your balance.');
            return;
        }
        
        // Validate auto cashout
        if (isNaN(autoCashout) || autoCashout < 1.01) {
            alert('Auto cashout must be at least 1.01x.');
            return;
        }
        
        // Play bet sound
        playBetSound();
        
        // Deduct bet amount from balance
        window.BetaAuth.updateBalance(-betAmount, 'Rocket Crash Bet');
        
        // Create bet object
        const bet = {
            user: currentUser.username,
            userId: currentUser.id,
            amount: betAmount,
            autoCashout: autoCashout,
            cashedOut: false,
            cashoutMultiplier: null,
            profit: null,
            timestamp: new Date(),
            id: currentUser.id + '_' + Date.now() // Unique ID for the bet
        };
        
        // Save bet to Supabase if available
        if (supabaseEnabled && window.SupabaseDB && gameState.gameActive) {
            saveBetToSupabase(bet);
        }
        
        // Add to active bets
        gameState.activeBets.push(bet);
        
        // Save bets globally
        saveGlobalBets();
        
        // Update UI
        updateActiveBetsList();
        
        // Disable bet button, enable cashout
        betButton.disabled = true;
        cashoutButton.style.display = 'block';
    }
    
    // Save bet to Supabase
    async function saveBetToSupabase(bet) {
        if (!window.SupabaseDB) return;
        
        try {
            // Find most recent game
            const { data: games, error: gamesError } = await window.SupabaseDB
                .from('crash_games')
                .select('id')
                .order('started_at', { ascending: false })
                .limit(1);
                
            if (gamesError) {
                console.error('Error fetching game for bet:', gamesError);
                return;
            }
            
            if (!games || games.length === 0) {
                // Create a new game
                const { data: newGame, error: newGameError } = await window.SupabaseDB
                    .from('crash_games')
                    .insert({
                        crash_point: null, // Will be updated when game ends
                        started_at: new Date().toISOString()
                    })
                    .select();
                    
                if (newGameError) {
                    console.error('Error creating new game:', newGameError);
                    return;
                }
                
                if (newGame && newGame.length > 0) {
                    const gameId = newGame[0].id;
                    saveBet(bet, gameId);
                }
            } else {
                const gameId = games[0].id;
                saveBet(bet, gameId);
            }
        } catch (error) {
            console.error('Error saving bet to Supabase:', error);
        }
        
        function saveBet(bet, gameId) {
            window.SupabaseDB
                .from('crash_bets')
                .insert({
                    user_id: bet.userId,
                    username: bet.user,
                    game_id: gameId,
                    amount: bet.amount,
                    auto_cashout: bet.autoCashout,
                    created_at: new Date().toISOString()
                })
                .then(response => {
                    console.log('Bet saved to Supabase:', response);
                })
                .catch(error => {
                    console.error('Error saving bet:', error);
                });
        }
    }
    
    function handleCashout() {
        // Find the user's active bet
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (!currentUser) return;
        
        const userBet = gameState.activeBets.find(bet => 
            bet.user === currentUser.username && !bet.cashedOut
        );
        
        if (userBet) {
            cashoutBet(userBet, false);
        }
    }
    
    function cashoutBet(bet, isAuto) {
        // Mark bet as cashed out
        bet.cashedOut = true;
        bet.cashoutMultiplier = gameState.currentMultiplier;
        
        // Calculate profit
        const payout = bet.amount * bet.cashoutMultiplier;
        bet.profit = payout - bet.amount;
        
        // Play cashout sound
        playCashoutSound();
        
        // Play win sound for big wins
        if (bet.cashoutMultiplier >= 2) {
            playWinSound();
        }
        
        // Update user balance if it's the current user
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (currentUser && bet.user === currentUser.username) {
            window.BetaAuth.updateBalance(payout, 'Rocket Crash Win');
            
            // Update bet in Supabase if available
            if (supabaseEnabled && window.SupabaseDB) {
                updateBetInSupabase(bet);
            }
        }
        
        // Add to history
        gameState.gameHistory.unshift({
            user: bet.user,
            betAmount: bet.amount,
            multiplier: bet.cashoutMultiplier,
            payout: bet.profit,
            time: new Date()
        });
        
        // Keep history at a reasonable size
        if (gameState.gameHistory.length > 20) {
            gameState.gameHistory.pop();
        }
        
        // Update history table
        updateHistoryTable();
        
        // Update global bets
        saveGlobalBets();
        
        // Update UI
        updateActiveBetsList();
        
        // Reset UI for current user
        if (currentUser && bet.user === currentUser.username) {
            betButton.disabled = false;
            cashoutButton.style.display = 'none';
        }
        
        // Display cashout notification
        showCashoutNotification(bet);
    }
    
    // Update bet in Supabase after cashout
    async function updateBetInSupabase(bet) {
        if (!window.SupabaseDB) return;
        
        try {
            // Find the bet to update
            const { data: bets, error: betsError } = await window.SupabaseDB
                .from('crash_bets')
                .select('id')
                .eq('user_id', bet.userId)
                .is('cashout_multiplier', null)
                .order('created_at', { ascending: false })
                .limit(1);
                
            if (betsError) {
                console.error('Error finding bet to update:', betsError);
                return;
            }
            
            if (!bets || bets.length === 0) {
                console.error('No matching bet found to update');
                return;
            }
            
            // Update the bet
            const betId = bets[0].id;
            const { error: updateError } = await window.SupabaseDB
                .from('crash_bets')
                .update({
                    cashout_multiplier: bet.cashoutMultiplier,
                    profit: bet.profit
                })
                .eq('id', betId);
                
            if (updateError) {
                console.error('Error updating bet:', updateError);
                return;
            }
            
            console.log('Bet updated in Supabase');
        } catch (error) {
            console.error('Error updating bet in Supabase:', error);
        }
    }
    
    function showCrashAnimation() {
        // Add explosion particles
        const explosionCount = 100; // More particles for better explosion
        const rocketX = gameState.rocket.x;
        const rocketY = gameState.rocket.y;
        
        for (let i = 0; i < explosionCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 6 + 3;
            
            gameState.particles.push({
                x: rocketX + (Math.random() - 0.5) * 40,
                y: rocketY + (Math.random() - 0.5) * 40,
                radius: Math.random() * 10 + 4, // Larger explosion particles
                color: Math.random() < 0.6 ? '#ff4b2b' : (Math.random() < 0.5 ? '#ff9d00' : '#ffea00'),
                alpha: 1,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: Math.random() * 80 + 40 // Longer life for explosion particles
            });
        }
        
        // Explosion animation
        const animateExplosion = () => {
            // Update particles
            for (let i = 0; i < gameState.particles.length; i++) {
                const particle = gameState.particles[i];
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.alpha -= 0.008; // Slower fade for longer explosion
                particle.life--;
                
                // Apply gravity to particles
                particle.vy += 0.05;
                
                // Remove dead particles
                if (particle.life <= 0 || particle.alpha <= 0) {
                    gameState.particles.splice(i, 1);
                    i--;
                }
            }
            
            // Draw explosion
            draw();
            
            // Continue animation if particles still exist
            if (gameState.particles.length > 0) {
                requestAnimationFrame(animateExplosion);
            }
        };
        
        // Start explosion animation
        animateExplosion();
        
        // Show crash multiplier
        multiplierDisplay.textContent = 'CRASH @ ' + gameState.currentMultiplier.toFixed(2) + 'x';
        multiplierDisplay.style.color = '#ff4b2b';
        multiplierDisplay.style.textShadow = '0 0 20px rgba(255, 75, 43, 0.8)';
        
        // Reset display after a delay
        setTimeout(() => {
            multiplierDisplay.style.color = '#fff';
            multiplierDisplay.style.textShadow = '0 0 20px rgba(255, 255, 255, 0.5)';
        }, 3000);
    }
    
    function showCashoutNotification(bet) {
        // Create notification
        const notification = document.createElement('div');
        notification.className = 'cashout-notification';
        notification.innerHTML = `
            <strong>${bet.user}</strong> cashed out at <strong>${bet.cashoutMultiplier.toFixed(2)}x</strong>
            <span class="profit">+${bet.profit.toFixed(2)}</span>
        `;
        
        // Style notification
        notification.style.position = 'absolute';
        notification.style.left = '20px';
        notification.style.top = '20%';
        notification.style.background = 'rgba(24, 231, 124, 0.8)';
        notification.style.padding = '10px 15px';
        notification.style.borderRadius = '5px';
        notification.style.color = '#fff';
        notification.style.fontWeight = 'bold';
        notification.style.zIndex = '10';
        notification.style.opacity = '0';
        notification.style.transition = 'all 0.3s ease';
        
        // Add to board
        rocketBoard.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(10px)';
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(0)';
            
            setTimeout(() => {
                rocketBoard.removeChild(notification);
            }, 300);
        }, 2000);
    }
    
    function updateActiveBetsList() {
        activeBetsList.innerHTML = '';
        
        if (gameState.activeBets.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-bets-message';
            emptyMessage.textContent = 'No active bets';
            emptyMessage.style.color = 'rgba(255, 255, 255, 0.5)';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.fontStyle = 'italic';
            emptyMessage.style.padding = '20px 0';
            activeBetsList.appendChild(emptyMessage);
            return;
        }
        
        for (const bet of gameState.activeBets) {
            const betItem = document.createElement('div');
            betItem.className = 'active-bet-item';
            
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            userInfo.textContent = bet.user;
            
            const betInfo = document.createElement('div');
            betInfo.className = 'bet-info';
            
            const betAmount = document.createElement('div');
            betAmount.className = 'bet-amount';
            betAmount.textContent = bet.amount.toFixed(2);
            
            const autoCashout = document.createElement('div');
            autoCashout.className = 'auto-cashout';
            autoCashout.textContent = 'Auto: ' + bet.autoCashout.toFixed(2) + 'x';
            autoCashout.style.fontSize = '12px';
            autoCashout.style.color = 'rgba(255, 255, 255, 0.7)';
            
            betInfo.appendChild(betAmount);
            betInfo.appendChild(autoCashout);
            
            betItem.appendChild(userInfo);
            betItem.appendChild(betInfo);
            
            if (bet.cashedOut) {
                betItem.style.opacity = '0.5';
                
                const cashoutInfo = document.createElement('div');
                cashoutInfo.className = 'cashout-info';
                cashoutInfo.textContent = bet.cashoutMultiplier.toFixed(2) + 'x';
                cashoutInfo.style.color = '#18e77c';
                cashoutInfo.style.fontWeight = 'bold';
                
                betItem.appendChild(cashoutInfo);
            }
            
            activeBetsList.appendChild(betItem);
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
            
            // Multiplier cell
            const multiplierCell = document.createElement('td');
            multiplierCell.textContent = item.multiplier.toFixed(2) + 'x';
            if (item.multiplier == 0) {
                multiplierCell.style.color = '#ff4444';
            } else if (item.multiplier >= 2) {
                multiplierCell.style.color = '#18e77c';
            }
            
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
    
    function loadGameHistory() {
        // Generate random history data
        const usernames = ['Player123', 'LuckyGuy', 'RocketMan', 'CrashKing', 'MoonShot'];
        
        // Get current user if available
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (currentUser) {
            usernames.push(currentUser.username);
        }
        
        // Generate random history
        for (let i = 0; i < 10; i++) {
            const username = usernames[Math.floor(Math.random() * usernames.length)];
            const betAmount = Math.random() * 100 + 10;
            const multiplier = Math.random() < 0.3 ? 0 : (Math.random() * 10 + 1.01);
            const payout = multiplier === 0 ? -betAmount : betAmount * (multiplier - 1);
            
            gameState.gameHistory.push({
                user: username,
                betAmount,
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
    
    function draw() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background
        drawBackground();
        
        // Draw stars
        drawStars();
        
        // Draw particles
        drawParticles();
        
        // Draw rocket
        drawRocket();
    }
    
    function drawBackground() {
        // Draw gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0d1321');
        gradient.addColorStop(0.5, '#141b2d');
        gradient.addColorStop(1, '#1c2639');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    function drawStars() {
        // Update star positions
        for (const star of gameState.stars) {
            star.y += star.speed;
            
            // Reset stars that go off screen
            if (star.y > canvas.height) {
                star.y = 0;
                star.x = Math.random() * canvas.width;
            }
            
            // Draw star
            ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    function drawParticles() {
        // Draw all particles
        for (const particle of gameState.particles) {
            ctx.fillStyle = particle.color + Math.floor(particle.alpha * 255).toString(16).padStart(2, '0');
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    function drawRocket() {
        // Save current context
        ctx.save();
        
        // Translate to rocket position
        ctx.translate(gameState.rocket.x, gameState.rocket.y);
        
        // Rotate rocket
        ctx.rotate(gameState.rocket.angle);
        
        // Scale rocket
        ctx.scale(gameState.rocket.scale, gameState.rocket.scale);
        
        // Draw rocket body
        ctx.fillStyle = '#ff4b2b';
        ctx.beginPath();
        ctx.moveTo(0, -gameState.rocket.height / 2);
        ctx.lineTo(gameState.rocket.width / 2, gameState.rocket.height / 2);
        ctx.lineTo(-gameState.rocket.width / 2, gameState.rocket.height / 2);
        ctx.closePath();
        ctx.fill();
        
        // Add rocket body highlight
        const bodyGradient = ctx.createLinearGradient(
            -gameState.rocket.width / 2, 
            -gameState.rocket.height / 2,
            gameState.rocket.width / 2,
            gameState.rocket.height / 2
        );
        bodyGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        bodyGradient.addColorStop(1, 'rgba(255, 75, 43, 0.0)');
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.moveTo(0, -gameState.rocket.height / 2);
        ctx.lineTo(gameState.rocket.width / 2, gameState.rocket.height / 2);
        ctx.lineTo(-gameState.rocket.width / 2, gameState.rocket.height / 2);
        ctx.closePath();
        ctx.fill();
        
        // Draw rocket window
        ctx.fillStyle = '#1c2639';
        ctx.beginPath();
        ctx.arc(0, -gameState.rocket.height / 8, gameState.rocket.width / 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Add window reflection
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(
            -gameState.rocket.width / 10, 
            -gameState.rocket.height / 8 - gameState.rocket.width / 12,
            gameState.rocket.width / 12, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw rocket fins
        ctx.fillStyle = '#ff9d00';
        
        // Left fin
        ctx.beginPath();
        ctx.moveTo(-gameState.rocket.width / 2, gameState.rocket.height / 3);
        ctx.lineTo(-gameState.rocket.width, gameState.rocket.height / 2);
        ctx.lineTo(-gameState.rocket.width / 2, gameState.rocket.height / 2);
        ctx.closePath();
        ctx.fill();
        
        // Right fin
        ctx.beginPath();
        ctx.moveTo(gameState.rocket.width / 2, gameState.rocket.height / 3);
        ctx.lineTo(gameState.rocket.width, gameState.rocket.height / 2);
        ctx.lineTo(gameState.rocket.width / 2, gameState.rocket.height / 2);
        ctx.closePath();
        ctx.fill();
        
        // Add fin highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        
        // Left fin highlight
        ctx.beginPath();
        ctx.moveTo(-gameState.rocket.width / 2, gameState.rocket.height / 3);
        ctx.lineTo(-gameState.rocket.width * 0.8, gameState.rocket.height / 2.5);
        ctx.lineTo(-gameState.rocket.width / 2, gameState.rocket.height / 2.2);
        ctx.closePath();
        ctx.fill();
        
        // Right fin highlight
        ctx.beginPath();
        ctx.moveTo(gameState.rocket.width / 2, gameState.rocket.height / 3);
        ctx.lineTo(gameState.rocket.width * 0.8, gameState.rocket.height / 2.5);
        ctx.lineTo(gameState.rocket.width / 2, gameState.rocket.height / 2.2);
        ctx.closePath();
        ctx.fill();
        
        // Restore context
        ctx.restore();
    }
    
    function handleCrash() {
        // Stop game activity
        gameState.gameActive = false;
        
        // Play crash sound
        playCrashSound();
        
        // Show crash animation
        showCrashAnimation();
        
        // Display crash message
        multiplierDisplay.textContent = `CRASH @ ${gameState.currentMultiplier.toFixed(2)}x`;
        multiplierDisplay.style.color = '#ff4b2b';
        multiplierDisplay.style.animation = 'crash-text 0.5s ease';
        
        // Cancel animation
        if (gameState.animationFrame) {
            cancelAnimationFrame(gameState.animationFrame);
            gameState.animationFrame = null;
        }
        
        // Process all remaining bets as losses
        gameState.activeBets.forEach(bet => {
            // Only process bets that haven't been cashed out
            if (!bet.cashedOut) {
                // Add to history as a loss
                addGameHistoryEntry(bet.user, bet.amount, 0, true);
            }
        });
        
        // Add crash to recent crashes with proper color
        const crashPoint = gameState.currentMultiplier.toFixed(2);
        const crashColor = gameState.currentMultiplier < 2 ? '#ff4444' : '#18e77c';
        gameState.recentCrashes.unshift({ 
            multiplier: parseFloat(crashPoint),
            color: crashColor
        });
        
        // Keep only the most recent 8 crashes
        if (gameState.recentCrashes.length > 8) {
            gameState.recentCrashes.pop();
        }
        
        // Update crash history display
        updateCrashHistoryDisplay();
        
        // Save crash history
        saveCrashHistory();
        
        // Save global state
        saveGlobalState();
        
        // Save to Supabase if connected
        if (supabaseEnabled && window.SupabaseDB) {
            try {
                // Find most recent game that doesn't have a crash point
                window.SupabaseDB
                    .from('crash_games')
                    .select('id')
                    .is('crash_point', null)
                    .order('started_at', { ascending: false })
                    .limit(1)
                    .then(response => {
                        if (response.error) {
                            console.error('Error finding game to update:', response.error);
                            return;
                        }
                        
                        let gameId;
                        
                        // If no game found, create a new one
                        if (!response.data || response.data.length === 0) {
                            window.SupabaseDB
                                .from('crash_games')
                                .insert({
                                    crash_point: gameState.currentMultiplier,
                                    started_at: new Date(gameState.serverStartTime).toISOString(),
                                    ended_at: new Date().toISOString()
                                })
                                .select()
                                .then(insertResponse => {
                                    if (insertResponse.error) {
                                        console.error('Error creating crash game:', insertResponse.error);
                                        return;
                                    }
                                    
                                    if (insertResponse.data && insertResponse.data.length > 0) {
                                        gameId = insertResponse.data[0].id;
                                        processActiveBets(gameId);
                                    }
                                });
                        } else {
                            // Update existing game
                            gameId = response.data[0].id;
                            
                            window.SupabaseDB
                                .from('crash_games')
                                .update({
                                    crash_point: gameState.currentMultiplier,
                                    ended_at: new Date().toISOString()
                                })
                                .eq('id', gameId)
                                .then(updateResponse => {
                                    if (updateResponse.error) {
                                        console.error('Error updating crash game:', updateResponse.error);
                                        return;
                                    }
                                    
                                    processActiveBets(gameId);
                                });
                        }
                    });
            } catch (error) {
                console.error('Error interacting with Supabase:', error);
            }
        }
        
        // Process active bets
        function processActiveBets(gameId) {
            if (!gameId) return;
            
            // Get current user
            const user = window.BetaAuth?.getCurrentUser();
            if (!user) return;
            
            // Process each active bet
            gameState.activeBets.forEach(bet => {
                // Only update bets that haven't been processed
                if (bet.processed) return;
                
                window.SupabaseDB
                    .from('crash_bets')
                    .select('id')
                    .eq('user_id', bet.userId || user.id)
                    .is('cashout_multiplier', null)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .then(response => {
                        if (response.error || !response.data || response.data.length === 0) {
                            return;
                        }
                        
                        const betId = response.data[0].id;
                        
                        // Update bet with crash result
                        window.SupabaseDB
                            .from('crash_bets')
                            .update({
                                cashout_multiplier: bet.cashedOut ? bet.cashoutMultiplier : 0,
                                profit: bet.cashedOut ? bet.profit : -bet.amount
                            })
                            .eq('id', betId)
                            .then(updateResponse => {
                                if (updateResponse.error) {
                                    console.error('Error updating bet after crash:', updateResponse.error);
                                } else {
                                    bet.processed = true;
                                }
                            });
                    });
            });
        }
        
        // Clear active bets
        gameState.activeBets = [];
        saveGlobalBets();
        
        // Broadcast crash via Supabase if available
        if (supabaseEnabled) {
            broadcastCrash();
        }
        
        // Update UI
        updateActiveBetsList();
        
        // Reset buttons for current user
        const currentUser = window.BetaAuth?.getCurrentUser();
        if (currentUser) {
            betButton.disabled = false;
            cashoutButton.style.display = 'none';
        }
        
        // Start new game countdown after a delay
        setTimeout(() => {
            startGameCountdown();
        }, 3000);
    }
    
    // Helper function to add game history entry
    function addGameHistoryEntry(username, betAmount, multiplier, isLoss = false) {
        // Calculate payout
        const payout = isLoss ? -betAmount : betAmount * (multiplier - 1);
        
        // Create history entry
        const historyEntry = {
            user: username,
            betAmount: betAmount,
            multiplier: isLoss ? 0 : multiplier,
            payout: payout,
            time: new Date()
        };
        
        // Add to game history
        gameState.gameHistory.unshift(historyEntry);
        
        // Keep history at a reasonable size
        if (gameState.gameHistory.length > 20) {
            gameState.gameHistory.pop();
        }
        
        // Update history table
        updateHistoryTable();
    }
}); 