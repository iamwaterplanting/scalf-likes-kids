// BetaGames Admin Panel
console.log('Admin module loaded');

// Admin state
let adminState = {
    isAdmin: false,
    adminUsers: [],
    onlineUsers: [],
    owner: null,
    bannedUsers: []
};

// Initialize admin functionality
document.addEventListener('DOMContentLoaded', () => {
    // Add event listener for the redeem form to catch admin code
    setupAdminCode();
    
    // Check if user is already admin (from localStorage)
    checkAdminStatus();
    
    // Initialize mock online users for demo
    initMockUsers();
});

// Setup admin code detection
function setupAdminCode() {
    const redeemForm = document.getElementById('redeemForm');
    if (redeemForm) {
        const originalSubmitHandler = redeemForm.onsubmit;
        
        redeemForm.onsubmit = function(e) {
            const codeInput = document.getElementById('redeemCode');
            if (!codeInput) return originalSubmitHandler ? originalSubmitHandler.call(this, e) : true;
            
            const code = codeInput.value.trim();
            
            // Check for admin code
            if (code === "$$ADMIN$$") {
                e.preventDefault();
                showAdminPasswordPrompt();
                codeInput.value = '';
                
                // Close the redeem modal
                const redeemModal = document.getElementById('redeemModal');
                if (redeemModal) {
                    redeemModal.style.display = 'none';
                }
                return false;
            }
            
            // Otherwise, proceed with original handler
            return originalSubmitHandler ? originalSubmitHandler.call(this, e) : true;
        };
    }
}

// Check if user is admin from localStorage
function checkAdminStatus() {
    const isAdmin = localStorage.getItem('betaGames_isAdmin') === 'true';
    if (isAdmin) {
        adminState.isAdmin = true;
        // Load admin data
        try {
            const adminUsers = JSON.parse(localStorage.getItem('betaGames_adminUsers') || '[]');
            const bannedUsers = JSON.parse(localStorage.getItem('betaGames_bannedUsers') || '[]');
            const owner = localStorage.getItem('betaGames_owner');
            
            adminState.adminUsers = adminUsers;
            adminState.bannedUsers = bannedUsers;
            adminState.owner = owner;
        } catch (error) {
            console.error('Error loading admin data:', error);
        }
    }
}

// Save admin state to localStorage
function saveAdminState() {
    localStorage.setItem('betaGames_isAdmin', adminState.isAdmin.toString());
    localStorage.setItem('betaGames_adminUsers', JSON.stringify(adminState.adminUsers));
    localStorage.setItem('betaGames_bannedUsers', JSON.stringify(adminState.bannedUsers));
    localStorage.setItem('betaGames_owner', adminState.owner || '');
}

// Show admin password prompt
function showAdminPasswordPrompt() {
    // Create password prompt modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'adminPasswordModal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content glow-box">
            <span class="close">&times;</span>
            <h2>Whats the pass good lookin?!</h2>
            <div class="form-group">
                <input type="password" id="adminPassword" placeholder="Enter admin password" autocomplete="off">
            </div>
            <button id="adminPasswordSubmit" class="submit-btn glow-button">Access Admin</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    const closeBtn = modal.querySelector('.close');
    const submitBtn = document.getElementById('adminPasswordSubmit');
    const passwordInput = document.getElementById('adminPassword');
    
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    submitBtn.addEventListener('click', () => {
        verifyAdminPassword();
    });
    
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            verifyAdminPassword();
        }
    });
    
    // Focus the password input
    passwordInput.focus();
    
    // Function to verify password
    function verifyAdminPassword() {
        const password = passwordInput.value.trim();
        
        if (password === "samgetshoes") {
            // Password correct - grant admin access
            adminState.isAdmin = true;
            saveAdminState();
            document.body.removeChild(modal);
            showAdminPanel();
        } else {
            // Password incorrect - shake the input
            passwordInput.classList.add('shake-animation');
            setTimeout(() => {
                passwordInput.classList.remove('shake-animation');
            }, 500);
        }
    }
    
    // Add CSS for shake animation
    const style = document.createElement('style');
    style.textContent = `
        .shake-animation {
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        
        @keyframes shake {
            10%, 90% { transform: translate3d(-1px, 0, 0); }
            20%, 80% { transform: translate3d(2px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
            40%, 60% { transform: translate3d(4px, 0, 0); }
        }
    `;
    document.head.appendChild(style);
}

