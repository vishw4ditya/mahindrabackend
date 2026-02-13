const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const testUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find all users to see what we have
    const users = await User.find({});
    console.log('All users in database:');
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Static ID:', user.staticId);
      console.log('Status:', user.status);
      console.log('Role:', user.role);
      console.log('Zone:', user.zone);
      console.log('Branch:', user.branch);
    });
    
    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testUser();