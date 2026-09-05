const mongoose = require('mongoose');
const Purchase = require('../models/purchase.model');
const CompanyName = require('../models/companyName.model');
const Role = require('../models/role.model');
const Staff = require('../models/staff.model');
const Material = require('../models/material.model');
const Vendor = require('../models/vendor.model');
const Inventory = require('../models/inventory.model');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
// Get all companies
exports.getCompanies = async (req, res) => {
  try {
    const companies = await CompanyName.find().select('companyName _id');
    res.status(200).json({
      success: true,
      data: companies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching companies: ' + error.message
    });
  }
};

// Get all roles
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find({ isDelete: false }).select('roleName _id');
    res.status(200).json({
      success: true,
      data: roles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching roles: ' + error.message
    });
  }
};

// Get staff by role
exports.getStaffByRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    // Log the roleId for debugging
    console.log('Received roleId:', roleId);

    // Check if roleId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      console.log('Invalid roleId format:', roleId);
      return res.status(400).json({
        success: false,
        message: 'Invalid role ID format'
      });
    }

    // Verify role exists
    const role = await Role.findById(roleId);
    if (!role || role.isDelete) {
      console.log('Role not found or deleted:', roleId);
      return res.status(404).json({
        success: false,
        message: 'Role not found or has been deleted'
      });
    }

    // Fetch staff with the given role
    const staff = await Staff.find({ 
      role: roleId, 
      status: true 
    }).select('firstName lastName _id');

    res.status(200).json({
      success: true,
      count: staff.length,
      data: staff
    });
  } catch (error) {
    console.error('Error in getStaffByRole:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff: ' + error.message
    });
  }
};

// Create a new purchase
exports.createPurchase = async (req, res) => {
  try {
    const {
      vendorName,
      billNumber,
      material,
      quantity,
      ratePerSheet,
      kg,
      companyName,
      for: role,
      forCompany: staff
    } = req.body;

    // Validate required fields
    if (!vendorName || !billNumber || !material || !quantity || !ratePerSheet || 
        !kg || !companyName || !role || !staff) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(vendorName) ||
        !mongoose.Types.ObjectId.isValid(material) || 
        !mongoose.Types.ObjectId.isValid(companyName) || 
        !mongoose.Types.ObjectId.isValid(role) || 
        !mongoose.Types.ObjectId.isValid(staff)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    // Check if bill number already exists
    const existingPurchase = await Purchase.findOne({ billNumber });
    if (existingPurchase) {
      return res.status(400).json({
        success: false,
        message: 'Bill number must be unique'
      });
    }

        // Verify vendor exists
    const vendorExists = await Vendor.findById(vendorName);
    if (!vendorExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vendor',
      });
    }

    // Verify company exists
    const companyExists = await CompanyName.findById(companyName);
    if (!companyExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company'
      });
    }

    // Verify role exists and is not deleted
    const roleExists = await Role.findOne({ _id: role, isDelete: false });
    if (!roleExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or deleted role'
      });
    }

    // Verify staff exists and matches role
    const staffExists = await Staff.findOne({ 
      _id: staff, 
      role: role, 
      status: true 
    });
    if (!staffExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff or staff-role mismatch'
      });
    }

    // Verify material exists
    const materialExists = await Material.findById(material);
    if (!materialExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid material'
      });
    }

    // Create new purchase
    const newPurchase = new Purchase({
      vendorName,
      billNumber,
      material,
      quantity,
      ratePerSheet,
      kg,
      companyName,
      for: role,
      forCompany: staff
    });

    const savedPurchase = await newPurchase.save();

    // Create corresponding inventory record
    const category = roleExists.roleName.toLowerCase().includes('printer') ? 'printer' :
                    roleExists.roleName.toLowerCase().includes('binder') ? 'binder' :
                    roleExists.roleName.toLowerCase().includes('booklet') ? 'booklet' : 'factory';

    const newInventory = new Inventory({
      category,
      type: 'inward',
      material,
      quantity,
      kg,
      vendor: vendorName,
      date: new Date(),
      purchase: savedPurchase._id,
      companyName,
      for: role,
      forCompany: staff
    });

    await newInventory.save();

    // Populate all references
    const populatedPurchase = await Purchase.findById(savedPurchase._id)
      .populate('vendorName', 'name')
      .populate('material')
      .populate('companyName', 'companyName')
      .populate('for', 'roleName')
      .populate('forCompany', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: populatedPurchase
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating purchase: ' + error.message
    });
  }
};

