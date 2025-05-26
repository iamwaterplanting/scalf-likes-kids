// MongoDB Atlas Connection Test Script
require('dotenv').config();
const mongoose = require('mongoose');

// Get connection string from environment variable or use a default for testing
const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb+srv://betagames:betagames123@cluster0.mongodb.net/betagames?retryWrites=true&w=majority';

console.log('Attempting to connect to MongoDB Atlas...');
console.log(`Using URI: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//******:******@')}`); // Hide credentials in output

// Connect to MongoDB Atlas
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('Database connection is working properly.');
    
    // Create a simple test document
    const Test = mongoose.model('Test', new mongoose.Schema({ 
      name: String, 
      created: { type: Date, default: Date.now }
    }));
    
    return Test.create({ name: 'Connection Test' })
      .then(doc => {
        console.log(`✅ Test document created successfully with ID: ${doc._id}`);
        return Test.findByIdAndDelete(doc._id);
      })
      .then(() => {
        console.log('✅ Test document deleted successfully');
        console.log('Your MongoDB Atlas setup is working correctly!');
      });
  })
  .catch(err => {
    console.error('❌ MongoDB Atlas connection error:', err);
    console.log('\nPossible issues:');
    console.log('1. Your connection string might be incorrect');
    console.log('2. The database user might not have the correct permissions');
    console.log('3. Your IP address might not be whitelisted in MongoDB Atlas Network Access');
    console.log('\nPlease check MONGODB_SETUP.md for setup instructions');
  })
  .finally(() => {
    // Close the connection
    mongoose.connection.close();
  }); 