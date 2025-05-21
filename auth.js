// BetaGames Authentication System
const LOCAL_STORAGE_KEY = 'betagames_user';
const { userOperations } = require('./js/mongodb');

// User state
let currentUser = null;
let dropdownVisible = false; // Track if dropdown is visible

// DOM Elements
const loginButton = document.getElementById('loginButton');
const signupButton = document.getElementById('signupButton');
const userProfile = document.querySelector('.user-profile');
const usernameDisplay = document.getElementById('username');
const userAvatar = document.getElementById('userAvatar');
const logoutButton = document.getElementById('logoutButton');
const profileSettings = document.getElementById('profileSettings');
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const closeButtons = document.querySelectorAll('.close');
const balanceAmount = document.querySelector('.balance-amount');
const dropdownMenu = document.querySelector('.dropdown-menu');

// Check if user is already logged in (from localStorage)
function checkAuthState() {
    const savedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
    
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            updateUIForLoggedInUser();
            
            // Validate with server and update online status
            fetch('/api/users/online', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: currentUser.username }),
            }).catch(error => console.error('Error updating online status:', error));
        } catch (error) {
            console.error('Error parsing saved user data:', error);
            logout(); // Clear invalid data
        }
    }
}

// Update UI when user is logged in
function updateUIForLoggedInUser() {
    if (currentUser) {
        // Hide login/signup buttons, show profile
        loginButton.style.display = 'none';
        signupButton.style.display = 'none';
        userProfile.style.display = 'flex';
        
        // Update username and avatar
        usernameDisplay.textContent = currentUser.username;
        if (currentUser.avatar) {
            userAvatar.src = currentUser.avatar;
        }
        
        // Update balance
        if (currentUser.balance) {
            balanceAmount.textContent = new Intl.NumberFormat().format(currentUser.balance);
        }
        
        // Log to Discord webhook (would be server-side in real app)
        logToDiscord(`User ${currentUser.username} logged in`);
    }
}

// Login function with MongoDB
async function login(username, password) {
    try {
        const user = await userOperations.findUser(username);
        
        if (!user || user.password !== password) {
            throw new Error('Invalid credentials');
        }
        
            // Save to local storage for persistent login
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
            currentUser = user;
            
            // Update UI
            updateUIForLoggedInUser();
            
        return user;
    } catch (error) {
            console.error('Login error:', error);
        throw error;
    }
}

// Signup function with MongoDB
async function signup(username, password) {
    try {
        const existingUser = await userOperations.findUser(username);
        
        if (existingUser) {
            throw new Error('Username already exists');
        }
        
        const user = await userOperations.createUser(username, password);
        
            // Save to local storage for persistent login
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
            currentUser = user;
            
            // Update UI
            updateUIForLoggedInUser();
            
        return user;
    } catch (error) {
            console.error('Signup error:', error);
        throw error;
    }
}

// Logout function
function logout() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    
    // Log to Discord webhook (would be server-side in real app)
    if (currentUser) {
        logToDiscord(`User ${currentUser.username} logged out`);
        currentUser = null;
    }
    
    // Reset UI
    loginButton.style.display = 'block';
    signupButton.style.display = 'block';
    userProfile.style.display = 'none';
    balanceAmount.textContent = '0';
}

// Function to update user profile
function updateProfile(profileData) {
    if (!currentUser) return;
    
    // Update current user data
    currentUser = { ...currentUser, ...profileData };
    
    // Save to local storage
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentUser));
    
    // Update UI
    updateUIForLoggedInUser();
    
    // Log to Discord webhook (would be server-side in real app)
    logToDiscord(`User ${currentUser.username} updated their profile`);
}

// Function to update user balance
async function updateBalance(amount, reason = 'game') {
    if (!currentUser) return false;
    
    try {
        const updatedUser = await userOperations.updateBalance(currentUser.username, amount);
    
        if (updatedUser) {
            currentUser = updatedUser;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentUser));
        balanceAmount.textContent = new Intl.NumberFormat().format(currentUser.balance);
        return true;
    }
        return false;
    } catch (error) {
        console.error('Error updating balance:', error);
    return false;
    }
}

