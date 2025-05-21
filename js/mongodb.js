// MongoDB Connection and Models
const { MongoClient } = require('mongodb');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://betagames:betagames123@cluster0.mongodb.net/betagames?retryWrites=true&w=majority';

// Create MongoDB client
const client = new MongoClient(MONGODB_URI);

// Connect to MongoDB
async function connectToMongo() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        return client.db('betagames');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

// User operations
const userOperations = {
    async findUser(username) {
        const db = await connectToMongo();
        return db.collection('users').findOne({ username });
    },

    async createUser(username, password) {
        const db = await connectToMongo();
        const user = {
            username,
            password,
            balance: 100,
            avatar: null,
            createdAt: new Date()
        };
        await db.collection('users').insertOne(user);
        return user;
    },

    async updateBalance(username, amount) {
        const db = await connectToMongo();
        const result = await db.collection('users').findOneAndUpdate(
            { username },
            { $inc: { balance: amount } },
            { returnDocument: 'after' }
        );
        return result.value;
    }
};

// Game history operations
const gameHistoryOperations = {
    async addGameHistory(gameData) {
        const db = await connectToMongo();
        const history = {
            ...gameData,
            time: new Date()
        };
        await db.collection('gameHistory').insertOne(history);
        return history;
    },

    async getRecentHistory(limit = 100) {
        const db = await connectToMongo();
        return db.collection('gameHistory')
            .find()
            .sort({ time: -1 })
            .limit(limit)
            .toArray();
    }
};

// Export operations
module.exports = {
    userOperations,
    gameHistoryOperations
}; 