// Initialize mock online users for demo
function initMockUsers() {
    adminState.onlineUsers = [
        { username: 'Player123', balance: 5000, avatar: 'assets/default-avatar.svg', status: 'online', lastActivity: new Date() },
        { username: 'GamblePro', balance: 12000, avatar: 'assets/default-avatar.svg', status: 'online', lastActivity: new Date() },
        { username: 'LuckyGuy', balance: 8500, avatar: 'assets/default-avatar.svg', status: 'online', lastActivity: new Date() },
        { username: 'BigWinner', balance: 25000, avatar: 'assets/default-avatar.svg', status: 'online', lastActivity: new Date() },
        { username: 'RollTheNice', balance: 3000, avatar: 'assets/default-avatar.svg', status: 'away', lastActivity: new Date(Date.now() - 300000) }
    ];
    
    // Add current user if logged in
    const currentUser = window.BetaAuth?.getCurrentUser();
    if (currentUser && !adminState.onlineUsers.find(u => u.username === currentUser.username)) {
        adminState.onlineUsers.push({
            username: currentUser.username,
            balance: currentUser.balance || 100,
            avatar: currentUser.avatar || 'assets/default-avatar.svg',
            status: 'online',
            lastActivity: new Date()
        });
    }
}

// Show admin panel
function showAdminPanel() {
    // Create admin panel modal
    const modal = document.createElement('div');
    modal.className = 'modal admin-panel-modal';
    modal.id = 'adminPanelModal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content admin-panel-content glow-box">
            <span class="close">&times;</span>
            <h2><i class="fas fa-shield-alt"></i> Admin Panel</h2>
            
            <div class="admin-tabs">
                <button class="admin-tab active" data-tab="users"><i class="fas fa-users"></i> Online Users</button>
                <button class="admin-tab" data-tab="settings"><i class="fas fa-cog"></i> Settings</button>
                <button class="admin-tab" data-tab="broadcast"><i class="fas fa-bullhorn"></i> Broadcast</button>
            </div>
            
            <div class="admin-tab-content active" id="users-tab">
                <div class="search-bar">
                    <input type="text" id="userSearchInput" placeholder="Search users...">
                </div>
                <div class="online-users-list" id="onlineUsersList">
                    <!-- Will be populated with users -->
                </div>
            </div>
            
            <div class="admin-tab-content" id="settings-tab">
                <div class="admin-setting-group">
                    <h3>Owner Settings</h3>
                    <div class="admin-setting-item">
                        <label for="ownerUsername">Set Owner Username:</label>
                        <div class="setting-input-group">
                            <input type="text" id="ownerUsername" placeholder="Username">
                            <button id="setOwnerBtn" class="admin-btn">Set Owner</button>
                        </div>
                    </div>
                    <div class="admin-setting-item">
                        <span>Current Owner: <span id="currentOwner">None</span></span>
                    </div>
                </div>
                
                <div class="admin-setting-group">
                    <h3>Admin List</h3>
                    <div class="admin-users-list" id="adminUsersList">
                        <!-- Will be populated with admin users -->
                    </div>
                    <div class="admin-setting-item">
                        <div class="setting-input-group">
                            <input type="text" id="newAdminUsername" placeholder="Username">
                            <button id="addAdminBtn" class="admin-btn">Add Admin</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="admin-tab-content" id="broadcast-tab">
                <div class="admin-setting-group">
                    <h3>Send Message to All Users</h3>
                    <div class="admin-setting-item">
                        <textarea id="broadcastMessage" placeholder="Enter your message to all users" rows="4"></textarea>
                    </div>
                    <button id="sendBroadcastBtn" class="admin-btn broadcast-btn">Send Broadcast</button>
                </div>
                
                <div class="admin-setting-group">
                    <h3>Send Direct Message</h3>
                    <div class="admin-setting-item">
                        <label for="directMessageUsername">Username:</label>
                        <input type="text" id="directMessageUsername" placeholder="Username">
                    </div>
                    <div class="admin-setting-item">
                        <textarea id="directMessage" placeholder="Enter your message to the user" rows="4"></textarea>
                    </div>
                    <button id="sendDirectMessageBtn" class="admin-btn">Send Message</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add CSS for admin panel
    addAdminPanelStyles();
    
    // Add event listeners
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Tab switching
    const tabs = modal.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding tab content
            const tabContents = modal.querySelectorAll('.admin-tab-content');
            tabContents.forEach(tc => tc.classList.remove('active'));
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
    
    // Populate users list
    populateOnlineUsers();
    
    // Update owner display
    updateOwnerDisplay();
    
    // Populate admin users
    populateAdminUsers();
    
    // Add event listeners for admin actions
    setupAdminEventListeners();
}

