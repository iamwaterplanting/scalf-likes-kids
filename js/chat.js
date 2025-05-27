// BetaGames Live Chat
console.log('Chat module loaded');

// Chat state
let chatMessages = [];
let chatVisible = false;
let unreadCount = 0;
let lastMessageTime = new Date();

// DOM Elements (will be initialized when DOM is loaded)
let chatContainer;
let chatToggle;
let chatMessagesList;
let chatForm;
let messageInput;
let chatBadge;

// Initialize chat
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing chat UI components');
    
    // Create chat UI elements if they don't exist
    createChatUI();
    
    // Initialize variables
    chatContainer = document.getElementById('chatContainer');
    chatToggle = document.getElementById('chatToggle');
    chatMessagesList = document.getElementById('chatMessages');
    chatForm = document.getElementById('chatForm');
    messageInput = document.getElementById('messageInput');
    chatBadge = document.getElementById('chatBadge');
    
    console.log('Chat elements found:', 
        {
            chatContainer: !!chatContainer, 
            chatToggle: !!chatToggle, 
            chatMessagesList: !!chatMessagesList,
            chatForm: !!chatForm,
            messageInput: !!messageInput,
            chatBadge: !!chatBadge
        }
    );
    
    // Setup event listeners
    setupEventListeners();
    
    // Load existing messages
    loadChatMessages();
    
    // Set up real-time subscription for new messages
    enableRealtimeForChat();
    subscribeToNewMessages();
    
    console.log('Chat initialization complete');
});

// Create chat UI
function createChatUI() {
    console.log('Creating chat UI elements');
    
    // Check if chat container already exists
    if (document.getElementById('chatContainer')) {
        console.log('Chat container already exists, skipping creation');
        return;
    }
    
    try {
        // Create chat toggle button
        const toggleBtn = document.createElement('div');
        toggleBtn.id = 'chatToggle';
        toggleBtn.className = 'chat-toggle';
        toggleBtn.innerHTML = `
            <i class="fas fa-comments"></i>
            <span id="chatBadge" class="chat-badge">0</span>
        `;
        
        // Create chat container
        const container = document.createElement('div');
        container.id = 'chatContainer';
        container.className = 'chat-container';
        container.innerHTML = `
            <div class="chat-header">
                <h3>Live Chat</h3>
                <button id="chatClose" class="chat-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="chat-body">
                <ul id="chatMessages" class="chat-messages"></ul>
            </div>
            <form id="chatForm" class="chat-form">
                <input type="text" id="messageInput" placeholder="Type a message..." required>
                <button type="submit">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </form>
        `;
        
        // Add chat elements to body
        document.body.appendChild(toggleBtn);
        document.body.appendChild(container);
        
        console.log('Chat UI elements created and appended to document body');
        
        // Add chat styles
        addChatStyles();
    } catch (error) {
        console.error('Error creating chat UI:', error);
    }
}