// Get all purchases with populated references
exports.getAllPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate('vendorName', 'name')
      .populate('material')
      .populate('companyName', 'companyName')
      .populate('for', 'roleName')
      .populate('forCompany', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: purchases.length,
      data: purchases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching purchases: ' + error.message
    });
  }
};

// Get single purchase by ID with populated references
exports.getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
    .populate('vendorName', 'name')
      .populate('material')
      .populate('companyName', 'companyName')
      .populate('for', 'roleName')
      .populate('forCompany', 'firstName lastName');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    res.status(200).json({
      success: true,
      data: purchase
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase: ' + error.message
    });
  }
};

// Update purchase by ID
exports.updatePurchase = async (req, res) => {
  try {
    const {
      vendorName,
      billNumber,
      material,
      quantity,
      ratePerSheet,
      kg,
      companyName,
      for: role,
      forCompany: staff
    } = req.body;

    // Validate ObjectIds if provided
    
    if (vendorName && !mongoose.Types.ObjectId.isValid(vendorName)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vendor ID',
      });
    }

    if (material && !mongoose.Types.ObjectId.isValid(material)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid material ID'
      });
    }
    if (companyName && !mongoose.Types.ObjectId.isValid(companyName)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID'
      });
    }
    if (role && !mongoose.Types.ObjectId.isValid(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role ID'
      });
    }
    if (staff && !mongoose.Types.ObjectId.isValid(staff)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff ID'
      });
    }

    // Check if bill number is being updated to an existing one
    if (billNumber) {
      const existingPurchase = await Purchase.findOne({
        billNumber,
        _id: { $ne: req.params.id }
      });
      if (existingPurchase) {
        return res.status(400).json({
          success: false,
          message: 'Bill number must be unique'
        });
      }
    }

    // Verify vendor exists if provided
    if (vendorName) {
      const vendorExists = await Vendor.findById(vendorName);
      if (!vendorExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vendor',
        });
      }
    }

    // Verify company exists if provided
    if (companyName) {
      const companyExists = await CompanyName.findById(companyName);
      if (!companyExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid company'
        });
      }
    }

    // Verify role exists and is not deleted if provided
    if (role) {
      const roleExists = await Role.findOne({ _id: role, isDelete: false });
      if (!roleExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or deleted role'
        });
      }
    }

    // Verify staff exists and matches role if both provided
    if (staff && role) {
      const staffExists = await Staff.findOne({ 
        _id: staff, 
        role: role, 
        status: true 
      });
      if (!staffExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid staff or staff-role mismatch'
        });
      }
    }

    // Verify material exists if provided
    if (material) {
      const materialExists = await Material.findById(material);
      if (!materialExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid material'
        });
      }
    }

    const updatedPurchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      {
        vendorName,
        billNumber,
        material,
        quantity,
        ratePerSheet,
        kg,
        companyName,
        for: role,
        forCompany: staff
      },
      { new: true, runValidators: true }
    );

    if (!updatedPurchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    // Update or create corresponding inventory record
    const roleExists = await Role.findOne({ _id: role || updatedPurchase.for, isDelete: false });
    const category = roleExists.roleName.toLowerCase().includes('printer') ? 'printer' :
                    roleExists.roleName.toLowerCase().includes('binder') ? 'binder' :
                    roleExists.roleName.toLowerCase().includes('booklet') ? 'booklet' : 'factory';

    const existingInventory = await Inventory.findOne({ purchase: req.params.id });
    if (existingInventory) {
      await Inventory.findByIdAndUpdate(existingInventory._id, {
        category,
        type: 'inward',
        material: material || updatedPurchase.material,
        quantity: quantity || updatedPurchase.quantity,
        kg: kg || updatedPurchase.kg,
        vendor: vendorName || updatedPurchase.vendorName,
        date: new Date(),
        companyName: companyName || updatedPurchase.companyName,
        for: role || updatedPurchase.for,
        forCompany: staff || updatedPurchase.forCompany
      }, { new: true });
    } else {
      const newInventory = new Inventory({
        category,
        type: 'inward',
        material: material || updatedPurchase.material,
        quantity: quantity || updatedPurchase.quantity,
        kg: kg || updatedPurchase.kg,
        vendor: vendorName || updatedPurchase.vendorName,
        date: new Date(),
        purchase: req.params.id,
        companyName: companyName || updatedPurchase.companyName,
        for: role || updatedPurchase.for,
        forCompany: staff || updatedPurchase.forCompany
      });
      await newInventory.save();
    }

    // Populate all references
    const populatedPurchase = await Purchase.findById(updatedPurchase._id)
      .populate('vendorName', 'name')
      .populate('material')
      .populate('companyName', 'companyName')
      .populate('for', 'roleName')
      .populate('forCompany', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: populatedPurchase
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating purchase: ' + error.message
    });
  }
};