// Add admin panel styles
function addAdminPanelStyles() {
    const styleId = 'admin-panel-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .admin-panel-modal {
            z-index: 1000;
        }
        
        .admin-panel-content {
            width: 90%;
            max-width: 900px;
            max-height: 80vh;
            overflow-y: auto;
            padding: 30px;
        }
        
        .admin-panel-content h2 {
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--primary-color);
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid rgba(24, 231, 124, 0.3);
        }
        
        .admin-tabs {
            display: flex;
            gap: 5px;
            margin-bottom: 20px;
            background: rgba(12, 14, 26, 0.5);
            border-radius: 8px;
            padding: 5px;
        }
        
        .admin-tab {
            padding: 10px 15px;
            border: none;
            background: none;
            color: #fff;
            cursor: pointer;
            border-radius: 5px;
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.2s ease;
        }
        
        .admin-tab:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        
        .admin-tab.active {
            background: var(--primary-color);
            color: var(--secondary-color);
            font-weight: bold;
        }
        
        .admin-tab-content {
            display: none;
        }
        
        .admin-tab-content.active {
            display: block;
        }
        
        .search-bar {
            margin-bottom: 15px;
        }
        
        .search-bar input {
            width: 100%;
            padding: 10px 15px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(12, 14, 26, 0.5);
            color: #fff;
        }
        
        .online-users-list, .admin-users-list {
            background: rgba(12, 14, 26, 0.5);
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 20px;
            max-height: 300px;
            overflow-y: auto;
        }
        
        .user-item {
            padding: 12px 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .user-item:last-child {
            border-bottom: none;
        }
        
        .user-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
        }
        
        .user-details {
            display: flex;
            flex-direction: column;
        }
        
        .username {
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .crown-icon {
            color: gold;
        }
        
        .banned-tag {
            background: rgba(241, 90, 90, 0.2);
            color: var(--danger-color);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            margin-left: 5px;
        }
        
        .admin-tag {
            background: rgba(24, 231, 124, 0.2);
            color: var(--primary-color);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            margin-left: 5px;
        }
        
        .user-status {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
        }
        
        .status-online {
            color: var(--primary-color);
        }
        
        .status-away {
            color: #ffc107;
        }
        
        .user-actions {
            display: flex;
            gap: 8px;
        }
        
        .user-action-btn {
            background: rgba(12, 14, 26, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #fff;
            border-radius: 4px;
            padding: 6px 10px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 12px;
        }
        
        .user-action-btn:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        
        .ban-btn {
            color: var(--danger-color);
            border-color: rgba(241, 90, 90, 0.3);
        }
        
        .ban-btn:hover {
            background: rgba(241, 90, 90, 0.1);
        }
        
        .unban-btn {
            color: var(--success-color);
            border-color: rgba(46, 204, 113, 0.3);
        }
        
        .unban-btn:hover {
            background: rgba(46, 204, 113, 0.1);
        }
        
        .message-btn {
            color: #3498db;
            border-color: rgba(52, 152, 219, 0.3);
        }
        
        .message-btn:hover {
            background: rgba(52, 152, 219, 0.1);
        }
        
        .admin-btn {
            background: var(--primary-color);
            color: var(--secondary-color);
            border: none;
            border-radius: 5px;
            padding: 10px 15px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: bold;
        }
        
        .admin-btn:hover {
            background: #16c96c;
            transform: translateY(-2px);
        }
        
        .broadcast-btn {
            width: 100%;
            margin-top: 10px;
            background: linear-gradient(90deg, var(--primary-color), #16c96c);
        }
        
        .admin-setting-group {
            background: rgba(12, 14, 26, 0.5);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .admin-setting-group h3 {
            margin-bottom: 15px;
            color: var(--primary-color);
            font-size: 16px;
        }
        
        .admin-setting-item {
            margin-bottom: 15px;
        }
        
        .admin-setting-item:last-child {
            margin-bottom: 0;
        }
        
        .admin-setting-item input,
        .admin-setting-item textarea {
            width: 100%;
            padding: 10px 15px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(12, 14, 26, 0.5);
            color: #fff;
            margin-top: 5px;
        }
        
        .setting-input-group {
            display: flex;
            gap: 10px;
        }
        
        .setting-input-group input {
            flex: 1;
        }
        
        #currentOwner {
            font-weight: bold;
            color: gold;
        }
        
        /* Alert Styles */
        .admin-alert {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(12, 14, 26, 0.9);
            border: 2px solid var(--primary-color);
            border-radius: 8px;
            padding: 15px 20px;
            color: #fff;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            z-index: 2000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideDown 0.3s forwards;
        }
        
        .admin-alert.danger {
            border-color: var(--danger-color);
        }
        
        .admin-alert-icon {
            font-size: 20px;
            color: var(--primary-color);
        }
        
        .admin-alert.danger .admin-alert-icon {
            color: var(--danger-color);
        }
        
        .admin-alert-message {
            font-weight: 500;
        }
        
        @keyframes slideDown {
            from { transform: translate(-50%, -100%); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
        }
        
        /* Responsive styles */
        @media (max-width: 768px) {
            .admin-panel-content {
                padding: 20px;
                width: 95%;
            }
            
            .admin-tabs {
                flex-direction: column;
                gap: 5px;
            }
            
            .user-actions {
                flex-direction: column;
            }
            
            .setting-input-group {
                flex-direction: column;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Populate online users list
function populateOnlineUsers() {
    const usersList = document.getElementById('onlineUsersList');
    if (!usersList) return;
    
    usersList.innerHTML = '';
    
    adminState.onlineUsers.forEach(user => {
        const isOwner = adminState.owner === user.username;
        const isAdmin = adminState.adminUsers.includes(user.username);
        const isBanned = adminState.bannedUsers.includes(user.username);
        
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.dataset.username = user.username;
        
        userItem.innerHTML = `
            <div class="user-info">
                <img src="${user.avatar}" alt="${user.username}" class="user-avatar">
                <div class="user-details">
                    <div class="username">
                        ${user.username}
                        ${isOwner ? '<i class="fas fa-crown crown-icon"></i>' : ''}
                        ${isAdmin ? '<span class="admin-tag">Admin</span>' : ''}
                        ${isBanned ? '<span class="banned-tag">Banned</span>' : ''}
                    </div>
                    <div class="user-status">
                        <span class="status-${user.status}">${user.status}</span> • ${user.balance.toLocaleString()} coins
                    </div>
                </div>
            </div>
            <div class="user-actions">
                ${isBanned ? 
                    '<button class="user-action-btn unban-btn" data-action="unban"><i class="fas fa-undo"></i> Unban</button>' : 
                    '<button class="user-action-btn ban-btn" data-action="ban"><i class="fas fa-ban"></i> Ban</button>'
                }
                <button class="user-action-btn message-btn" data-action="message"><i class="fas fa-envelope"></i> Message</button>
                ${!isAdmin ? 
                    '<button class="user-action-btn" data-action="make-admin"><i class="fas fa-user-shield"></i> Make Admin</button>' : 
                    '<button class="user-action-btn" data-action="remove-admin"><i class="fas fa-user-minus"></i> Remove Admin</button>'
                }
                ${!isOwner ? 
                    '<button class="user-action-btn" data-action="make-owner"><i class="fas fa-crown"></i> Make Owner</button>' : 
                    ''
                }
            </div>
        `;
        
        usersList.appendChild(userItem);
    });
    
    // Add event listeners for user actions
    const actionButtons = usersList.querySelectorAll('.user-action-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', handleUserAction);
    });
    
    // Add search functionality
    const searchInput = document.getElementById('userSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterUsers);
    }
}

// Filter users based on search
function filterUsers() {
    const searchInput = document.getElementById('userSearchInput');
    const userItems = document.querySelectorAll('.user-item');
    
    const searchTerm = searchInput.value.toLowerCase();
    
    userItems.forEach(item => {
        const username = item.dataset.username.toLowerCase();
        if (username.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Update owner display
function updateOwnerDisplay() {
    const currentOwnerElement = document.getElementById('currentOwner');
    if (currentOwnerElement) {
        currentOwnerElement.textContent = adminState.owner || 'None';
    }
}

// Populate admin users list
function populateAdminUsers() {
    const adminUsersList = document.getElementById('adminUsersList');
    if (!adminUsersList) return;
    
    adminUsersList.innerHTML = '';
    
    if (adminState.adminUsers.length === 0) {
        adminUsersList.innerHTML = '<div class="user-item">No admin users yet</div>';
        return;
    }
    
    adminState.adminUsers.forEach(username => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        
        userItem.innerHTML = `
            <div class="username">${username}</div>
            <button class="user-action-btn" data-username="${username}" data-action="remove-admin">
                <i class="fas fa-times"></i> Remove
            </button>
        `;
        
        adminUsersList.appendChild(userItem);
    });
    
    // Add event listeners for remove buttons
    const removeButtons = adminUsersList.querySelectorAll('.user-action-btn');
    removeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const username = button.dataset.username;
            removeAdmin(username);
        });
    });
}

// Set up admin event listeners
function setupAdminEventListeners() {
    // Set owner button
    const setOwnerBtn = document.getElementById('setOwnerBtn');
    if (setOwnerBtn) {
        setOwnerBtn.addEventListener('click', () => {
            const ownerInput = document.getElementById('ownerUsername');
            const username = ownerInput.value.trim();
            
            if (username) {
                setOwner(username);
                ownerInput.value = '';
            }
        });
    }
    
    // Add admin button
    const addAdminBtn = document.getElementById('addAdminBtn');
    if (addAdminBtn) {
        addAdminBtn.addEventListener('click', () => {
            const adminInput = document.getElementById('newAdminUsername');
            const username = adminInput.value.trim();
            
            if (username) {
                addAdmin(username);
                adminInput.value = '';
            }
        });
    }
    
    // Send broadcast button
    const sendBroadcastBtn = document.getElementById('sendBroadcastBtn');
    if (sendBroadcastBtn) {
        sendBroadcastBtn.addEventListener('click', () => {
            const messageInput = document.getElementById('broadcastMessage');
            const message = messageInput.value.trim();
            
            if (message) {
                sendBroadcast(message);
                messageInput.value = '';
            }
        });
    }
    
    // Send direct message button
    const sendDirectMessageBtn = document.getElementById('sendDirectMessageBtn');
    if (sendDirectMessageBtn) {
        sendDirectMessageBtn.addEventListener('click', () => {
            const usernameInput = document.getElementById('directMessageUsername');
            const messageInput = document.getElementById('directMessage');
            const username = usernameInput.value.trim();
            const message = messageInput.value.trim();
            
            if (username && message) {
                sendDirectMessage(username, message);
                messageInput.value = '';
            }
        });
    }
}

// Handle user actions (ban, message, make admin, etc.)
function handleUserAction(e) {
    const button = e.currentTarget;
    const action = button.dataset.action;
    const userItem = button.closest('.user-item');
    const username = userItem.dataset.username;
    
    switch(action) {
        case 'ban':
            banUser(username);
            break;
        case 'unban':
            unbanUser(username);
            break;
        case 'message':
            // Open message tab and fill username
            const tabs = document.querySelectorAll('.admin-tab');
            tabs.forEach(tab => {
                if (tab.dataset.tab === 'broadcast') {
                    tab.click();
                }
            });
            const usernameInput = document.getElementById('directMessageUsername');
            if (usernameInput) {
                usernameInput.value = username;
                document.getElementById('directMessage').focus();
            }
            break;
        case 'make-admin':
            addAdmin(username);
            break;
        case 'remove-admin':
            removeAdmin(username);
            break;
        case 'make-owner':
            setOwner(username);
            break;
    }
}

// Ban a user
function banUser(username) {
    if (!adminState.bannedUsers.includes(username)) {
        adminState.bannedUsers.push(username);
        saveAdminState();
        
        // Show alert
        showAdminAlert(`User ${username} has been banned`, 'danger');
        
        // Update users list
        populateOnlineUsers();
    }
}

// Unban a user
function unbanUser(username) {
    const index = adminState.bannedUsers.indexOf(username);
    if (index !== -1) {
        adminState.bannedUsers.splice(index, 1);
        saveAdminState();
        
        // Show alert
        showAdminAlert(`User ${username} has been unbanned`);
        
        // Update users list
        populateOnlineUsers();
    }
}

// Add admin
function addAdmin(username) {
    if (!adminState.adminUsers.includes(username)) {
        adminState.adminUsers.push(username);
        saveAdminState();
        
        // Show alert
        showAdminAlert(`${username} is now an admin`);
        
        // Update admin list and users list
        populateAdminUsers();
        populateOnlineUsers();
    }
}

// Remove admin
function removeAdmin(username) {
    const index = adminState.adminUsers.indexOf(username);
    if (index !== -1) {
        adminState.adminUsers.splice(index, 1);
        saveAdminState();
        
        // Show alert
        showAdminAlert(`${username} is no longer an admin`, 'danger');
        
        // Update admin list and users list
        populateAdminUsers();
        populateOnlineUsers();
    }
}

// Set owner
function setOwner(username) {
    adminState.owner = username;
    saveAdminState();
    
    // Show alert
    showAdminAlert(`${username} is now the owner`);
    
    // Update owner display and users list
    updateOwnerDisplay();
    populateOnlineUsers();
}

// Send broadcast message to all users
function sendBroadcast(message) {
    // Create broadcast element
    const broadcast = document.createElement('div');
    broadcast.className = 'admin-alert';
    broadcast.innerHTML = `
        <i class="fas fa-bullhorn admin-alert-icon"></i>
        <div class="admin-alert-message">${message}</div>
    `;
    
    document.body.appendChild(broadcast);
    
    // Remove after 5 seconds
    setTimeout(() => {
        document.body.removeChild(broadcast);
    }, 5000);
    
    // Show confirmation
    showAdminAlert('Broadcast sent to all users');
}

// Send direct message to a specific user
function sendDirectMessage(username, message) {
    // Check if user exists
    const userExists = adminState.onlineUsers.some(user => user.username === username);
    
    if (!userExists) {
        showAdminAlert(`User ${username} not found`, 'danger');
        return;
    }
    
    // Create direct message alert
    const directMsg = document.createElement('div');
    directMsg.className = 'admin-alert';
    directMsg.innerHTML = `
        <i class="fas fa-envelope admin-alert-icon"></i>
        <div class="admin-alert-message">
            <strong>Message from Admin:</strong> ${message}
        </div>
    `;
    
    document.body.appendChild(directMsg);
    
    // Remove after 5 seconds
    setTimeout(() => {
        document.body.removeChild(directMsg);
    }, 5000);
    
    // Show confirmation
    showAdminAlert(`Message sent to ${username}`);
}

// Show admin alert
function showAdminAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `admin-alert ${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} admin-alert-icon"></i>
        <div class="admin-alert-message">${message}</div>
    `;
    
    document.body.appendChild(alert);
    
    // Remove after 3 seconds
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transform = 'translate(-50%, -20px)';
        alert.style.transition = 'opacity 0.3s, transform 0.3s';
        
        setTimeout(() => {
            if (document.body.contains(alert)) {
                document.body.removeChild(alert);
            }
        }, 300);
    }, 3000);
}

