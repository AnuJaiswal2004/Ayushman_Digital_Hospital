const express = require('express');
const router = express.Router();
const { Staff, Department } = require('../models');

// Get all staff
router.get('/', async (req, res) => {
  try {
    const { role, dept_id, active } = req.query;
    let query = {};

    if (role) query.role = role;
    if (dept_id) query.dept_id = dept_id;
    if (active !== undefined) query.active = active === 'true';

    const staff = await Staff.find(query).sort({ name: 1 });

    res.json({
      success: true,
      count: staff.length,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get staff by ID
router.get('/:id', async (req, res) => {
  try {
    const staff = await Staff.findOne({ staff_id: req.params.id });

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new staff member
router.post('/', async (req, res) => {
  try {
    const { name, role, dept_id, active } = req.body;

    if (!name || !role) {
      return res.status(400).json({
        success: false,
        error: 'Name and role are required'
      });
    }

    // Generate staff ID
    const staffCount = await Staff.countDocuments();
    const staff_id = `STAFF${String(staffCount + 1).padStart(4, '0')}`;

    const staff = await Staff.create({
      staff_id,
      name,
      role,
      dept_id,
      active: active !== undefined ? active : true
    });

    res.status(201).json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update staff member
router.put('/:id', async (req, res) => {
  try {
    const staff = await Staff.findOneAndUpdate(
      { staff_id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Deactivate staff member
router.put('/:id/deactivate', async (req, res) => {
  try {
    const staff = await Staff.findOneAndUpdate(
      { staff_id: req.params.id },
      { active: false },
      { new: true }
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get staff by department
router.get('/department/:deptId', async (req, res) => {
  try {
    const staff = await Staff.find({ 
      dept_id: req.params.deptId,
      active: true 
    }).sort({ name: 1 });

    res.json({
      success: true,
      count: staff.length,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
