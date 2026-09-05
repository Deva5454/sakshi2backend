const mongoose = require('mongoose');
const Inventory = require('../models/inventory.model');

exports.getInventoryByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    if (!['printer', 'binder', 'booklet', 'factory', 'godown'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    const inventory = await Inventory.find({ category })
      .populate('material', 'materialName materialSize materialGSM')
      .populate('vendor', 'name')
      .populate('companyName', 'companyName')
      .populate('for', 'roleName')
      .populate('forCompany', 'firstName lastName')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory: ' + error.message
    });
  }
};

exports.getInventorySummary = async (req, res) => {
  try {
    const { category } = req.params;
    if (!['printer', 'binder', 'booklet', 'factory', 'godown'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    const inward = await Inventory.aggregate([
      { $match: { category, type: 'inward' } },
      { $group: { _id: null, totalQty: { $sum: '$quantity' } } }
    ]);

    const outward = await Inventory.aggregate([
      { $match: { category, type: 'outward' } },
      { $group: { _id: null, totalQty: { $sum: '$quantity' } } }
    ]);

    const lastPurchase = inward.length > 0 ? inward[0].totalQty : 0;
    const usedQty = outward.length > 0 ? outward[0].totalQty : 0;
    const balance = lastPurchase - usedQty;

    res.status(200).json({
      success: true,
      data: { lastPurchase, usedQty, balance }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory summary: ' + error.message
    });
  }
};

