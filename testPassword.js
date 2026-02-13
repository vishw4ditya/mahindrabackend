const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const testPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const user = await User.findOne({mobile: '7526070323'});
    console.log('User:', user.name);
    console.log('Mobile:', user.mobile);
    console.log('Role:', user.role);
    console.log('Status:', user.status);
    console.log('Static ID:', user.staticId);
    
    // Test common passwords
    const passwordsToTest = ['test123', 'password', '123456', 'admin', 'user123', user.staticId, '7526070323'];
    
    console.log('\nTesting passwords:');
    for (const password of passwordsToTest) {
      const isMatch = await bcrypt.compare(password, user.password);
      console.log(`  ${password}: ${isMatch ? '✓ MATCH' : '✗ NO MATCH'}`);
    }
    
    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testPasswords();