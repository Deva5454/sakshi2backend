const mongoose = require('mongoose');
const Vendor = require('../models/vendor.model');
const CompanyName = require('../models/companyName.model');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
// Get all vendors
exports.getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find()
      .populate('companyName', 'companyName')
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vendors: ' + error.message,
    });
  }
};

// Get single vendor by ID
exports.getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate(
      'companyName',
      'companyName'
    );
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }
    res.status(200).json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vendor: ' + error.message,
    });
  }
};

// Create a new vendor
exports.createVendor = async (req, res) => {
  try {
    const { companyName, name, contactNumber, whatsappNumber, gst, address } =
      req.body;

    // Validate required fields
    if (!companyName || !name || !contactNumber || !whatsappNumber || !address) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided',
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(companyName)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID',
      });
    }

    // Verify company exists
    const companyExists = await CompanyName.findById(companyName);
    if (!companyExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company',
      });
    }

    // Create new vendor
    const newVendor = new Vendor({
      companyName,
      name,
      contactNumber,
      whatsappNumber,
      gst: gst || '',
      address,
    });

    const savedVendor = await newVendor.save();

    // Populate companyName
    const populatedVendor = await Vendor.findById(savedVendor._id).populate(
      'companyName',
      'companyName'
    );

    res.status(201).json({
      success: true,
      data: populatedVendor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating vendor: ' + error.message,
    });
  }
};

// Update vendor by ID
exports.updateVendor = async (req, res) => {
  try {
    const { companyName, name, contactNumber, whatsappNumber, gst, address } =
      req.body;

    // Validate ObjectId if provided
    if (companyName && !mongoose.Types.ObjectId.isValid(companyName)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID',
      });
    }

    // Verify company exists if provided
    if (companyName) {
      const companyExists = await CompanyName.findById(companyName);
      if (!companyExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid company',
        });
      }
    }

    const updatedVendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      {
        companyName,
        name,
        contactNumber,
        whatsappNumber,
        gst,
        address,
      },
      { new: true, runValidators: true }
    ).populate('companyName', 'companyName');

    if (!updatedVendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    res.status(200).json({
      success: true,
      data: updatedVendor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating vendor: ' + error.message,
    });
  }
};

// Delete vendor by ID
exports.deleteVendor = async (req, res) => {
  try {
    const deletedVendor = await Vendor.findByIdAndDelete(req.params.id);

    if (!deletedVendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vendor deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting vendor: ' + error.message,
    });
  }
};
exports.bulkCreateVendors = async (req, res) => {
  try {
    const file = req.file;
    const { companyName } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    if (!companyName) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(companyName)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID',
      });
    }

    const companyExists = await CompanyName.findById(companyName);
    if (!companyExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID',
      });
    }

    const results = [];
    const filePath = path.join(__dirname, '../Uploads', file.filename);

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          const vendors = [];
          const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

          for (const row of results) {
            const { name, contactNumber, whatsappNumber, gst, address } = row;

            if (!name || !contactNumber || !whatsappNumber || !address) {
              return res.status(400).json({
                success: false,
                message: `Missing required fields in row: ${JSON.stringify(row)}`,
              });
            }

            if (contactNumber.length !== 10 || !/^[0-9]{10}$/.test(contactNumber)) {
              return res.status(400).json({
                success: false,
                message: `Invalid contact number in row: ${JSON.stringify(row)}`,
              });
            }

            if (whatsappNumber.length !== 10 || !/^[0-9]{10}$/.test(whatsappNumber)) {
              return res.status(400).json({
                success: false,
                message: `Invalid WhatsApp number in row: ${JSON.stringify(row)}`,
              });
            }

            if (gst && !gstRegex.test(gst)) {
              return res.status(400).json({
                success: false,
                message: `Invalid GST number in row: ${JSON.stringify(row)}`,
              });
            }

            vendors.push({
              companyName,
              name,
              contactNumber,
              whatsappNumber,
              gst: gst || '',
              address,
            });
          }

          const savedVendors = await Vendor.insertMany(vendors);
          fs.unlinkSync(filePath);

          const populatedVendors = await Vendor.find({ _id: { $in: savedVendors.map((v) => v._id) } })
            .populate('companyName', 'companyName');

          res.status(200).json({
            success: true,
            message: 'Bulk vendor upload completed successfully',
            count: savedVendors.length,
            data: populatedVendors,
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