const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { auth, authorize } = require('../middleware/auth');

// Add Customer (Salesman only)
router.post('/', auth, authorize('Salesman'), async (req, res) => {
  try {
    const customer = new Customer({
      ...req.body,
      salesman: req.user._id,
      addedBy: req.user._id,
      zone: req.user.zone,
      branch: req.user.branch
    });
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get Customers based on role
router.get('/', auth, authorize(['Owner', 'Regional Manager', 'Manager', 'Salesman']), async (req, res) => {
  try {
    let query = {};
    const { zone, branch, salesman, salesmanName, nextVisit, hasVisit, dateFrom, dateTo } = req.query;

    if (req.user.role === 'Salesman') {
      query.salesman = req.user._id;
    } else if (req.user.role === 'Manager') {
      query.branch = req.user.branch;
      query.zone = req.user.zone;
    } else if (req.user.role === 'Regional Manager') {
      query.zone = req.user.zone;
    }

    // Owner can filter by everything
    if (req.user.role === 'Owner') {
      if (zone) query.zone = zone;
      if (branch) query.branch = branch;
    }

    // Filter by salesman name
    if (salesmanName) {
      const salesmen = await require('../models/User').find({ 
        name: { $regex: salesmanName, $options: 'i' },
        role: 'Salesman'
      });
      const salesmanIds = salesmen.map(s => s._id);
      query.salesman = { $in: salesmanIds };
    }

    // Filter by visits
    if (nextVisit === 'true') {
      query.nextVisitDate = { $exists: true, $ne: null };
    } else if (nextVisit === 'false') {
      query.nextVisitDate = { $exists: false, $eq: null };
    }

    if (hasVisit === 'true') {
      query.visits = { $gt: 0 };
    } else if (hasVisit === 'false') {
      query.visits = { $eq: 0 };
    }

    // Filter by date range for nextVisitDate - only show items with visits in the date range
    if (dateFrom || dateTo) {
      // Initialize nextVisitDate filter if it doesn't exist
      if (!query.nextVisitDate) {
        query.nextVisitDate = {};
      }
      // If nextVisitDate already has $exists operator, replace it with date range operators
      if (query.nextVisitDate.$exists !== undefined) {
        query.nextVisitDate = {};
      }
      if (dateFrom) {
        query.nextVisitDate.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.nextVisitDate.$lte = endDate;
      }
    }

    const customers = await Customer.find(query)
      .populate('salesman', 'name')
      .populate('addedBy', 'name');
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Customer (Salesman can update their own records, Managers/RMs/Owners can update based on permissions)
router.put('/:id', auth, async (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = await Customer.findById(customerId);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Authorization checks
    if (req.user.role === 'Salesman') {
      // Salesman can only update customers they added
      if (customer.addedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'You can only update customers you added' });
      }
    } else if (req.user.role === 'Manager') {
      // Manager can only update customers from their branch and zone
      if (customer.zone !== req.user.zone || customer.branch !== req.user.branch) {
        return res.status(403).json({ error: 'You can only update customers from your branch' });
      }
    } else if (req.user.role === 'Regional Manager') {
      // Regional Manager can only update customers from their zone
      if (customer.zone !== req.user.zone) {
        return res.status(403).json({ error: 'You can only update customers from your zone' });
      }
    }
    // Owner can update any customer

    // Update customer
    Object.assign(customer, req.body);
    await customer.save();
    
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Customer (Owner, Regional Manager, Manager only)
router.delete('/:id', auth, authorize(['Owner', 'Regional Manager', 'Manager']), async (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = await Customer.findById(customerId);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Check authorization based on role
    if (req.user.role === 'Manager') {
      // Manager can only delete customers from their branch and zone
      if (customer.zone !== req.user.zone || customer.branch !== req.user.branch) {
        return res.status(403).json({ error: 'You can only delete customers from your branch' });
      }
    } else if (req.user.role === 'Regional Manager') {
      // Regional Manager can only delete customers from their zone
      if (customer.zone !== req.user.zone) {
        return res.status(403).json({ error: 'You can only delete customers from your zone' });
      }
    }
    // Owner can delete any customer
    
    await Customer.findByIdAndDelete(customerId);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