// Add CSS styles for chat
function addChatStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .chat-toggle {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background-color: var(--primary-color, #00cc88);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            z-index: 999;
            font-size: 20px;
        }
        
        .chat-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background-color: var(--danger-color, #ff3366);
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        .chat-badge.show {
            opacity: 1;
        }
        
        .chat-container {
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 300px;
            height: 400px;
            background-color: var(--card-bg, #1a1d2e);
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
            z-index: 998;
            transition: transform 0.3s, opacity 0.3s;
            transform: translateY(20px);
            opacity: 0;
            pointer-events: none;
        }
        
        .chat-container.show {
            transform: translateY(0);
            opacity: 1;
            pointer-events: all;
        }
        
        .chat-header {
            padding: 10px 15px;
            border-bottom: 1px solid var(--border-color, #2a2d3e);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .chat-header h3 {
            margin: 0;
            color: var(--text-color, #ffffff);
        }
        
        .chat-close {
            background: none;
            border: none;
            color: var(--text-color, #ffffff);
            cursor: pointer;
            font-size: 16px;
        }
        
        .chat-body {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
        }
        
        .chat-messages {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .chat-message {
            margin-bottom: 12px;
            display: flex;
            align-items: flex-start;
        }
        
        .message-avatar {
            width: 32px;
            height: 32px;
            margin-right: 10px;
            flex-shrink: 0;
        }
        
        .avatar-img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
            border: 1px solid var(--border-color, #2a2d3e);
        }
        
        .message-content {
            flex: 1;
        }
        
        .username {
            font-weight: bold;
            color: var(--primary-color, #00cc88);
            margin-bottom: 2px;
            font-size: 0.9em;
            display: flex;
            justify-content: space-between;
        }
        
        .time {
            color: var(--text-muted, #8a8d98);
            font-size: 0.75em;
            font-weight: normal;
        }
        
        .message-text {
            background-color: var(--card-bg-light, #22263a);
            padding: 8px 12px;
            border-radius: 10px;
            color: var(--text-color, #ffffff);
            font-size: 0.9em;
            word-break: break-word;
        }
        
        .system-message .message-text {
            background-color: rgba(100, 100, 100, 0.2);
            font-style: italic;
            color: var(--text-muted, #8a8d98);
        }
        
        .chat-form {
            display: flex;
            padding: 10px;
            border-top: 1px solid var(--border-color, #2a2d3e);
        }
        
        .chat-form input {
            flex: 1;
            padding: 8px 12px;
            border-radius: 20px;
            border: none;
            background-color: var(--card-bg-light, #22263a);
            color: var(--text-color, #ffffff);
            outline: none;
        }
        
        .chat-form button {
            background-color: var(--primary-color, #00cc88);
            color: white;
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            margin-left: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        /* Custom scrollbar for chat */
        .chat-body::-webkit-scrollbar {
            width: 6px;
        }
        
        .chat-body::-webkit-scrollbar-track {
            background: var(--card-bg, #1a1d2e);
        }
        
        .chat-body::-webkit-scrollbar-thumb {
            background-color: var(--border-color, #2a2d3e);
            border-radius: 6px;
        }
        
        /* Avatar styles for all users across the site */
        .user-avatar {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
        }
    `;
    
    document.head.appendChild(styleElement);
}

// Setup event listeners
function setupEventListeners() {
    // Toggle chat visibility
    chatToggle.addEventListener('click', toggleChat);
    
    // Close chat button
    document.getElementById('chatClose').addEventListener('click', () => {
        hideChat();
    });
    
    // Send message
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        sendMessage();
    });
}

// Toggle chat visibility
function toggleChat() {
    if (chatVisible) {
        hideChat();
    } else {
        showChat();
    }
}

// Show chat
function showChat() {
    chatContainer.classList.add('show');
    chatVisible = true;
    unreadCount = 0;
    updateBadge();
    
    // Scroll to bottom of chat
    scrollToBottom();
}

// Hide chat
function hideChat() {
    chatContainer.classList.remove('show');
    chatVisible = false;
}

// Update unread message badge
function updateBadge() {
    if (unreadCount > 0) {
        chatBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        chatBadge.classList.add('show');
    } else {
        chatBadge.classList.remove('show');
    }
}

// Load chat messages from Supabase
async function loadChatMessages() {
    console.log('Loading chat messages from database');
    
    try {
        // Get current user
        const { data: { user } } = await window.SupabaseDB.auth.getUser();
        
        // Fetch messages from Supabase
        const { data: messages, error } = await window.SupabaseDB
            .from('chat_messages')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(50);
        
        if (error) {
            throw error;
        }
        
        console.log(`Loaded ${messages ? messages.length : 0} chat messages`);
        
        if (messages && messages.length > 0) {
            chatMessages = messages;
        } else {
            console.log('No messages found in database');
            chatMessages = [];
        }
        
        renderChatMessages();
        
        // Update last message time for subscription
        if (chatMessages.length > 0) {
            lastMessageTime = new Date(chatMessages[chatMessages.length - 1].created_at);
            console.log('Last message time:', lastMessageTime);
        }
        
        scrollToBottom();
    } catch (error) {
        console.error('Error loading chat messages:', error);
        
        // Create empty message array in case of error
        chatMessages = [];
        renderChatMessages();
    }
}

// Render chat messages
function renderChatMessages() {
    if (!chatMessagesList) {
        console.error('Chat messages list element not found!');
        return;
    }
    
    console.log('Rendering chat messages, count:', chatMessages.length);
    chatMessagesList.innerHTML = '';
    
    if (chatMessages.length === 0) {
        // Display a placeholder message
        const li = document.createElement('li');
        li.className = 'chat-message system-message';
        li.innerHTML = '<div class="message-text">No messages yet. Be the first to say hello!</div>';
        chatMessagesList.appendChild(li);
        return;
    }
    
    chatMessages.forEach(message => {
        addMessageToUI(message);
    });
}

// Add a message to the UI
function addMessageToUI(message) {
    if (!chatMessagesList) {
        console.error('Chat messages list element not found!');
        return;
    }
    
    const li = document.createElement('li');
    li.className = message.username === 'System' ? 'chat-message system-message' : 'chat-message';
    
    // Check if user is owner
    const isOwner = window.BetaAdmin && window.BetaAdmin.isOwner && window.BetaAdmin.isOwner(message.username);
    
    // Check if user is admin
    const isAdmin = window.BetaAdmin && window.BetaAdmin.adminUsers && window.BetaAdmin.adminUsers.includes(message.username);
    
    // Create avatar element
    const avatarElement = document.createElement('div');
    avatarElement.className = 'message-avatar';
    
    // Create avatar image
    const avatarImg = document.createElement('img');
    avatarImg.className = 'avatar-img';
    
    // Set default avatar right away
    avatarImg.src = message.username === 'System' ? 'assets/system-avatar.svg' : 'assets/default-avatar.svg';
    avatarElement.appendChild(avatarImg);
    
    // Get user avatar from database or use default
    if (message.username !== 'System') {
        // Try to fetch user avatar
        fetchUserAvatar(message.username)
            .then(avatarUrl => {
                if (avatarUrl) {
                    avatarImg.src = avatarUrl;
                }
            })
            .catch(error => {
                console.error('Error loading avatar:', error);
                // Keep the default avatar if there's an error
            });
    }
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const usernameSpan = document.createElement('div');
    usernameSpan.className = 'username';
    
    // Add crown icon for owner
    if (isOwner) {
        usernameSpan.innerHTML = `${escapeHTML(message.username)} <i class="fas fa-crown" style="color: gold; font-size: 0.8em;"></i>`;
    } else if (isAdmin) {
        usernameSpan.innerHTML = `${escapeHTML(message.username)} <span style="color: var(--primary-color); font-size: 0.8em;">[Admin]</span>`;
    } else {
        usernameSpan.textContent = message.username;
    }
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'time';
    timeSpan.textContent = formatTime(new Date(message.created_at));
    
    usernameSpan.appendChild(timeSpan);
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    messageText.textContent = message.message;
    
    messageContent.appendChild(usernameSpan);
    messageContent.appendChild(messageText);
    
    li.appendChild(avatarElement);
    li.appendChild(messageContent);
    
    chatMessagesList.appendChild(li);
    
    // Scroll to bottom
    scrollToBottom();
}

// Helper function to fetch user avatar
async function fetchUserAvatar(username) {
    try {
        const { data, error } = await window.SupabaseDB
            .from('users')
            .select('avatar')
            .eq('username', username)
            .single();
            
        if (error) throw error;
        
        // Return the avatar URL if available
        return data && data.avatar ? data.avatar : null;
    } catch (error) {
        console.error('Error fetching user avatar:', error);
        return null;
    }
}

// Subscribe to new messages
function subscribeToNewMessages() {
    console.log('Setting up subscription to chat messages...');
    
    // Enable realtime functionality for this table
    window.SupabaseDB
        .from('chat_messages')
        .on('*', payload => {
            console.log('Received realtime event:', payload);
        })
        .subscribe();
    
    const subscription = window.SupabaseDB
        .from('chat_messages')
        .on('INSERT', payload => {
            console.log('New message received:', payload);
            
            const newMessage = payload.new;
            
            // Add to messages array
            chatMessages.push(newMessage);
            
            // Add to UI
            addMessageToUI(newMessage);
            
            // Update badge if chat is not visible
            if (!chatVisible) {
                unreadCount++;
                updateBadge();
            }
            
            // Scroll to bottom if chat is visible
            if (chatVisible) {
                scrollToBottom();
            }
        })
        .subscribe((status) => {
            console.log('Subscription status:', status);
        });
        
    // Store subscription for cleanup
    window.chatSubscription = subscription;
    console.log('Chat subscription created:', subscription);
}

// Send a chat message
async function sendMessage() {
    const currentUser = window.BetaAuth?.getCurrentUser();
    if (!currentUser) {
        alert('You need to be logged in to send messages');
        return;
    }
    
    const messageText = messageInput.value.trim();
    if (!messageText) return;
    
    try {
        console.log('Sending message to Supabase:', messageText);
        
        const message = {
            username: currentUser.username,
            message: messageText,
            created_at: new Date().toISOString()
        };
        
        console.log('Message object:', message);
        
        // Send to Supabase
        const { data, error } = await window.SupabaseDB
            .from('chat_messages')
            .insert([message])
            .select();
            
        if (error) throw error;
        
        console.log('Message sent successfully, response:', data);
        
        // Clear input
        messageInput.value = '';
        
        // If the subscription isn't working, manually add the message to UI
        // This is a fallback in case realtime isn't working
        if (data && data.length > 0) {
            const newMessage = data[0];
            
            // Check if this message is already in our list (avoid duplicates)
            const messageExists = chatMessages.some(m => 
                m.id === newMessage.id || 
                (m.username === newMessage.username && 
                 m.message === newMessage.message && 
                 m.created_at === newMessage.created_at)
            );
            
            if (!messageExists) {
                console.log('Manually adding message to UI (fallback)');
                chatMessages.push(newMessage);
                addMessageToUI(newMessage);
                scrollToBottom();
            }
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Error sending message. Please try again.');
    }
}

// Format time
function formatTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / (1000 * 60));
    
    if (diffMin < 1) {
        return 'just now';
    } else if (diffMin < 60) {
        return `${diffMin}m ago`;
    } else {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
}

// Escape HTML to prevent XSS
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Scroll chat to bottom
function scrollToBottom() {
    if (chatMessagesList) {
        const chatBody = chatMessagesList.parentElement;
        chatBody.scrollTop = chatBody.scrollHeight;
    }
}

// Enable realtime for chat messages table
async function enableRealtimeForChat() {
    try {
        console.log('Enabling realtime for chat_messages table...');
        
        // Check if the Supabase JS client has the realtimeClient property
        if (window.SupabaseDB.realtime) {
            // Enable channel for chat_messages table
            await window.SupabaseDB.realtime.channel('public:chat_messages').subscribe();
            console.log('Realtime enabled for chat_messages table');
        } else {
            console.warn('Supabase realtime client not available, trying alternate method');
            
            // For older Supabase versions, just try to connect
            await window.SupabaseDB.from('chat_messages').select('id').limit(1);
            console.log('Connected to chat_messages table');
        }
    } catch (error) {
        console.error('Error enabling realtime for chat:', error);
    }
}

// Export chat functions
window.BetaChat = {
    toggleChat,
    showChat,
    hideChat,
    sendMessage
};

// Self-executing initialization function to ensure chat is loaded
(function() {
    console.log('Checking document readiness for chat initialization');
    
    // If DOM is already loaded, initialize chat immediately
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log('Document already loaded, initializing chat now');
        setTimeout(() => {
            // Create chat UI elements if they don't exist
            createChatUI();
            
            // Initialize variables
            chatContainer = document.getElementById('chatContainer');
            chatToggle = document.getElementById('chatToggle');
            chatMessagesList = document.getElementById('chatMessages');
            chatForm = document.getElementById('chatForm');
            messageInput = document.getElementById('messageInput');
            chatBadge = document.getElementById('chatBadge');
            
            // Setup event listeners
            setupEventListeners();
            
            // Load existing messages
            loadChatMessages();
            
            // Set up real-time subscription for new messages
            enableRealtimeForChat();
            subscribeToNewMessages();
        }, 500); // Small delay to ensure everything is loaded
    }
})(); 