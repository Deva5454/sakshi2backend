const mongoose = require("mongoose");
const PerformanceInvoice = require("../models/performanceInvoice.model");
const CompanyName = require("../models/companyName.model");
const Party = require("../models/Party.model");
const Order = require("../models/order.model");

exports.createPerformanceInvoice = async (req, res) => {
  console.log("Creating performance invoice with data:", req.body);
  try {
    const {
      orderNumber,
      companyName,
      partyName,
      quantity,
      color,
      size,
      pType,
      assignedTo,
      unitPrice,
      total,
      applyGST,
      gstPercentage, // NEW
      finalAmount,
      GSTNo,
      partyAddress,
      servicePerformance,
      daysAfterConfirmation,
      paymentTerms,
      signature, // NEW
    } = req.body;

    if (
      !orderNumber ||
      !companyName ||
      !partyName ||
      !quantity ||
      !servicePerformance
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: orderNumber, companyName, partyName, quantity, or servicePerformance",
      });
    }

    const order = await Order.findOne({ orderNumber })
      .populate("companyName", "name")
      .populate(
        "party",
        "partyName contactPerson personWhatsAppNo GSTNo address"
      )
      .populate("productItem", "itemName");
    if (!order) {
      return res.status(400).json({
        success: false,
        message: "Invalid order number",
      });
    }

    const company = await CompanyName.findById(companyName);
    if (!company) {
      return res.status(400).json({
        success: false,
        message: "Invalid companyName ID",
      });
    }

    const party = await Party.findById(partyName);
    if (!party) {
      return res.status(400).json({
        success: false,
        message: "Invalid partyName ID",
      });
    }

    const calculatedTotal = quantity * (unitPrice || 0);
    const calculatedFinalAmount = applyGST
      ? calculatedTotal * (1 + (gstPercentage || 0) / 100)
      : calculatedTotal;
       let assignedToValue = assignedTo;
    if (assignedTo === "" || assignedTo === null || assignedTo === undefined) {
      assignedToValue = undefined;
    }
    const performanceInvoiceData = {
      orderNumber,
      assignedTo: assignedToValue,
      order: order._id,
      companyName,
      party: partyName,
      quantity,
      color: color || order.productItem?.color || "",
      size: size || order.productItem?.size || "",
      pType: pType || "",
      unitPrice: unitPrice,
      total: calculatedTotal,
      applyGST: applyGST || false,
      gstPercentage: gstPercentage || 0, // NEW
      finalAmount: calculatedFinalAmount,
      GSTNo: GSTNo || order.party?.GSTNo || "",
      partyAddress: partyAddress || order.party?.address || {},
      servicePerformance: servicePerformance || order.productItem?.itemName || "",
      daysAfterConfirmation,
      paymentTerms: paymentTerms || "",
      signature: signature || "", // NEW
    };

    const newPerformanceInvoice = await PerformanceInvoice.create(performanceInvoiceData);

    const populatedInvoice = await PerformanceInvoice.findById(newPerformanceInvoice._id)
      .populate("companyName", "name")
      .populate("party", "partyName GSTNo address")
      .populate("assignedTo", "firstName lastName");

    res.status(201).json({
      success: true,
      message: "Performance invoice created successfully",
      data: populatedInvoice,
    });
  } catch (error) {
    console.error("Error creating performance invoice:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create performance invoice",
      error: error.message,
    });
  }
};

exports.getAllPerformanceInvoices = async (req, res) => {
  try {
    const performanceInvoices = await PerformanceInvoice.find()
      .populate("companyName")
      .populate("party")
      .populate("order")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: performanceInvoices.length,
      data: performanceInvoices,
    });
  } catch (error) {
    console.error("Error getting performance invoices:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch performance invoices",
      error: error.message,
    });
  }
};