// Export admin functionality
window.BetaAdmin = {
    isAdmin: () => adminState.isAdmin,
    isBanned: (username) => adminState.bannedUsers.includes(username),
    isOwner: (username) => adminState.owner === username,
    sendAlert: showAdminAlert
};

document.addEventListener('DOMContentLoaded', async function() {
    // Check if we're on the admin page
    const isAdminPage = document.querySelector('.admin-dashboard');
    if (!isAdminPage) return;
    
    // Get UI elements
    const houseEdgeInput = document.getElementById('houseEdge');
    const maintenanceModeToggle = document.getElementById('maintenanceMode');
    const plinkoEnabledToggle = document.getElementById('plinkoEnabled');
    const updateSettingsBtn = document.getElementById('updateSettingsBtn');
    
    // Load current settings
    await loadSettings();
    
    // Add event listener for the update button
    if (updateSettingsBtn) {
        updateSettingsBtn.addEventListener('click', updateAllSettings);
    }
    
    // Load current settings from Supabase
    async function loadSettings() {
        if (!window.SupabaseDB) {
            console.error('Supabase not configured');
            return;
        }
        
        try {
            // Load house edge
            const { data: edgeData, error: edgeError } = await window.SupabaseDB
                .from('settings')
                .select('value')
                .eq('key', 'house_edge')
                .single();
                
            if (edgeError && edgeError.code !== 'PGRST116') {
                console.error('Error loading house edge:', edgeError);
            } else if (edgeData) {
                houseEdgeInput.value = edgeData.value;
            }
            
            // Load maintenance mode
            const { data: maintenanceData, error: maintenanceError } = await window.SupabaseDB
                .from('settings')
                .select('value')
                .eq('key', 'maintenance_mode')
                .single();
                
            if (maintenanceError && maintenanceError.code !== 'PGRST116') {
                console.error('Error loading maintenance mode:', maintenanceError);
            } else if (maintenanceData) {
                maintenanceModeToggle.checked = maintenanceData.value === 'on';
            }
            
            // Load plinko enabled status
            const { data: plinkoData, error: plinkoError } = await window.SupabaseDB
                .from('settings')
                .select('value')
                .eq('key', 'plinko')
                .single();
                
            if (plinkoError && plinkoError.code !== 'PGRST116') {
                console.error('Error loading plinko status:', plinkoError);
            } else if (plinkoData) {
                plinkoEnabledToggle.checked = plinkoData.value === 'on';
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    // Update all settings at once
    async function updateAllSettings() {
        if (!window.SupabaseDB) {
            console.error('Supabase not configured');
            return;
        }
        
        try {
            // Get values from inputs
            const houseEdge = houseEdgeInput.value;
            const maintenanceMode = maintenanceModeToggle.checked ? 'on' : 'off';
            const plinkoEnabled = plinkoEnabledToggle.checked ? 'on' : 'off';
            
            // Update house edge
            const { error: edgeError } = await window.SupabaseDB
                .from('settings')
                .update({ value: houseEdge })
                .eq('key', 'house_edge');
                
            if (edgeError) {
                console.error('Error updating house edge:', edgeError);
                alert('Error updating house edge');
                return;
            }
            
            // Update maintenance mode
            const { error: maintenanceError } = await window.SupabaseDB
                .from('settings')
                .update({ value: maintenanceMode })
                .eq('key', 'maintenance_mode');
                
            if (maintenanceError) {
                console.error('Error updating maintenance mode:', maintenanceError);
                alert('Error updating maintenance mode');
                return;
            }
            
            // Update plinko enabled status
            const { error: plinkoError } = await window.SupabaseDB
                .from('settings')
                .update({ value: plinkoEnabled })
                .eq('key', 'plinko');
                
            if (plinkoError) {
                console.error('Error updating plinko status:', plinkoError);
                
                // If the setting doesn't exist, create it
                if (plinkoError.code === 'PGRST116') {
                    const { error: insertError } = await window.SupabaseDB
                        .from('settings')
                        .insert({ 
                            id: crypto.randomUUID(), 
                            key: 'plinko', 
                            value: plinkoEnabled 
                        });
                        
                    if (insertError) {
                        console.error('Error creating plinko setting:', insertError);
                        alert('Error updating plinko status');
                        return;
                    }
                } else {
                    alert('Error updating plinko status');
                    return;
                }
            }
            
            // Show success message
            alert('Settings updated successfully');
            
            // Reload settings
            await loadSettings();
        } catch (error) {
            console.error('Error updating settings:', error);
            alert('Error updating settings');
        }
    }
}); 