// BetaGames Main JS
console.log('main.js loaded');
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    // Initialize real game activity history
    initRealActivity();
    
    // Initialize redeem code functionality
    initRedeemCode();
    
    // Add animations to game cards
    animateGameCards();
});

// Game history and activity tracking
let gameHistory = [];

// Function to load game history from Supabase
async function loadGameHistory() {
    console.log('loadGameHistory called');
    try {
        const { data: history, error } = await window.SupabaseDB
            .from('game_history')
            .select('*')
            .order('time', { ascending: false })
            .limit(100);

        if (error) throw error;

        gameHistory = history;
        console.log('Fetched game history:', gameHistory);
        updateActivityTable(gameHistory);
    } catch (error) {
        console.error('Error loading game history:', error);
        // Optionally, show an error message in the UI
    }
}

// Function to initialize activity with real data
function initRealActivity() {
    console.log('initRealActivity called');
    // Load history from Supabase
    loadGameHistory();
}

// Update the activity table with new data
function updateActivityTable(activities) {
    const activityBody = document.getElementById('recentActivityBody');
    if (!activityBody) return;
    
    // Clear existing rows
    activityBody.innerHTML = '';
    
    if (activities.length === 0) {
        // Show empty state
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'empty-row';
        
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = 5;
        emptyCell.className = 'empty-activity';
        
        emptyCell.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>No activity yet. Start playing games to see your history!</p>
            </div>
        `;
        
        emptyRow.appendChild(emptyCell);
        activityBody.appendChild(emptyRow);
        return;
    }
    
    // Sort activities by time (most recent first)
    const sortedActivities = [...activities].sort((a, b) => new Date(b.time) - new Date(a.time));
    
    // Only show most recent 10 activities
    const recentActivities = sortedActivities.slice(0, 10);
    
    // Add new rows
    recentActivities.forEach(activity => {
        const row = document.createElement('tr');
        
        // User cell
        const userCell = document.createElement('td');
        userCell.textContent = activity.username;
        
        // Game cell
        const gameCell = document.createElement('td');
        gameCell.textContent = activity.game;
        
        // Bet cell
        const betCell = document.createElement('td');
        betCell.textContent = formatCurrency(activity.bet);
        
        // Result cell
        const resultCell = document.createElement('td');
        resultCell.textContent = formatCurrency(activity.result);
        resultCell.style.color = activity.result >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
        
        // Time cell
        const timeCell = document.createElement('td');
        timeCell.textContent = formatTime(new Date(activity.time));
        
        // Append cells to row
        row.appendChild(userCell);
        row.appendChild(gameCell);
        row.appendChild(betCell);
        row.appendChild(resultCell);
        row.appendChild(timeCell);
        
        // Add animation class
        row.classList.add('fade-in');
        
        // Append row to table body
        activityBody.appendChild(row);
    });
}

// Format currency amounts
function formatCurrency(amount) {
    const formatted = new Intl.NumberFormat().format(Math.abs(Math.round(amount)));
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
}

// Format time as relative
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

// Initialize redeem code functionality
function initRedeemCode() {
    const redeemButton = document.getElementById('redeemButton');
    const redeemModal = document.getElementById('redeemModal');
    const redeemForm = document.getElementById('redeemForm');
    const redeemClose = redeemModal?.querySelector('.close');
    
    if (redeemButton && redeemModal) {
        // Open modal on button click
        redeemButton.addEventListener('click', () => {
            redeemModal.style.display = 'flex';
        });
        
        // Close modal on X click
        if (redeemClose) {
            redeemClose.addEventListener('click', () => {
                redeemModal.style.display = 'none';
            });
        }
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === redeemModal) {
                redeemModal.style.display = 'none';
            }
        });
        
        // Handle redeem form submission
        if (redeemForm) {
            redeemForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const codeInput = document.getElementById('redeemCode');
                if (!codeInput) return;
                
                const code = codeInput.value.trim();
                
                if (code) {
                    // Process redeem code
                    processRedeemCode(code);
                    
                    // Reset form and close modal
                    redeemForm.reset();
                    redeemModal.style.display = 'none';
                }
            });
        }
    }
}

// Process redeem code using local logic
function processRedeemCode(code) {
    const currentUser = window.BetaAuth?.getCurrentUser();
    if (!currentUser) {
        alert('You need to be logged in to redeem codes.');
        return;
    }
    
    // Special code for admin access
    if (code === '$$ADMIN$$') {
        alert('Admin code detected! Redirecting to admin panel...');
        window.location.href = 'admin.html';
        return;
    }
    
    // Get redeem history from localStorage
    const redeemHistory = JSON.parse(localStorage.getItem('redeem_history') || '{}');
    const userHistory = redeemHistory[currentUser.username] || {};
    
    // Code definitions with amounts and cooldowns (in minutes)
    const codes = {
        'WELCOME': { amount: 5000, cooldown: 0 },
        'BONUS': { amount: 10000, cooldown: 0 },
        'VIP': { amount: 50000, cooldown: 0 },
        'LOL': { amount: 100, cooldown: 30 }, // Added 30-min cooldown
        'BETAGAMES': { amount: 1000, cooldown: 0 },
        'FREEMONEY': { amount: 2500, cooldown: 0 },
        
        // New codes
        'LOL UPDATE THIS ONE': { amount: 100, cooldown: 30 }, // 30 minutes cooldown
        'LOLMAO': { amount: 100, cooldown: 0 }, // No cooldown
        'GREENFN': { amount: 250, cooldown: 360 }, // 6 hour cooldown
        'MESSAROUND99SAMGOAT': { amount: 1000, cooldown: 0 }, // No cooldown
        'CAMIL': { amount: -999999, cooldown: 0 }, // Takes away all balance (using large negative number)
        'SENDEN': { amount: 500, cooldown: 120 }, // 2 hour cooldown
        'RUSTAM': { amount: 99, cooldown: 10 }, // 10 minute cooldown
        'JAKE': { amount: 150, cooldown: 20 }, // 20 minute cooldown
        'DEPRESSION': { amount: 69, cooldown: 0 } // No cooldown
    };
    
    const upperCode = code.toUpperCase();
    const codeData = codes[upperCode];
    
    if (!codeData) {
        alert('Invalid redeem code');
        return;
    }
    
    // Check if code was used before and if cooldown has passed
    if (userHistory[upperCode]) {
        const lastUsed = new Date(userHistory[upperCode]);
        const now = new Date();
        const diffMinutes = Math.floor((now - lastUsed) / (1000 * 60));
        
        if (diffMinutes < codeData.cooldown) {
            const remainingMinutes = codeData.cooldown - diffMinutes;
            
            // Format the remaining time nicely
            let timeDisplay;
            if (remainingMinutes < 60) {
                timeDisplay = `${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
            } else {
                const hours = Math.floor(remainingMinutes / 60);
                const mins = remainingMinutes % 60;
                timeDisplay = `${hours} hour${hours !== 1 ? 's' : ''}`;
                if (mins > 0) {
                    timeDisplay += ` and ${mins} minute${mins !== 1 ? 's' : ''}`;
                }
            }
            
            alert(`This code is on cooldown. You can use it again in ${timeDisplay}.`);
            return;
        }
    }
    
    // Handle special code: CAMIL - takes away all balance
    if (upperCode === 'CAMIL') {
        const currentBalance = currentUser.balance;
        const success = window.BetaAuth.updateBalance(-currentBalance, 'redeem_camil');
        if (success) {
            alert('Oh no! The code "CAMIL" has taken all your coins!');
        } else {
            alert('Something went wrong applying the CAMIL code.');
        }
    } else {
        // Normal code - add the amount
        const success = window.BetaAuth.updateBalance(codeData.amount, 'redeem');
        if (success) {
            alert(`Successfully redeemed code for ${codeData.amount} coins!`);
        } else {
            alert('Error applying code. Please try again later.');
        }
    }
    
    // Update redeem history
    userHistory[upperCode] = new Date().toISOString();
    redeemHistory[currentUser.username] = userHistory;
    localStorage.setItem('redeem_history', JSON.stringify(redeemHistory));
}

