const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

// Get all users with role-based filtering
router.get('/', auth, authorize(['Owner', 'Regional Manager', 'Manager']), async (req, res) => {
  try {
    const { zone, branch, role, status } = req.query;
    let query = {};

    // Apply role-based restrictions
    if (req.user.role === 'Regional Manager') {
      query.zone = req.user.zone;
      query.role = { $in: ['Manager', 'Salesman', 'Technician'] };
    } else if (req.user.role === 'Manager') {
      query.zone = req.user.zone;
      query.branch = req.user.branch;
      query.role = { $in: ['Salesman', 'Technician'] };
    }

    // Apply query filters if provided
    if (zone && req.user.role === 'Owner') query.zone = zone;
    if (branch && (req.user.role === 'Owner' || req.user.role === 'Regional Manager')) query.branch = branch;
    if (role) query.role = role;
    if (status) query.status = status;

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify/Reject user (Owner, Regional Manager, Manager)
router.patch('/verify/:id', auth, authorize(['Owner', 'Regional Manager', 'Manager']), async (req, res) => {
  try {
    const { status } = req.body; // 'Verified' or 'Rejected'
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Permission checks
    if (req.user.role === 'Regional Manager') {
      if (targetUser.zone !== req.user.zone || !['Manager', 'Salesman', 'Technician'].includes(targetUser.role)) {
        return res.status(403).json({ error: 'Not authorized to verify this user' });
      }
    } else if (req.user.role === 'Manager') {
      if (targetUser.zone !== req.user.zone || targetUser.branch !== req.user.branch || !['Salesman', 'Technician'].includes(targetUser.role)) {
        return res.status(403).json({ error: 'Not authorized to verify this user' });
      }
    }

    targetUser.status = status;
    await targetUser.save();
    res.json(targetUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get users for Regional Manager (their zone only)
router.get('/zone-users', auth, authorize(['Owner', 'Regional Manager']), async (req, res) => {
  try {
    const zone = req.user.role === 'Owner' ? req.query.zone : req.user.zone;
    if (!zone) return res.status(400).json({ error: 'Zone is required' });

    const users = await User.find({ zone, role: { $ne: 'Owner' } }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