// Delete purchase by ID
exports.deletePurchase = async (req, res) => {
  try {
    const deletedPurchase = await Purchase.findByIdAndDelete(req.params.id);

    if (!deletedPurchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    // Delete associated inventory record
    await Inventory.deleteOne({ purchase: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Purchase deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting purchase: ' + error.message
    });
  }
};

// Get purchases by material ID
exports.getPurchasesByMaterial = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.materialId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid material ID'
      });
    }

    const purchases = await Purchase.find({ material: req.params.materialId })
      .populate('vendorName', 'name')
      .populate('material')
      .populate('companyName', 'companyName')
      .populate('for', 'roleName')
      .populate('forCompany', 'firstName lastName');

    res.status(200).json({
      success: true,
      count: purchases.length,
      data: purchases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching purchases by material: ' + error.message
    });
  }
};

// Get purchases by company ID
exports.getPurchasesByCompany = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.companyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID'
      });
    }

    const purchases = await Purchase.find({ companyName: req.params.companyId })
      .populate('vendorName', 'name')
      .populate('material')
      .populate('companyName', 'companyName')
      .populate('for', 'roleName')
      .populate('forCompany', 'firstName lastName');

    res.status(200).json({
      success: true,
      count: purchases.length,
      data: purchases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching purchases by company: ' + error.message
    });
  }
};

// Get purchases by date range
exports.getPurchasesByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const purchases = await Purchase.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
      .populate('vendorName', 'name')
      .populate('material')
      .populate('companyName', 'companyName')
      .populate('for', 'roleName')
      .populate('forCompany', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: purchases.length,
      data: purchases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching purchases by date range: ' + error.message
    });
  }
};

