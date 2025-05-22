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
    
    // Refresh leaderboard data every 2 minutes
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
            return `<div class="player-rank rank-${rank}">${rank}</div>`;
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
            .from('profiles')
            .select('username, balance, avatar_url')
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
            const avatarUrl = player.avatar_url || '../assets/default-avatar.svg';
            
            // Create the top player item with custom emoji
            const previewItem = document.createElement('div');
            previewItem.className = 'player-item';
            previewItem.innerHTML = `
                ${getRankEmoji(rank)}
                <img src="${avatarUrl}" alt="${player.username}" class="player-avatar">
                <div class="player-info">
                    <div class="player-name">${player.username}</div>
                    <div class="player-balance">${player.balance.toLocaleString()} coins</div>
                </div>
            `;
            
            topPlayersPreview.appendChild(previewItem);
        });
        
        // Add all players to the full leaderboard
        data.forEach((player, index) => {
            const rank = index + 1;
            const avatarUrl = player.avatar_url || '../assets/default-avatar.svg';
            
            // Check if user is owner
            const isOwner = window.BetaAdmin && window.BetaAdmin.isOwner && window.BetaAdmin.isOwner(player.username);
            
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                ${getRankEmoji(rank)}
                <img src="${avatarUrl}" alt="${player.username}" class="player-avatar">
                <div class="player-info">
                    <div class="player-name">
                        ${player.username}
                        ${isOwner ? '<i class="fas fa-crown" style="color: gold; margin-left: 5px; font-size: 0.8em;"></i>' : ''}
                    </div>
                    <div class="player-balance">${player.balance.toLocaleString()} coins</div>
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

// Export functions for global access
window.BetaLeaderboard = {
    refresh: loadLeaderboard
}; 