const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// MongoDB Atlas connection string
// You need to replace this with your actual MongoDB Atlas connection string
const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb+srv://betagames:betagames123@cluster0.mongodb.net/betagames?retryWrites=true&w=majority';

// Connect to MongoDB Atlas
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB Atlas connection error:', err));

// Schema definitions
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 10000 },
  avatar: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

const gameHistorySchema = new mongoose.Schema({
  user: { type: String, required: true },
  game: { type: String, required: true },
  bet: { type: Number, required: true },
  result: { type: Number, required: true },
  time: { type: Date, default: Date.now }
});

const minesHistorySchema = new mongoose.Schema({
  user: { type: String, required: true },
  bet: { type: Number, required: true },
  mines: { type: Number, required: true },
  gemsFound: { type: Number, required: true },
  outcome: { type: Number, required: true },
  grid: { type: Number, required: true },
  time: { type: Date, default: Date.now }
});

const onlineUserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  lastActive: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model('User', userSchema);
const GameHistory = mongoose.model('GameHistory', gameHistorySchema);
const MinesHistory = mongoose.model('MinesHistory', minesHistorySchema);
const OnlineUser = mongoose.model('OnlineUser', onlineUserSchema);

// API routes
// User authentication
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    const newUser = new User({
      username,
      password, // In production, hash this password!
      balance: 10000
    });
    
    await newUser.save();
    
    res.status(201).json({
      id: newUser._id,
      username: newUser.username,
      balance: newUser.balance,
      avatar: newUser.avatar,
      createdAt: newUser.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Update user as online
    await OnlineUser.findOneAndUpdate(
      { username: user.username },
      { lastActive: new Date() },
      { upsert: true, new: true }
    );
    
    res.json({
      id: user._id,
      username: user.username,
      balance: user.balance,
      avatar: user.avatar,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user balance
app.put('/api/users/balance', async (req, res) => {
  try {
    const { username, amount, reason } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't allow negative balance
    if (user.balance + amount < 0) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    
    user.balance += amount;
    await user.save();
    
    res.json({ balance: user.balance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Game history
app.post('/api/history', async (req, res) => {
  try {
    const { user, game, bet, result } = req.body;
    const newHistory = new GameHistory({
      user,
      game,
      bet,
      result,
      time: new Date()
    });
    
    await newHistory.save();
    res.status(201).json(newHistory);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const history = await GameHistory.find()
      .sort({ time: -1 })
      .limit(100);
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mines game history
app.post('/api/mines/history', async (req, res) => {
  try {
    const { user, bet, mines, gemsFound, outcome, grid } = req.body;
    const newHistory = new MinesHistory({
      user,
      bet,
      mines,
      gemsFound,
      outcome,
      grid,
      time: new Date()
    });
    
    await newHistory.save();
    res.status(201).json(newHistory);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/mines/history', async (req, res) => {
  try {
    const history = await MinesHistory.find()
      .sort({ time: -1 })
      .limit(50);
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Online users tracking
app.post('/api/users/online', async (req, res) => {
  try {
    const { username } = req.body;
    
    await OnlineUser.findOneAndUpdate(
      { username },
      { lastActive: new Date() },
      { upsert: true, new: true }
    );
    
    res.json({ message: 'Online status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/users/online', async (req, res) => {
  try {
    // Consider users active in the last 5 minutes
    const cutoff = new Date(Date.now() - 5 * 60 * 1000);
    const onlineUsers = await OnlineUser.find({ lastActive: { $gt: cutoff } });
    
    res.json(onlineUsers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Redeem code endpoint
app.post('/api/redeem', async (req, res) => {
  try {
    const { code, username } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let amount = 0;
    let validCode = true;
    
    // List of valid codes and their rewards
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
    
    if (!validCode) {
      return res.status(400).json({ message: 'Invalid redeem code' });
    }
    
    user.balance += amount;
    await user.save();
    
    res.json({ message: 'Code redeemed successfully', amount, balance: user.balance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Serve the main page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 