exports.getPerformanceInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid PerformanceInvoice ID",
      });
    }

    const performanceInvoice = await PerformanceInvoice.findById(id)
      .populate("companyName", "name")
      .populate("party", "partyName GSTNo address")
      .populate("assignedTo", "firstName lastName");

    if (!performanceInvoice) {
      return res.status(404).json({
        success: false,
        message: "Performance invoice not found",
      });
    }

    const responseData = {
      _id: performanceInvoice._id,
      orderNumber: performanceInvoice.orderNumber,
      companyName: performanceInvoice.companyName._id.toString(),
      partyName: performanceInvoice.party._id.toString(),
      quantity: performanceInvoice.quantity,
      color: performanceInvoice.color,
      size: performanceInvoice.size,
      pType: performanceInvoice.pType,
      GSTNo: performanceInvoice.GSTNo,
      partyAddress: performanceInvoice.partyAddress,
      servicePerformance: performanceInvoice.servicePerformance,
      unitPrice: performanceInvoice.unitPrice || 0,
      total: performanceInvoice.total || 0,
      applyGST: performanceInvoice.applyGST || false,
      finalAmount: performanceInvoice.finalAmount || 0,
      assignedTo: performanceInvoice.assignedTo,
      companyNameObj: performanceInvoice.companyName,
      partyObj: performanceInvoice.party,
      paymentTerms: performanceInvoice.paymentTerms || "",
      signature: performanceInvoice.signature || "",
    };

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching performance invoice:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch performance invoice",
      error: error.message,
    });
  }
};

exports.updatePerformanceInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      orderNumber,
      companyName,
      partyName,
      quantity,
      color,
      size,
      pType,
      assignedTo,
      unitPrice,
      total,
      applyGST,
      gstPercentage, // NEW
      finalAmount,
      GSTNo,
      partyAddress,
      servicePerformance,
      daysAfterConfirmation,
      paymentTerms,
      signature, // NEW
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid PerformanceInvoice ID",
      });
    }

    const performanceInvoice = await PerformanceInvoice.findById(id);
    if (!performanceInvoice) {
      return res.status(400).json({
        success: false,
        message: "Performance invoice not found",
      });
    }

    if (
      !orderNumber ||
      !companyName ||
      !partyName ||
      !quantity ||
      !servicePerformance
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: orderNumber, companyName, partyName, quantity, or servicePerformance",
      });
    }

    const order = await Order.findOne({ orderNumber });
    if (!order) {
      return res.status(400).json({
        success: false,
        message: "Invalid order number",
      });
    }

    const company = await CompanyName.findById(companyName);
    if (!company) {
      return res.status(400).json({
        success: false,
        message: "Invalid companyName ID",
      });
    }

    const party = await Party.findById(partyName);
    if (!party) {
      return res.status(400).json({
        success: false,
        message: "Invalid partyName ID",
      });
    }

    const calculatedTotal = quantity * (unitPrice || 0);
    const calculatedFinalAmount = applyGST ? calculatedTotal * (1 + (gstPercentage || 0) / 100) : calculatedTotal;
       let assignedToValue = assignedTo;
    if (assignedTo === "" || assignedTo === null || assignedTo === undefined) {
      assignedToValue = undefined; // Set to undefined so it doesn't get updated
    }
    const updatedPerformanceInvoice = await PerformanceInvoice.findByIdAndUpdate(
        id,
        {
          orderNumber,
          order: order._id,
          companyName,
          party: partyName,
          quantity,
          color,
          assignedTo: assignedToValue,
          size,
          pType,
          unitPrice: unitPrice,
          total: calculatedTotal,
          applyGST: applyGST || false,
          gstPercentage: gstPercentage || 0, // NEW
          finalAmount: calculatedFinalAmount,
          GSTNo: GSTNo || order.party?.GSTNo || "",
          partyAddress: partyAddress || order.party?.address || {},
          servicePerformance,
          daysAfterConfirmation,
          paymentTerms: paymentTerms || performanceInvoice.paymentTerms || "",
          signature: signature || performanceInvoice.signature || "", // NEW
        },
        { new: true, runValidators: true }
      )
        .populate("companyName", "name")
        .populate("party")
        .populate("order")
        .populate("assignedTo", "firstName lastName");

    res.status(200).json({
      success: true,
      message: "Performance invoice updated successfully",
      data: updatedPerformanceInvoice,
    });
  } catch (error) {
    console.error("Error updating performance invoice:", error);
    res.status(500).json({
      success: false,
      // message: "Failed to update performance invoice",
      error: error.message,
    });
  }
};

exports.deletePerformanceInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid PerformanceInvoice ID",
      });
    }

    const performanceInvoice = await PerformanceInvoice.findByIdAndDelete(id);
    if (!performanceInvoice) {
      return res.status(404).json({
        success: false,
        message: "Performance invoice not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Performance invoice deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting performance invoice:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete performance invoice",
      error: error.message,
    });
  }
};