// Function to toggle dropdown visibility
function toggleDropdown(e) {
    e.stopPropagation(); // Prevent click from immediately closing dropdown
    
    dropdownVisible = !dropdownVisible;
    if (dropdownVisible) {
        dropdownMenu.classList.add('show-dropdown');
    } else {
        dropdownMenu.classList.remove('show-dropdown');
    }
}

// Function to log events to Discord webhook (mock)
function logToDiscord(message) {
    // In a real app, this would be a server-side function
    console.log('[Discord Webhook Log]', message);
    
    // If you had a real Discord webhook URL, you would use fetch:
    /*
    fetch('YOUR_DISCORD_WEBHOOK_URL', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            content: message
        }),
    }).catch(error => console.error('Error sending webhook:', error));
    */
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check auth state on page load
    checkAuthState();
    
    // Login button click
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            loginModal.style.display = 'flex';
        });
    }
    
    // Signup button click
    if (signupButton) {
        signupButton.addEventListener('click', () => {
            signupModal.style.display = 'flex';
        });
    }
    
    // User profile click for dropdown
    if (userProfile) {
        userProfile.addEventListener('click', toggleDropdown);
    }
    
    // Logout button click
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent event from bubbling up
            logout();
            dropdownVisible = false;
            dropdownMenu?.classList.remove('show-dropdown');
        });
    }
    
    // Settings button click
    if (profileSettings) {
        profileSettings.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent event from bubbling up
            
            // Check if settings modal exists, if not show an alert
            const settingsModal = document.getElementById('settingsModal');
            if (settingsModal) {
                settingsModal.style.display = 'flex';
            } else {
                alert('Profile settings will be available in a future update!');
            }
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (dropdownVisible && !userProfile.contains(e.target)) {
            dropdownVisible = false;
            dropdownMenu?.classList.remove('show-dropdown');
        }
    });
    
    // Close modal buttons
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            loginModal.style.display = 'none';
            signupModal.style.display = 'none';
            
            // Close settings modal if exists
            const settingsModal = document.getElementById('settingsModal');
            if (settingsModal) {
                settingsModal.style.display = 'none';
            }
            
            // Close change password modal if exists
            const changePasswordModal = document.getElementById('changePasswordModal');
            if (changePasswordModal) {
                changePasswordModal.style.display = 'none';
            }
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.style.display = 'none';
        }
        if (e.target === signupModal) {
            signupModal.style.display = 'none';
        }
        
        // Close settings modal if exists
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal && e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
        
        // Close change password modal if exists
        const changePasswordModal = document.getElementById('changePasswordModal');
        if (changePasswordModal && e.target === changePasswordModal) {
            changePasswordModal.style.display = 'none';
        }
    });
    
    // Handle change password form if exists
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;
            
            if (newPassword !== confirmNewPassword) {
                alert('New passwords do not match!');
                return;
            }
            
            // In a real app, this would validate against the server
            // For demo, we'll just pretend it worked
            
            alert('Password changed successfully!');
            
            // Reset form and close modal
            changePasswordForm.reset();
            
            const changePasswordModal = document.getElementById('changePasswordModal');
            if (changePasswordModal) {
                changePasswordModal.style.display = 'none';
            }
        });
    }
    
    // Login form submit
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                await login(username, password);
                    loginModal.style.display = 'none';
            } catch (error) {
                alert(error.message);
            }
        });
    }
    
    // Signup form submit
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('signupUsername').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('signupConfirmPassword').value;
            
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            try {
                await signup(username, password);
                    signupModal.style.display = 'none';
            } catch (error) {
                alert(error.message);
            }
        });
    }
    
    // Update online status periodically (every 2 minutes)
    if (currentUser) {
        setInterval(() => {
            fetch('/api/users/online', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: currentUser.username }),
            }).catch(error => console.error('Error updating online status:', error));
        }, 120000); // 2 minutes
    }
});

// Export functions for use in other scripts
window.BetaAuth = {
    getCurrentUser: () => currentUser,
    login,
    signup,
    logout,
    updateProfile,
    updateBalance,
    logToDiscord
};

// Function to create a Mock User
function createMockUser(username, password) {
    return {
        id: generateMockId(),
        username: username,
        password: password, // In a real app, this would never be stored in plain text
        balance: 100,
        avatar: null,
        createdAt: new Date().toISOString()
    };
} 