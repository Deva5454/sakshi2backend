const Material = require('../models/material.model');
const csv = require('csv-parser');
const fs = require('fs');
const mongoose = require("mongoose");
const path = require('path');
// Create a new Material
exports.createMaterial = async (req, res) => {
  try {
    const requiredFields = ['materialName', 'materialSize', 'materialGSM'];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`,
        });
      }
    }

    // Check if material with the same name, size, and GSM already exists
    const existingMaterial = await Material.findOne({
      materialName: req.body.materialName,
      materialSize: req.body.materialSize,
      materialGSM: req.body.materialGSM,
    });
    if (existingMaterial) {
      return res.status(400).json({
        success: false,
        message: 'Material with this name, size, and GSM already exists',
      });
    }

    const materialData = {
      materialName: req.body.materialName,
      materialSize: req.body.materialSize,
      materialGSM: req.body.materialGSM,
    };

    const newMaterial = new Material(materialData);
    await newMaterial.save();

    res.status(201).json({
      success: true,
      message: 'Material created successfully',
      data: newMaterial,
    });
  } catch (error) {
    console.error('Error creating material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create material',
      error: error.message,
    });
  }
};

// Get all Materials
exports.getAllMaterials = async (req, res) => {
  try {
    const materials = await Material.find().select('-__v');
    res.status(200).json({
      success: true,
      message: 'Materials retrieved successfully',
      data: materials,
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch materials',
      error: error.message,
    });
  }
};

// Get a single Material by ID
exports.getMaterialById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id).select('-__v');
    if (material) {
      res.status(200).json({
        success: true,
        message: 'Material retrieved successfully',
        data: material,
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Material not found',
      });
    }
  } catch (error) {
    console.error('Error fetching material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch material',
      error: error.message,
    });
  }
};

// Update a Material by ID
exports.updateMaterial = async (req, res) => {
  try {
    // Check if updating to a material with the same name, size, and GSM already exists
    if (req.body.materialName || req.body.materialSize || req.body.materialGSM) {
      const existingMaterial = await Material.findOne({
        materialName: req.body.materialName || undefined,
        materialSize: req.body.materialSize || undefined,
        materialGSM: req.body.materialGSM || undefined,
        _id: { $ne: req.params.id },
      });
      if (existingMaterial) {
        return res.status(400).json({
          success: false,
          message: 'Material with this name, size, and GSM already exists',
        });
      }
    }

    const updatedMaterial = await Material.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-__v');

    if (updatedMaterial) {
      res.status(200).json({
        success: true,
        message: 'Material updated successfully',
        data: updatedMaterial,
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Material not found',
      });
    }
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update material',
      error: error.message,
    });
  }
};

// Delete a Material by ID
exports.deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);
    if (material) {
      res.status(200).json({
        success: true,
        message: 'Material deleted successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Material not found',
      });
    }
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete material',
      error: error.message,
    });
  }
};


exports.bulkCreateMaterials = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const results = [];
    const filePath = path.join(__dirname, "../Uploads", file.filename);

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          const materials = [];
          const errors = [];

          for (const row of results) {
            const { materialName, materialSize, materialGSM } = row;

            // Validate required fields
            if (
              !materialName ||
              !materialName.trim() ||
              !materialSize ||
              !materialSize.trim() ||
              !materialGSM ||
              !materialGSM.trim()
            ) {
              errors.push(
                `Missing required fields in row: ${JSON.stringify(row)}`
              );
              continue;
            }

            // Clean and validate materialGSM
            const cleanedGSM = materialGSM.replace(/[^0-9.]/g, ""); // Remove non-numeric characters except decimal
            const gsmNumber = parseFloat(cleanedGSM);

            if (isNaN(gsmNumber) || gsmNumber <= 0) {
              errors.push(`Invalid GSM in row: ${JSON.stringify(row)}`);
              continue;
            }

            // Check for existing material
            const existingMaterial = await mongoose.model("Material").findOne({
              materialName: materialName.trim(),
              materialSize: materialSize.trim(),
              materialGSM: gsmNumber,
            });

            if (existingMaterial) {
              errors.push(
                `Material already exists: ${materialName}, ${materialSize}, ${gsmNumber} GSM`
              );
              continue;
            }

            materials.push({
              materialName: materialName.trim(),
              materialSize: materialSize.trim(),
              materialGSM: gsmNumber,
            });
          }

          if (errors.length > 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({
              success: false,
              message: "Some rows contain errors",
              errors,
            });
          }

          const savedMaterials = await mongoose
            .model("Material")
            .insertMany(materials);
          fs.unlinkSync(filePath);

          res.status(200).json({
            success: true,
            message: "Bulk material upload completed successfully",
            count: savedMaterials.length,
            data: savedMaterials,
          });
        } catch (error) {
          console.error("Error processing bulk upload:", error);
          fs.unlinkSync(filePath);
          res.status(500).json({
            success: false,
            message: `Failed to process bulk upload: ${error.message}`,
          });
        }
      })
      .on("error", (error) => {
        console.error("Error reading CSV file:", error);
        fs.unlinkSync(filePath);
        res.status(500).json({
          success: false,
          message: `Error reading CSV file: ${error.message}`,
        });
      });
  } catch (error) {
    console.error("Error in bulk upload:", error);
    res.status(500).json({
      success: false,
      message: `Server error during bulk upload: ${error.message}`,
    });
  }
};