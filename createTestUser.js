const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const createTestUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'testuser@example.com' });
    if (existingUser) {
      console.log('Test user already exists');
      console.log('Email:', existingUser.email);
      console.log('Static ID:', existingUser.staticId);
      process.exit();
    }
    
    // Create new test user
    const testUser = new User({
      name: 'Test User',
      mobile: '9999999998',  // Changed mobile number
      email: 'testuser@example.com',
      password: 'test123',
      staticId: 'TEST123456',
      role: 'Manager',
      zone: 'Zone A',
      branch: 'Branch 1',
      status: 'Verified'
    });
    
    await testUser.save();
    console.log('Test user created successfully');
    console.log('Email: testuser@example.com');
    console.log('Password: test123');
    console.log('Static ID:', testUser.staticId);
    
    process.exit();
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
};

createTestUser();