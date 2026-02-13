const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const users = await User.find({});
    console.log('All users in database:');
    console.log('=====================');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Name: ${user.name}`);
      console.log(`   Mobile: ${user.mobile}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Static ID: ${user.staticId}`);
      console.log('   ---');
    });
    
    console.log(`\nTotal users: ${users.length}`);
    
    // Check for verified users
    const verifiedUsers = users.filter(user => user.status === 'Verified');
    console.log(`\nVerified users: ${verifiedUsers.length}`);
    
    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkUsers();