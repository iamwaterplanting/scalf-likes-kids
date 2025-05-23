// BetaGames Leaderboard
console.log('Leaderboard module loaded');

document.addEventListener('DOMContentLoaded', () => {
    // Initialize leaderboard
    initLeaderboard();
});

// Initialize the leaderboard
async function initLeaderboard() {
    // Check if the leaderboard elements exist
    const leaderboardList = document.getElementById('leaderboardList');
    const topPlayersPreview = document.getElementById('topPlayersPreview');
    const leaderboardBody = document.getElementById('leaderboardBody');
    const leaderboardToggle = document.querySelector('.leaderboard-toggle');
    
    if (!leaderboardList) return;
    
    console.log('Initializing leaderboard');
    
    // Setup toggle functionality for leaderboard
    if (leaderboardToggle && leaderboardBody) {
        leaderboardToggle.addEventListener('click', () => {
            // Toggle collapsed state
            leaderboardBody.classList.toggle('collapsed');
            leaderboardToggle.classList.toggle('collapsed');
            
            // Save preference to localStorage
            const isCollapsed = leaderboardBody.classList.contains('collapsed');
            localStorage.setItem('leaderboardCollapsed', isCollapsed.toString());
        });
        
        // Check if leaderboard was previously collapsed
        const wasCollapsed = localStorage.getItem('leaderboardCollapsed') === 'true';
        if (wasCollapsed) {
            leaderboardBody.classList.add('collapsed');
            leaderboardToggle.classList.add('collapsed');
        }
    }
    
    // Load leaderboard data
    await loadLeaderboard();
    
    // Set up real-time subscription if Supabase is available
    setupSupabaseSubscription();
    
    // Refresh leaderboard data every 2 minutes as fallback
    setInterval(loadLeaderboard, 120000);
}

// Get custom rank emoji based on position
function getRankEmoji(rank) {
    switch(rank) {
        case 1:
            return '<i class="fas fa-crown rank-1-icon"></i>';
        case 2:
            return '<i class="fas fa-medal rank-2-icon"></i>';
        case 3:
            return '<i class="fas fa-award rank-3-icon"></i>';
        default:
            return `<div class="player-rank rank-${rank <= 10 ? rank : ''}">${rank}</div>`;
    }
}

// Set up Supabase real-time subscription for leaderboard updates
function setupSupabaseSubscription() {
    if (!window.SupabaseDB) {
        console.log('Supabase not available for real-time leaderboard updates');
        return;
    }
    
    try {
        // Subscribe to user changes
        window.SupabaseDB
            .channel('users-channel')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'users'
            }, payload => {
                console.log('User data change detected, refreshing leaderboard');
                loadLeaderboard();
            })
            .subscribe();
            
        console.log('Subscribed to real-time leaderboard updates');
    } catch (error) {
        console.error('Error setting up Supabase leaderboard subscription:', error);
    }
}

