const RoleDepartmentCompany = require('../models/roleDepartmentCompany.model');
const RoleDepartment = require('../models/roleDepartment.model');

// Create a new RoleDepartmentCompany
exports.createRoleDepartmentCompany = async (req, res) => {
  try {
    const { roleDepartment, roleDepartmentCompanyName } = req.body;

    if (!roleDepartment || !roleDepartmentCompanyName) {
      return res.status(400).json({
        success: false,
        message: 'Role department ID and role department company name are required',
      });
    }

    // Verify roleDepartment exists and fetch its CompanyName
    const existingRoleDepartment = await RoleDepartment.findById(roleDepartment).populate('CompanyName');
    if (!existingRoleDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role department ID',
      });
    }

    const companyNameId = existingRoleDepartment.CompanyName._id;

    // Check if roleDepartmentCompanyName already exists for this roleDepartment and CompanyName
    const existingRoleDepartmentCompany = await RoleDepartmentCompany.findOne({
      roleDepartment,
      roleDepartmentCompanyName: { $regex: new RegExp(`^${roleDepartmentCompanyName}$`, 'i') },
    });
    if (existingRoleDepartmentCompany) {
      return res.status(400).json({
        success: false,
        message: 'Role department company name already exists for this role department',
      });
    }

    const newRoleDepartmentCompany = new RoleDepartmentCompany({
      roleDepartment,
      roleDepartmentCompanyName,
    });
    await newRoleDepartmentCompany.save();

    // Populate roleDepartment and its CompanyName in the response
    const populatedRoleDepartmentCompany = await RoleDepartmentCompany.findById(
      newRoleDepartmentCompany._id
    )
      .populate({
        path: 'roleDepartment',
        select: '-__v',
        populate: { path: 'CompanyName', select: 'companyName' },
      })
      .select('-__v');

    res.status(201).json({
      success: true,
      message: 'Role department company created successfully',
      data: populatedRoleDepartmentCompany,
    });
  } catch (error) {
    console.error('Error creating role department company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create role department company',
      error: error.message,
    });
  }
};

// Get all RoleDepartmentCompanies
exports.getAllRoleDepartmentCompanies = async (req, res) => {
  try {
    const roleDepartmentCompanies = await RoleDepartmentCompany.find()
      .populate({
        path: 'roleDepartment',
        select: '-__v',
        populate: { path: 'CompanyName', select: 'companyName' },
      })
      .select('-__v');
    res.status(200).json({
      success: true,
      message: 'Role department companies retrieved successfully',
      data: roleDepartmentCompanies,
    });
  } catch (error) {
    console.error('Error fetching role department companies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch role department companies',
      error: error.message,
    });
  }
};

// Get a single RoleDepartmentCompany by ID
exports.getRoleDepartmentCompanyById = async (req, res) => {
  try {
    const roleDepartmentCompany = await RoleDepartmentCompany.findById(req.params.id)
      .populate({
        path: 'roleDepartment',
        select: '-__v',
        populate: { path: 'CompanyName', select: 'companyName' },
      })
      .select('-__v');
    if (roleDepartmentCompany) {
      res.status(200).json({
        success: true,
        message: 'Role department company retrieved successfully',
        data: roleDepartmentCompany,
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Role department company not found',
      });
    }
  } catch (error) {
    console.error('Error fetching role department company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch role department company',
      error: error.message,
    });
  }
};

// Update a RoleDepartmentCompany by ID
exports.updateRoleDepartmentCompany = async (req, res) => {
  try {
    const { roleDepartment, roleDepartmentCompanyName } = req.body;

    if (!roleDepartment || !roleDepartmentCompanyName) {
      return res.status(400).json({
        success: false,
        message: 'Role department ID and role department company name are required',
      });
    }

    // Verify roleDepartment exists and fetch its CompanyName
    const existingRoleDepartment = await RoleDepartment.findById(roleDepartment).populate('CompanyName');
    if (!existingRoleDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role department ID',
      });
    }

    const companyNameId = existingRoleDepartment.CompanyName._id;

    // Check if roleDepartmentCompanyName already exists for this roleDepartment (excluding current ID)
    const existingRoleDepartmentCompany = await RoleDepartmentCompany.findOne({
      roleDepartment,
      roleDepartmentCompanyName: { $regex: new RegExp(`^${roleDepartmentCompanyName}$`, 'i') },
      _id: { $ne: req.params.id },
    });
    if (existingRoleDepartmentCompany) {
      return res.status(400).json({
        success: false,
        message: 'Role department company name already exists for this role department',
      });
    }

    const updatedRoleDepartmentCompany = await RoleDepartmentCompany.findByIdAndUpdate(
      req.params.id,
      { roleDepartment, roleDepartmentCompanyName },
      { new: true, runValidators: true }
    )
      .populate({
        path: 'roleDepartment',
        select: '-__v',
        populate: { path: 'CompanyName', select: 'companyName' },
      })
      .select('-__v');

    if (updatedRoleDepartmentCompany) {
      res.status(200).json({
        success: true,
        message: 'Role department company updated successfully',
        data: updatedRoleDepartmentCompany,
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Role department company not found',
      });
    }
  } catch (error) {
    console.error('Error updating role department company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update role department company',
      error: error.message,
    });
  }
};

// Delete a RoleDepartmentCompany by ID
exports.deleteRoleDepartmentCompany = async (req, res) => {
  try {
    const roleDepartmentCompany = await RoleDepartmentCompany.findByIdAndDelete(req.params.id);
    if (roleDepartmentCompany) {
      res.status(200).json({
        success: true,
        message: 'Role department company deleted successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Role department company not found',
      });
    }
  } catch (error) {
    console.error('Error deleting role department company:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete role department company',
      error: error.message,
    });
  }
};