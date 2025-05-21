// BetaGames Main JS
document.addEventListener('DOMContentLoaded', () => {
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
    try {
        const { data: history, error } = await window.SupabaseDB
            .from('game_history')
            .select('*')
            .order('time', { ascending: false })
            .limit(100);

        if (error) throw error;

        gameHistory = history;
        updateActivityTable(gameHistory);
    } catch (error) {
        console.error('Error loading game history:', error);
        // Fall back to localStorage if Supabase is unavailable
        const localHistory = JSON.parse(localStorage.getItem('betagames_history') || '[]');
        gameHistory = localHistory;
        updateActivityTable(gameHistory);
    }
}

// Function to initialize activity with real data
function initRealActivity() {
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
        userCell.textContent = activity.user;
        
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
    let amount = 0;
    let validCode = true;
    switch (code.toUpperCase()) {
        case 'WELCOME': amount = 5000; break;
        case 'BONUS': amount = 10000; break;
        case 'VIP': amount = 50000; break;
        case 'LOL': amount = 100; break;
        case 'BETAGAMES': amount = 1000; break;
        case 'FREEMONEY': amount = 2500; break;
        default: validCode = false;
    }
    if (!validCode) {
        alert('Invalid redeem code');
        return;
    }
    window.BetaAuth.updateBalance(amount, 'redeem');
    alert(`Successfully redeemed code for ${amount} coins!`);
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
        user: username,
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