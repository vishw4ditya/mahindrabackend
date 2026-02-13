const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const seedOwner = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const ownerExists = await User.findOne({ role: 'Owner' });
    if (ownerExists) {
      console.log('Owner already exists');
      process.exit();
    }

    const owner = new User({
      name: 'Admin Owner',
      mobile: '1234567890',
      email: 'owner@example.com',
      password: 'ownerpassword',
      staticId: 'OWNER001',
      role: 'Owner',
      status: 'Verified'
    });

    await owner.save();
    console.log('Owner created successfully');
    process.exit();
  } catch (error) {
    console.error('Error seeding owner:', error);
    process.exit(1);
  }
};

seedOwner();
