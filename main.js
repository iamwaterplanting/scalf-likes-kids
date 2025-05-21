// BetaGames Main JS
document.addEventListener('DOMContentLoaded', () => {
    // Check server availability
    checkServerStatus();
    
    // Initialize real game activity history
    initRealActivity();
    
    // Initialize redeem code functionality
    initRedeemCode();
    
    // Add animations to game cards
    animateGameCards();
});

// Game history and activity tracking
let gameHistory = [];

// Function to load game history from the server
function loadGameHistory() {
    fetch('/api/history')
        .then(response => response.json())
        .then(data => {
            gameHistory = data;
            updateActivityTable(gameHistory);
        })
        .catch(error => {
            console.error('Error loading game history:', error);
            // Fall back to localStorage if server is unavailable
            const localHistory = JSON.parse(localStorage.getItem('betagames_history') || '[]');
            gameHistory = localHistory;
            updateActivityTable(gameHistory);
        });
}

// Function to initialize activity with real data
function initRealActivity() {
    // Load history from MongoDB
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

// Process redeem code using MongoDB or fallback to local
function processRedeemCode(code) {
    // Get the current user
    const currentUser = window.BetaAuth?.getCurrentUser();
    if (!currentUser) {
        alert('You need to be logged in to redeem codes.');
        return;
    }
    
    // First try server
    fetch('/api/redeem', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            code: code,
            username: currentUser.username
        }),
    })
    .then(response => {
        // Check for non-JSON responses (server unavailable)
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            // Fallback to local processing
            processLocalRedeemCode(code, currentUser);
            return null;
        }
        
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'Invalid redeem code');
            });
        }
        return response.json();
    })
    .then(data => {
        if (!data) return; // Skip if we used local processing
        
        // Update local balance to match server
        if (window.BetaAuth) {
            // Update UI with new balance
            currentUser.balance = data.balance;
            localStorage.setItem('betagames_user', JSON.stringify(currentUser));
            document.querySelector('.balance-amount').textContent = new Intl.NumberFormat().format(currentUser.balance);
        }
        
        alert(`Successfully redeemed code for ${data.amount} coins!`);
        
        // Log to Discord
        window.BetaAuth.logToDiscord(`Redeem code "${code}" used for ${data.amount} coins`);
    })
    .catch(error => {
        console.error('Redeem error:', error);
        // Fallback to local processing on any error
        processLocalRedeemCode(code, currentUser);
    });
}

// Local fallback for redeem codes when server is unavailable
function processLocalRedeemCode(code, currentUser) {
    console.log('Server unavailable, processing redeem code locally');
    
    // List of valid codes and their rewards
    let amount = 0;
    let validCode = true;
    
    switch (code.toUpperCase()) {
        case 'WELCOME':
            amount = 5000;
            break;
        case 'BONUS':
            amount = 10000;
            break;
        case 'VIP':
            amount = 50000;
            break;
        case 'LOL':
            amount = 100;
            break;
        case 'BETAGAMES':
            amount = 1000;
            break;
        case 'FREEMONEY':
            amount = 2500;
            break;
        default:
            validCode = false;
    }
    
    if (validCode && window.BetaAuth) {
        const success = window.BetaAuth.updateBalance(amount, 'redeem code');
        
        if (success) {
            alert(`Successfully redeemed code for ${amount} coins!`);
            window.BetaAuth.logToDiscord(`Redeem code "${code}" used for ${amount} coins`);
        } else {
            alert('There was an error processing your code.');
        }
    } else if (!validCode) {
        alert('Invalid redeem code. Please try another code.');
    }
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
function trackGameBet(gameType, betAmount, result) {
    const currentUser = window.BetaAuth?.getCurrentUser();
    if (!currentUser) return;
    
    const username = currentUser.username;
    const timestamp = new Date();
    
    // Create bet record
    const betRecord = {
        user: username,
        game: gameType,
        bet: betAmount,
        result: result,
        time: timestamp
    };
    
    // Send to server
    fetch('/api/history', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(betRecord),
    })
    .catch(error => {
        console.error('Error saving game history:', error);
        
        // Fallback to localStorage if server is unavailable
        gameHistory.unshift(betRecord);
        
        // Keep history at a reasonable size
        if (gameHistory.length > 100) {
            gameHistory.pop();
        }
        
        localStorage.setItem('betagames_history', JSON.stringify(gameHistory));
    });
    
    // Add to local history for immediate UI update
    gameHistory.unshift(betRecord);
    
    // Keep history at a reasonable size
    if (gameHistory.length > 100) {
        gameHistory.pop();
    }
    
    // Update activity table
    updateActivityTable(gameHistory);
    
    // Log to Discord webhook
    if (window.BetaAuth) {
        const resultText = result >= 0 ? `won ${result}` : `lost ${Math.abs(result)}`;
        window.BetaAuth.logToDiscord(`${username} ${resultText} coins playing ${gameType}`);
    }
    
    return betRecord;
}

// Export functions for use in game pages
window.BetaGames = {
    trackGameBet,
    formatCurrency,
    formatTime,
    gameHistory
};

// Check if the server is available
function checkServerStatus() {
    const statusIndicator = document.createElement('div');
    statusIndicator.id = 'serverStatus';
    statusIndicator.style.position = 'fixed';
    statusIndicator.style.top = '5px';
    statusIndicator.style.right = '5px';
    statusIndicator.style.padding = '2px 5px';
    statusIndicator.style.fontSize = '10px';
    statusIndicator.style.borderRadius = '3px';
    statusIndicator.style.zIndex = '1000';
    
    // Add to document
    document.body.appendChild(statusIndicator);
    
    // Try to connect to server
    fetch('/api/users/online')
        .then(response => {
            if (response.ok) {
                statusIndicator.textContent = 'SERVER: ONLINE';
                statusIndicator.style.backgroundColor = '#18e77c';
                statusIndicator.style.color = '#0c0e1a';
            } else {
                throw new Error('Server error');
            }
        })
        .catch(error => {
            statusIndicator.textContent = 'SERVER: OFFLINE (LOCAL MODE)';
            statusIndicator.style.backgroundColor = '#f15a5a';
            statusIndicator.style.color = 'white';
            console.log('Server is offline, using local mode');
        });
} 