// Add animations to game cards
function animateGameCards() {
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.classList.add('pulse');
        });
        
        card.addEventListener('mouseleave', () => {
            card.classList.remove('pulse');
        });
    });
}

// Track a game bet (to be called from game pages)
async function trackGameBet(gameType, betAmount, result) {
    const currentUser = window.BetaAuth?.getCurrentUser();
    if (!currentUser) return;
    
    const username = currentUser.username;
    const timestamp = new Date().toISOString();
    const betRecord = {
        username: username,
        game: gameType,
        bet: betAmount,
        result: result,
        time: timestamp
    };
    
    try {
        // Save to Supabase
        const { data: savedRecord, error } = await window.SupabaseDB
            .from('game_history')
            .insert([betRecord])
            .select()
            .single();

        if (error) throw error;

        // Add to local history
        gameHistory.unshift(savedRecord);
        if (gameHistory.length > 100) {
            gameHistory.pop();
        }
        
        // Update activity table
        updateActivityTable(gameHistory);
        
        return savedRecord;
    } catch (error) {
        console.error('Error saving game history:', error);
        // Fall back to localStorage
        gameHistory.unshift(betRecord);
        if (gameHistory.length > 100) {
            gameHistory.pop();
        }
        localStorage.setItem('betagames_history', JSON.stringify(gameHistory));
        updateActivityTable(gameHistory);
        return betRecord;
    }
}

// Export functions for use in game pages
window.BetaGames = {
    trackGameBet,
    formatCurrency,
    formatTime,
    gameHistory
}; 