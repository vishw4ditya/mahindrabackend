const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, mobile, email, password, zone, branch, role } = req.body;
    
    // Generate Static ID (simplified for this example)
    const staticId = 'SID' + Math.floor(100000 + Math.random() * 900000);

    const user = new User({
      name,
      mobile,
      email,
      password,
      staticId,
      zone,
      branch,
      role,
      status: 'Pending'
    });

    await user.save();
    res.status(201).json({ message: 'Registration successful. Waiting for verification.', staticId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { mobile, password } = req.body; // Changed to mobile only
    
    // Validate mobile number format (10 digits)
    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
    }
    
    // Find user by mobile number only
    const user = await User.findOne({ mobile });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid mobile number or password' });
    }
    
    if (user.status !== 'Verified') {
      return res.status(403).json({ error: 'Your account is pending verification or has been rejected.' });
    }
    
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ user: { id: user._id, name: user.name, role: user.role, zone: user.zone, branch: user.branch, staticId: user.staticId, status: user.status }, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Password Reset using Static ID
router.post('/reset-password', async (req, res) => {
  try {
    const { mobile, staticId, newPassword } = req.body; // Changed to mobile only
    
    // Validate mobile number format (10 digits)
    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
    }
    
    // Find user by mobile number and static ID
    const user = await User.findOne({ mobile, staticId });
    
    if (!user) {
      return res.status(404).json({ error: 'Invalid Mobile Number or Static ID' });
    }
    
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
