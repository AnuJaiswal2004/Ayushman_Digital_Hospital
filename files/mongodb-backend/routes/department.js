const express = require('express');
const router = express.Router();
const { Department, Staff } = require('../models');

// Get all departments
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });

    res.json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get department by ID
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findOne({ dept_id: req.params.id });

    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new department
router.post('/', async (req, res) => {
  try {
    const { name, location } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Department name is required'
      });
    }

    // Generate department ID
    const deptCount = await Department.countDocuments();
    const dept_id = `DEPT${String(deptCount + 1).padStart(3, '0')}`;

    const department = await Department.create({
      dept_id,
      name,
      location
    });

    res.status(201).json({
      success: true,
      data: department
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update department
router.put('/:id', async (req, res) => {
  try {
    const department = await Department.findOneAndUpdate(
      { dept_id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get department staff
router.get('/:id/staff', async (req, res) => {
  try {
    const staff = await Staff.find({ 
      dept_id: req.params.id,
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

// Delete department
router.delete('/:id', async (req, res) => {
  try {
    // Check if department has staff
    const staffCount = await Staff.countDocuments({ dept_id: req.params.id });
    
    if (staffCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete department with ${staffCount} staff member(s)`
      });
    }

    const department = await Department.findOneAndDelete({ dept_id: req.params.id });

    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
