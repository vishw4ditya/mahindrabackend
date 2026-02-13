const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const { auth, authorize } = require('../middleware/auth');

// Add Service (Technician only)
router.post('/', auth, authorize('Technician'), async (req, res) => {
  try {
    const service = new Service({
      ...req.body,
      technician: req.user._id,
      addedBy: req.user._id,
      zone: req.user.zone,
      branch: req.user.branch
    });
    await service.save();
    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get Services based on role
router.get('/', auth, authorize(['Owner', 'Regional Manager', 'Manager', 'Technician']), async (req, res) => {
  try {
    let query = {};
    const { zone, branch, technicianName, nextVisit, hasVisit, dateFrom, dateTo } = req.query;

    if (req.user.role === 'Technician') {
      query.technician = req.user._id;
    } else if (req.user.role === 'Manager') {
      query.branch = req.user.branch;
      query.zone = req.user.zone;
    } else if (req.user.role === 'Regional Manager') {
      query.zone = req.user.zone;
    }

    if (req.user.role === 'Owner') {
      if (zone) query.zone = zone;
      if (branch) query.branch = branch;
    }

    // Filter by technician name
    if (technicianName) {
      const technicians = await require('../models/User').find({ 
        name: { $regex: technicianName, $options: 'i' },
        role: 'Technician'
      });
      const technicianIds = technicians.map(t => t._id);
      query.technician = { $in: technicianIds };
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

    const services = await Service.find(query)
      .populate('technician', 'name')
      .populate('addedBy', 'name');
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Service (Technician can update their own records, Managers/RMs/Owners can update based on permissions)
router.put('/:id', auth, async (req, res) => {
  try {
    const serviceId = req.params.id;
    const service = await Service.findById(serviceId);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Authorization checks
    if (req.user.role === 'Technician') {
      // Technician can only update services they added
      if (service.addedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'You can only update services you added' });
      }
    } else if (req.user.role === 'Manager') {
      // Manager can only update services from their branch and zone
      if (service.zone !== req.user.zone || service.branch !== req.user.branch) {
        return res.status(403).json({ error: 'You can only update services from your branch' });
      }
    } else if (req.user.role === 'Regional Manager') {
      // Regional Manager can only update services from their zone
      if (service.zone !== req.user.zone) {
        return res.status(403).json({ error: 'You can only update services from your zone' });
      }
    }
    // Owner can update any service

    // Update service
    Object.assign(service, req.body);
    await service.save();
    
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Service (Owner, Regional Manager, Manager only)
router.delete('/:id', auth, authorize(['Owner', 'Regional Manager', 'Manager']), async (req, res) => {
  try {
    const serviceId = req.params.id;
    const service = await Service.findById(serviceId);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Check authorization based on role
    if (req.user.role === 'Manager') {
      // Manager can only delete services from their branch and zone
      if (service.zone !== req.user.zone || service.branch !== req.user.branch) {
        return res.status(403).json({ error: 'You can only delete services from your branch' });
      }
    } else if (req.user.role === 'Regional Manager') {
      // Regional Manager can only delete services from their zone
      if (service.zone !== req.user.zone) {
        return res.status(403).json({ error: 'You can only delete services from your zone' });
      }
    }
    // Owner can delete any service
    
    await Service.findByIdAndDelete(serviceId);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