// Load leaderboard data from Supabase
async function loadLeaderboard() {
    try {
        console.log('Loading leaderboard data');
        const leaderboardList = document.getElementById('leaderboardList');
        const topPlayersPreview = document.getElementById('topPlayersPreview');
        
        if (!leaderboardList || !topPlayersPreview) return;
        
        // Show loading state
        leaderboardList.innerHTML = '<li class="leaderboard-loading">Loading top players...</li>';
        topPlayersPreview.innerHTML = '<div class="player-item leaderboard-loading">Loading top players...</div>';
        
        // Ensure Supabase is properly configured
        if (!window.SupabaseDB) {
            console.error('Supabase not configured properly');
            loadMockLeaderboardData();
            return;
        }
        
        // Fetch top 10 users ordered by balance
        const { data, error } = await window.SupabaseDB
            .from('users')
            .select('id, username, balance, avatar')
            .order('balance', { ascending: false })
            .limit(10);
            
        if (error) {
            console.error('Supabase query error:', error);
            throw error;
        }
        
        console.log('Leaderboard data:', data);
        
        // If no data, show mock data instead
        if (!data || data.length === 0) {
            console.log('No leaderboard data found, using mock data');
            loadMockLeaderboardData();
            return;
        }
        
        // Clear the lists
        leaderboardList.innerHTML = '';
        topPlayersPreview.innerHTML = '';
        
        // Show top 3 players in the preview section
        const topPlayers = data.slice(0, 3);
        topPlayers.forEach((player, index) => {
            const rank = index + 1;
            const avatarUrl = player.avatar || '../assets/default-avatar.svg';
            
            // Create the top player item with custom emoji
            const previewItem = document.createElement('div');
            previewItem.className = 'player-item';
            previewItem.innerHTML = `
                ${getRankEmoji(rank)}
                <img src="${avatarUrl}" alt="${player.username}" class="player-avatar">
                <div class="player-info">
                    <div class="player-name">${player.username}</div>
                    <div class="player-balance">${Math.floor(player.balance).toLocaleString()} coins</div>
                </div>
            `;
            
            topPlayersPreview.appendChild(previewItem);
        });
        
        // Add all players to the full leaderboard
        data.forEach((player, index) => {
            const rank = index + 1;
            const avatarUrl = player.avatar || '../assets/default-avatar.svg';
            
            // Check if user is current user
            const currentUser = window.BetaAuth?.getCurrentUser();
            const isCurrentUser = currentUser && currentUser.id === player.id;
            
            // Check if user is owner
            const isOwner = window.BetaAdmin && window.BetaAdmin.isOwner && window.BetaAdmin.isOwner(player.username);
            
            const listItem = document.createElement('li');
            if (isCurrentUser) {
                listItem.className = 'current-user';
                listItem.style.backgroundColor = 'rgba(24, 231, 124, 0.1)';
                listItem.style.borderLeft = '3px solid var(--primary-color)';
            }
            
            listItem.innerHTML = `
                ${getRankEmoji(rank)}
                <img src="${avatarUrl}" alt="${player.username}" class="player-avatar">
                <div class="player-info">
                    <div class="player-name">
                        ${player.username}
                        ${isOwner ? '<i class="fas fa-crown" style="color: gold; margin-left: 5px; font-size: 0.8em;"></i>' : ''}
                        ${isCurrentUser ? '<span style="color: var(--primary-color); margin-left: 5px; font-size: 0.8em;">(You)</span>' : ''}
                    </div>
                    <div class="player-balance">${Math.floor(player.balance).toLocaleString()} coins</div>
                </div>
            `;
            
            leaderboardList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        console.log('Falling back to mock data');
        
        // Use mock data if there's an error
        loadMockLeaderboardData();
    }
}

// Mock data for testing (will be used if Supabase fails)
function loadMockLeaderboardData() {
    const leaderboardList = document.getElementById('leaderboardList');
    const topPlayersPreview = document.getElementById('topPlayersPreview');
    
    if (!leaderboardList || !topPlayersPreview) return;
    
    const mockPlayers = [
        { username: 'CasinoKing', balance: 25680, avatar_url: '../assets/default-avatar.svg' },
        { username: 'BigWinner', balance: 18450, avatar_url: '../assets/default-avatar.svg' },
        { username: 'LuckyGuy', balance: 12750, avatar_url: '../assets/default-avatar.svg' },
        { username: 'PlinkoMaster', balance: 9840, avatar_url: '../assets/default-avatar.svg' },
        { username: 'Player123', balance: 7520, avatar_url: '../assets/default-avatar.svg' },
        { username: 'GamblerPro', balance: 6320, avatar_url: '../assets/default-avatar.svg' },
        { username: 'BetaChamp', balance: 4890, avatar_url: '../assets/default-avatar.svg' },
        { username: 'RollTheNice', balance: 3750, avatar_url: '../assets/default-avatar.svg' },
        { username: 'SlotKing', balance: 2430, avatar_url: '../assets/default-avatar.svg' },
        { username: 'WinnerAlways', balance: 1280, avatar_url: '../assets/default-avatar.svg' }
    ];
    
    // Clear the lists
    leaderboardList.innerHTML = '';
    topPlayersPreview.innerHTML = '';
    
    // Show top 3 players in the preview section
    const topPlayers = mockPlayers.slice(0, 3);
    topPlayers.forEach((player, index) => {
        const rank = index + 1;
        
        // Create the top player item with custom emoji
        const previewItem = document.createElement('div');
        previewItem.className = 'player-item';
        previewItem.innerHTML = `
            ${getRankEmoji(rank)}
            <img src="${player.avatar_url}" alt="${player.username}" class="player-avatar">
            <div class="player-info">
                <div class="player-name">${player.username}</div>
                <div class="player-balance">${player.balance.toLocaleString()} coins</div>
            </div>
        `;
        
        topPlayersPreview.appendChild(previewItem);
    });
    
    // Add all players to the full leaderboard
    mockPlayers.forEach((player, index) => {
        const rank = index + 1;
        
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            ${getRankEmoji(rank)}
            <img src="${player.avatar_url}" alt="${player.username}" class="player-avatar">
            <div class="player-info">
                <div class="player-name">${player.username}</div>
                <div class="player-balance">${player.balance.toLocaleString()} coins</div>
            </div>
        `;
        
        leaderboardList.appendChild(listItem);
    });
}

// Function to create initial users for testing - call this from console if needed
async function createInitialUsers() {
    if (!window.SupabaseDB) {
        console.error('Supabase not configured');
        return;
    }
    
    const testUsers = [
        { username: 'CasinoKing', balance: 25680 },
        { username: 'BigWinner', balance: 18450 },
        { username: 'LuckyGuy', balance: 12750 },
        { username: 'PlinkoMaster', balance: 9840 },
        { username: 'Player123', balance: 7520 },
        { username: 'GamblerPro', balance: 6320 },
        { username: 'BetaChamp', balance: 4890 },
        { username: 'RollTheNice', balance: 3750 },
        { username: 'SlotKing', balance: 2430 },
        { username: 'WinnerAlways', balance: 1280 }
    ];
    
    for (const user of testUsers) {
        try {
            const { data, error } = await window.SupabaseDB
                .from('users')
                .upsert({
                    id: crypto.randomUUID(), // Generate UUID
                    username: user.username,
                    balance: user.balance,
                    avatar: '../assets/default-avatar.svg'
                });
                
            if (error) {
                console.error(`Error creating user ${user.username}:`, error);
            } else {
                console.log(`Created/updated user ${user.username}`);
            }
        } catch (e) {
            console.error(`Error creating user ${user.username}:`, e);
        }
    }
}

// Export functions for global access
window.BetaLeaderboard = {
    refresh: loadLeaderboard,
    createTestData: createInitialUsers
}; 