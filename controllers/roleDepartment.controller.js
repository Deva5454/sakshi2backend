const RoleDepartment = require('../models/roleDepartment.model');

// Create a new RoleDepartment
exports.createRoleDepartment = async (req, res) => {
  try {
    const { roleDepartment, CompanyName } = req.body;

    if (!roleDepartment || !CompanyName) {
      return res.status(400).json({
        success: false,
        message: 'Role department and CompanyName are required',
      });
    }

    // Check if roleDepartment already exists (case-insensitive) for the same CompanyName
    const existingRoleDepartment = await RoleDepartment.findOne({
      roleDepartment: { $regex: new RegExp(`^${roleDepartment}$`, 'i') },
      CompanyName,
    });
    if (existingRoleDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Role department already exists for this company',
      });
    }

    const newRoleDepartment = new RoleDepartment({
      roleDepartment,
      CompanyName,
    });
    await newRoleDepartment.save();

    res.status(201).json({
      success: true,
      message: 'Role department created successfully',
      data: newRoleDepartment,
    });
  } catch (error) {
    console.error('Error creating role department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create role department',
      error: error.message,
    });
  }
};

// Get all RoleDepartments
exports.getAllRoleDepartments = async (req, res) => {
  try {
    const roleDepartments = await RoleDepartment.find()
      .populate('CompanyName', 'companyName')
      .select('-__v');
    res.status(200).json({
      success: true,
      message: 'Role departments retrieved successfully',
      data: roleDepartments,
    });
  } catch (error) {
    console.error('Error fetching role departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch role departments',
      error: error.message,
    });
  }
};

// Get a single RoleDepartment by ID
exports.getRoleDepartmentById = async (req, res) => {
  try {
    const roleDepartment = await RoleDepartment.findById(req.params.id)
      .populate('CompanyName', 'companyName')
      .select('-__v');
    if (roleDepartment) {
      res.status(200).json({
        success: true,
        message: 'Role department retrieved successfully',
        data: roleDepartment,
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Role department not found',
      });
    }
  } catch (error) {
    console.error('Error fetching role department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch role department',
      error: error.message,
    });
  }
};

// Update a RoleDepartment by ID
exports.updateRoleDepartment = async (req, res) => {
  try {
    const { roleDepartment, CompanyName } = req.body;

    if (!roleDepartment || !CompanyName) {
      return res.status(400).json({
        success: false,
        message: 'Role department and CompanyName are required',
      });
    }

    // Check if roleDepartment already exists (case-insensitive, excluding current ID) for the same CompanyName
    const existingRoleDepartment = await RoleDepartment.findOne({
      roleDepartment: { $regex: new RegExp(`^${roleDepartment}$`, 'i') },
      CompanyName,
      _id: { $ne: req.params.id },
    });
    if (existingRoleDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Role department already exists for this company',
      });
    }

    const updatedRoleDepartment = await RoleDepartment.findByIdAndUpdate(
      req.params.id,
      { roleDepartment, CompanyName },
      { new: true, runValidators: true }
    )
      .populate('CompanyName', 'companyName')
      .select('-__v');

    if (updatedRoleDepartment) {
      res.status(200).json({
        success: true,
        message: 'Role department updated successfully',
        data: updatedRoleDepartment,
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Role department not found',
      });
    }
  } catch (error) {
    console.error('Error updating role department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update role department',
      error: error.message,
    });
  }
};

// Delete a RoleDepartment by ID
exports.deleteRoleDepartment = async (req, res) => {
  try {
    const roleDepartment = await RoleDepartment.findByIdAndDelete(req.params.id);
    if (roleDepartment) {
      res.status(200).json({
        success: true,
        message: 'Role department deleted successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Role department not found',
      });
    }
  } catch (error) {
    console.error('Error deleting role department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete role department',
      error: error.message,
    });
  }
};