exports.bulkCreatePurchases = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const {
      vendorName,
      companyName,
      for: role,
      forCompany: staff,
      materialName,
      materialGSM,
      materialSize,
    } = req.body;

    // Validate required fields
    if (!vendorName || !companyName || !role || !staff || !materialName || !materialGSM || !materialSize) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided',
      });
    }

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(vendorName) ||
      !mongoose.Types.ObjectId.isValid(companyName) ||
      !mongoose.Types.ObjectId.isValid(role) ||
      !mongoose.Types.ObjectId.isValid(staff)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    // Verify vendor exists
    const vendorExists = await Vendor.findById(vendorName);
    if (!vendorExists) {
      return res.status(400).json({
        success: false,
        message: `Invalid vendor ID: ${vendorName}`,
      });
    }

    // Verify company exists
    const companyExists = await CompanyName.findById(companyName);
    if (!companyExists) {
      return res.status(400).json({
        success: false,
        message: `Invalid company ID: ${companyName}`,
      });
    }

    // Verify role exists and is not deleted
    const roleExists = await Role.findOne({ _id: role, isDelete: false });
    if (!roleExists) {
      return res.status(400).json({
        success: false,
        message: `Invalid or deleted role ID: ${role}`,
      });
    }

    // Verify staff exists and matches role
    const staffExists = await Staff.findOne({ _id: staff, role: role, status: true });
    if (!staffExists) {
      return res.status(400).json({
        success: false,
        message: `Invalid staff ID or staff-role mismatch: ${staff}`,
      });
    }

    // Resolve material ID
    const material = await Material.findOne({
      materialName,
      materialGSM: Number(materialGSM),
      materialSize,
    });
    if (!material) {
      return res.status(400).json({
        success: false,
        message: `Invalid material: Name=${materialName}, GSM=${materialGSM}, Size=${materialSize}`,
      });
    }

    const results = [];
    const filePath = path.join(__dirname, '../uploads', file.filename);

    // Parse CSV file
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          const purchases = [];
          const inventoryRecords = [];

          // Process each row
          for (const row of results) {
            const { billNumber, quantity, ratePerSheet, kg } = row;

            // Validate required fields
            if (!billNumber || !quantity || !ratePerSheet || !kg) {
              return res.status(400).json({
                success: false,
                message: `Missing required fields in row: ${JSON.stringify(row)}`,
              });
            }

            // Check for duplicate bill number
            const existingPurchase = await Purchase.findOne({ billNumber });
            if (existingPurchase) {
              return res.status(400).json({
                success: false,
                message: `Duplicate bill number: ${billNumber}`,
              });
            }

            // Prepare purchase record
            purchases.push({
              vendorName,
              billNumber,
              material: material._id,
              quantity: Number(quantity),
              ratePerSheet: Number(ratePerSheet),
              kg: Number(kg),
              companyName,
              for: role,
              forCompany: staff,
            });

            // Prepare inventory record
            const category = roleExists.roleName.toLowerCase().includes('printer')
              ? 'printer'
              : roleExists.roleName.toLowerCase().includes('binder')
              ? 'binder'
              : roleExists.roleName.toLowerCase().includes('booklet')
              ? 'booklet'
              : 'factory';

            inventoryRecords.push({
              category,
              type: 'inward',
              material: material._id,
              quantity: Number(quantity),
              kg: Number(kg),
              vendor: vendorName,
              date: new Date(),
              companyName,
              for: role,
              forCompany: staff,
            });
          }

          // Insert purchases
          const savedPurchases = await Purchase.insertMany(purchases);

          // Add purchase IDs to inventory records
          const inventoryWithPurchaseIds = inventoryRecords.map((inv, index) => ({
            ...inv,
            purchase: savedPurchases[index]._id,
          }));

          // Insert inventory records
          await Inventory.insertMany(inventoryWithPurchaseIds);

          // Clean up uploaded file
          fs.unlinkSync(filePath);

          // Populate saved purchases
          const populatedPurchases = await Purchase.find({ _id: { $in: savedPurchases.map((p) => p._id) } })
            .populate('vendorName', 'name')
            .populate('material')
            .populate('companyName', 'companyName')
            .populate('for', 'roleName')
            .populate('forCompany', 'firstName lastName');

          res.status(200).json({
            success: true,
            message: 'Bulk purchase upload completed successfully',
            count: savedPurchases.length,
            data: populatedPurchases,
          });
        } catch (error) {
          console.error('Error processing bulk upload:', error);
          fs.unlinkSync(filePath);
          res.status(500).json({
            success: false,
            message: `Failed to process bulk upload: ${error.message}`,
          });
        }
      });
  } catch (error) {
    console.error('Error in bulk upload:', error);
    res.status(500).json({
      success: false,
      message: `Server error during bulk upload: ${error.message}`,
    });
  }
};