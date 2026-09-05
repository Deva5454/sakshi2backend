const Order = require("../models/order.model");
const mongoose = require("mongoose");
const Sequence = require("../models/sequence.model");
const Company = require("../models/companyName.model");
const AssignTask = require("../models/assignTask.model");
const Party = require("../models/Party.model");
const Staff = require("../models/staff.model");

exports.createOrder = async (req, res) => {
  try {
    console.log("=== CREATE ORDER DEBUG ===");
    console.log("req.body:", req.body);
    console.log("=========================");

    const {
      companyName,
      party,
      productItem,
      qty,
      remarks,
      filePaths,
      createdBy,
      isGst,
      size,
      rate,
      rateType,
      isLamination,
      laminationType,
    } = req.body;

    // Validate required fields
    if (!companyName || !party || !productItem || !qty) {
      return res.status(400).json({
        success: false,
        message: "Company, Party, Product Item, and Quantity are required",
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(companyName)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Company ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(party)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Party ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productItem)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product Item ID",
      });
    }

    // Validate rate and rateType
    if (rate !== undefined && (isNaN(rate) || rate < 0)) {
      return res.status(400).json({
        success: false,
        message: "Rate must be a non-negative number",
      });
    }

    if (rateType !== undefined && !["old", "new"].includes(rateType)) {
      return res.status(400).json({
        success: false,
        message: "Rate type must be either 'old' or 'new'",
      });
    }

    if (isLamination !== undefined && typeof isLamination !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isLamination must be a boolean",
      });
    }

    if (isLamination && laminationType && !["Matte", "Gloss"].includes(laminationType)) {
      return res.status(400).json({
        success: false,
        message: "Lamination type must be either 'Matte' or 'Gloss' when lamination is selected",
      });
    }

    const company = await Company.findById(companyName).select("companyName");
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Generate company initials (first two characters of the first two words)
    const companyWords = company.companyName.trim().split(/\s+/);
    let initials = "";
    if (companyWords.length >= 2) {
      initials = (companyWords[0][0] + companyWords[1][0]).toUpperCase();
    } else {
      initials = companyWords[0].substring(0, 2).toUpperCase();
    }

    // Get or create global sequence
    let sequence = await Sequence.findOne({ type: "global_order" });
    if (!sequence) {
      sequence = new Sequence({ type: "global_order", lastSequence: 100 });
      await sequence.save();
    }

    // Increment sequence and generate order number
    sequence.lastSequence += 1;
    const orderNumber = `${initials}-${sequence.lastSequence}`; // This will generate order number starting from 101
    await sequence.save();

    // Process file paths with remarks
    let processedFilePaths = [];
    if (filePaths) {
      try {
        if (typeof filePaths === "string") {
          const parsed = JSON.parse(filePaths);
          processedFilePaths = Array.isArray(parsed)
            ? parsed.map((item) => ({
                path: typeof item === "string" ? item : item.path,
                remark: typeof item === "object" ? item.remark || "" : "",
                uploadedAt: new Date(),
              }))
            : [];
        } else if (Array.isArray(filePaths)) {
          processedFilePaths = filePaths.map((item) => ({
            path: typeof item === "string" ? item : item.path,
            remark: typeof item === "object" ? item.remark || "" : "",
            uploadedAt: new Date(),
          }));
        }
        console.log("Processed file paths:", processedFilePaths);
      } catch (error) {
        console.error("Error processing file paths:", error);
        processedFilePaths = [];
      }
    }

    // Create order
    const orderData = {
      companyName,
      party,
      productItem,
      qty: Number.parseInt(qty),
      remarks: remarks || "",
      filePaths: processedFilePaths,
      createdBy: createdBy || req.user?.id,
      orderNumber,
      isGst: isGst !== false,
      size: size || "",
      rate: rate !== undefined ? Number.parseFloat(rate) : undefined,
      rateType: rateType || undefined,
      isLamination: isLamination !== undefined ? isLamination : false,
      laminationType: isLamination ? laminationType || "" : "",
    };

    console.log("Creating order with data:", orderData);

    const order = new Order(orderData);
    await order.save();
    const partyDoc = await Party.findById(party);
    if (partyDoc && partyDoc.partyTag === "New") {
      partyDoc.partyTag = "Customer";
      await partyDoc.save();
      console.log(`Updated party ${partyDoc._id} tag from New to Customer`);
      console.log("🚀 ~ Update:", Update);
    }
    // Populate the order for response
    const populatedOrder = await Order.findById(order._id)
      .populate("companyName", "companyName")
      .populate("party", "partyName")
      .populate("productItem", "itemName")
      .populate("createdBy")
      .populate("designer", "name");

    console.log("✅ Order created successfully:", populatedOrder._id);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: populatedOrder,
    });
  } catch (error) {
    console.error("❌ Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      companyName,
      party,
      search,
    } = req.query;

    console.log("=== GET ALL ORDERS DEBUG ===");
    console.log("Query params:", req.query);
    console.log("===========================");

    // Build filter object
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (companyName && mongoose.Types.ObjectId.isValid(companyName)) {
      filter.companyName = companyName;
    }

    if (party && mongoose.Types.ObjectId.isValid(party)) {
      filter.party = party;
    }

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit);

    // Get orders with population
    const orders = await Order.find(filter)
      .populate("companyName")
      .populate("party")
      .populate("productItem", "itemName")
      .populate("createdBy")
      .populate("designer", "firstName lastName")
      .populate("printer", "firstName lastName")
      .populate("deliveryStaff", "name")

      .populate("binder", "firstName lastName")
      .populate("bookletBinder", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit));

    // Then conditionally remove GST if isGst is false
    // orders = orders.map((order) => {
    //   if (!order.isGst && order.party) {
    //     // Create a new party object without GSTNo
    //     const { GSTNo, ...partyWithoutGst } = order.party.toObject();
    //     return {
    //       ...order.toObject(),
    //       party: partyWithoutGst,
    //     };
    //   }
    //   return order;
    // });

    // Get total count
    const totalCount = await Order.countDocuments(filter);

    console.log(`📊 Found ${orders.length} orders out of ${totalCount} total`);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(totalCount / Number.parseInt(limit)),
        totalCount,
        hasNext: skip + orders.length < totalCount,
        hasPrev: Number.parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("❌ Get all orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("=== GET ORDER BY ID DEBUG ===");
    console.log("Order ID:", id);
    console.log("=============================");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Order ID",
      });
    }

    const order = await Order.findById(id)
      .populate("companyName", "companyName")
      .populate("party")
      .populate("productItem", "itemName")
      .populate("createdBy")
      .populate("designer", "name")
      .populate("printer", "name")
      .populate("deliveryStaff", "name")
      .populate("binder", "name")
      .populate("bookletBinder", "name")
      .populate("reworkHistory.createdBy", "name");

    // order = order.map((order) => {
    //   if (!order.isGst && order.party) {
    //     // Create a new party object without GSTNo
    //     const { GSTNo, ...partyWithoutGst } = order.party.toObject();
    //     return {
    //       ...order.toObject(),
    //       party: partyWithoutGst,
    //     };
    //   }
    //   return order;
    // });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log("✅ Order found:", order._id);
    console.log("File paths:", order.filePaths);
    console.log("Design files:", order.designFiles);

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("❌ Get order by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      isGst,
      size,
      rate,
      rateType,
      printerWastedSheet,
      binderWastedSheet,
      bookletBinderWastedSheet,
      isLamination,
      laminationType,
      printerPapers,
      binderPapers,
      bookletPapers,
      ...updateData
    } = req.body;

    if (typeof isGst !== "undefined") {
      updateData.isGst = isGst;
    }
    // console.log(req.body,"askjikaebf")
    if (
      req.body.status === "Delivery" &&
      req.body.deliveryStaff &&
      req.body.deliveryDate
      // req.body.deliveryTime
    ) {
      const orderget = await Order.findById(id);

      if (!orderget) {
        return res.status(404).json({
          success: false,
          message: "Order not found for assigning delivery task",
        });
      }

      const newAssignTask = new AssignTask({
        date: req.body.deliveryDate,
        time: req.body.deliveryTime || "",
        assignTo: req.body.deliveryStaff,
        companyName: orderget.companyName,
        partyName: orderget.party,
        reasonForVisit: "Delivery",
        remarks: req.body.remarks || "",
      });
      console.log("🚀 ~ newAssignTask:", newAssignTask);

      const dataassigntask = await newAssignTask.save();

      console.log("dataassigntask", dataassigntask);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Order ID",
      });
    }

    if (printerWastedSheet !== undefined) {
      if (isNaN(printerWastedSheet) || printerWastedSheet < 0) {
        return res.status(400).json({
          success: false,
          message: "Printer Wasted Sheet must be a non-negative number",
        });
      }
      updateData.printerWastedSheet = Number.parseInt(printerWastedSheet);
    }

    if (binderWastedSheet !== undefined) {
      if (isNaN(binderWastedSheet) || binderWastedSheet < 0) {
        return res.status(400).json({
          success: false,
          message: "Binder Wasted Sheet must be a non-negative number",
        });
      }
      updateData.binderWastedSheet = Number.parseInt(binderWastedSheet);
    }

    if (bookletBinderWastedSheet !== undefined) {
      if (isNaN(bookletBinderWastedSheet) || bookletBinderWastedSheet < 0) {
        return res.status(400).json({
          success: false,
          message: "Booklet Binder Wasted Sheet must be a non-negative number",
        });
      }
      updateData.bookletBinderWastedSheet = Number.parseInt(bookletBinderWastedSheet);
    }

    if (updateData.designerId) {
      if (!mongoose.Types.ObjectId.isValid(updateData.designerId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Designer ID",
        });
      }
      updateData.designer = updateData.designerId;
      delete updateData.designerId;
    }
     if (printerPapers) {
      if (!Array.isArray(printerPapers)) {
        return res.status(400).json({
          success: false,
          message: "Printer papers must be an array",
        });
      }
      updateData.printerPapers = printerPapers.map(paper => ({
        paperName: paper.paperName || `Paper-${Math.floor(Math.random() * 1000)}`,
        numberOfSheetsUsed: paper.numberOfSheetsUsed || "",
        sheetSize: paper.sheetSize || "",
        paperType: paper.paperType || "",
        gsm: paper.gsm || "",
        ratePerUnit: paper.ratePerUnit || ""
      }));
    }

    if (binderPapers) {
      if (!Array.isArray(binderPapers)) {
        return res.status(400).json({
          success: false,
          message: "Binder papers must be an array",
        });
      }
      updateData.binderPapers = binderPapers.map(paper => ({
        paperName: paper.paperName || `Binder-Paper-${Math.floor(Math.random() * 1000)}`,
        numberOfSheetsUsed: paper.numberOfSheetsUsed || "",
        sheetSize: paper.sheetSize || "",
        paperType: paper.paperType || "",
        gsm: paper.gsm || "",
        ratePerUnit: paper.ratePerUnit || ""
      }));
    }

    if (bookletPapers) {
      if (!Array.isArray(bookletPapers)) {
        return res.status(400).json({
          success: false,
          message: "Booklet papers must be an array",
        });
      }
      updateData.bookletPapers = bookletPapers.map(paper => ({
        paperName: paper.paperName || `Booklet-Paper-${Math.floor(Math.random() * 1000)}`,
        numberOfSheetsUsed: paper.numberOfSheetsUsed || "",
        sheetSize: paper.sheetSize || "",
        paperType: paper.paperType || "",
        gsm: paper.gsm || "",
        ratePerUnit: paper.ratePerUnit || ""
      }));
    }
    // Validate ObjectIds if they are being updated
    if (
      updateData.companyName &&
      !mongoose.Types.ObjectId.isValid(updateData.companyName)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Company ID",
      });
    }

    if (
      updateData.party &&
      !mongoose.Types.ObjectId.isValid(updateData.party)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Party ID",
      });
    }

    if (
      updateData.productItem &&
      !mongoose.Types.ObjectId.isValid(updateData.productItem)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product Item ID",
      });
    }

    // Convert qty to number if provided
    if (updateData.qty) {
      updateData.qty = Number.parseInt(updateData.qty);
    }

    // Validate rate and rateType if provided
    if (rate !== undefined) {
      if (isNaN(rate) || rate < 0) {
        return res.status(400).json({
          success: false,
          message: "Rate must be a non-negative number",
        });
      }
      updateData.rate = Number.parseFloat(rate);
    }

    if (rateType !== undefined) {
      if (!["old", "new"].includes(rateType)) {
        return res.status(400).json({
          success: false,
          message: "Rate type must be either 'old' or 'new'",
        });
      }
      updateData.rateType = rateType;
    }

    if (isLamination !== undefined) {
      if (typeof isLamination !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isLamination must be a boolean",
        });
      }
      updateData.isLamination = isLamination;
    }

    if (isLamination && laminationType) {
      if (!["Matte", "Gloss"].includes(laminationType)) {
        return res.status(400).json({
          success: false,
          message: "Lamination type must be either 'Matte' or 'Gloss' when lamination is selected",
        });
      }
      updateData.laminationType = laminationType;
    } else if (!isLamination) {
      updateData.laminationType = "";
    }

    if (size !== undefined) {
      updateData.size = size;
    }

    // Process file paths with remarks if provided
    if (updateData.filePaths) {
      try {
        if (typeof updateData.filePaths === "string") {
          const parsed = JSON.parse(updateData.filePaths);
          updateData.filePaths = Array.isArray(parsed)
            ? parsed.map((item) => ({
                path: typeof item === "string" ? item : item.path,
                remark: typeof item === "object" ? item.remark || "" : "",
                uploadedAt: new Date(),
              }))
            : [];
        } else if (Array.isArray(updateData.filePaths)) {
          updateData.filePaths = updateData.filePaths.map((item) => ({
            path: typeof item === "string" ? item : item.path,
            remark: typeof item === "object" ? item.remark || "" : "",
            uploadedAt: new Date(),
          }));
        }
      } catch (error) {
        console.error("Error processing file paths:", error);
      }
    }

    // Process design files with remarks if provided
    if (updateData.designFiles) {
      try {
        if (typeof updateData.designFiles === "string") {
          const parsed = JSON.parse(updateData.designFiles);
          updateData.designFiles = Array.isArray(parsed)
            ? parsed.map((item) => ({
                path: typeof item === "string" ? item : item.path,
                remark: typeof item === "object" ? item.remark || "" : "",
                uploadedAt: new Date(),
              }))
            : [];
        } else if (Array.isArray(updateData.designFiles)) {
          updateData.designFiles = updateData.designFiles.map((item) => ({
            path: typeof item === "string" ? item : item.path,
            remark: typeof item === "object" ? item.remark || "" : "",
            uploadedAt: new Date(),
          }));
        }
      } catch (error) {
        console.error("Error processing design files:", error);
      }
    }

    const order = await Order.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("companyName", "companyName")
      .populate("party", "partyName")
      .populate("productItem", "itemName")
      .populate("createdBy")
      .populate("designer", "firstName lastName");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log("✅ Order updated successfully:", order._id);

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: order,
    });
  } catch (error) {
    console.error("❌ Update order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order",
      error: error.message,
    });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("=== DELETE ORDER DEBUG ===");
    console.log("Order ID:", id);
    console.log("=========================");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Order ID",
      });
    }

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const remainingOrders = await Order.countDocuments();
    if (remainingOrders === 0) {
      // Reset the sequence if no orders remain
      await Sequence.findOneAndUpdate(
        { type: "global_order" },
        { lastSequence: 100 },
        { upsert: true }
      );
      console.log("✅ Sequence reset to 100 as no orders remain");
    }

    console.log("✅ Order deleted successfully:", order._id);

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
      data: { id: order._id },
    });
  } catch (error) {
    console.error("❌ Delete order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete order",
      error: error.message,
    });
  }
};

exports.getOrdersByCompanyAndParty = async (req, res) => {
  try {
    const { companyId, partyId } = req.params;

    console.log("=== GET ORDERS BY COMPANY AND PARTY DEBUG ===");
    console.log("Company ID:", companyId);
    console.log("Party ID:", partyId);
    console.log("============================================");

    if (
      !mongoose.Types.ObjectId.isValid(companyId) ||
      !mongoose.Types.ObjectId.isValid(partyId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Company ID or Party ID",
      });
    }

    const orders = await Order.find({
      companyName: companyId,
      party: partyId,
    })
      .populate("companyName", "companyName")
      .populate("party", "partyName")
      .populate("productItem", "itemName")
      .populate("createdBy")
      .populate("designer", "name")
      .sort({ createdAt: -1 });

    console.log(
      `📊 Found ${orders.length} orders for company-party combination`
    );

    res.status(200).json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    console.error("❌ Get orders by company and party error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

exports.getDesignerById = async (req, res) => {
  try {
    const { id } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Designer ID",
      });
    }

    const orders = await Order.find({ designer: id })
      .populate("companyName", "companyName")
      .populate("party", "partyName contactPerson personWhatsAppNo GSTNo")
      .populate("productItem", "itemName")
      .populate("createdBy")
      .populate("designer", "name")
      .populate("reworkHistory.createdBy", "name")
      .sort({ createdAt: -1 });

    // if (!orders || orders.length === 0) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "No orders found for this designer",
    //   });
    // }

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("❌ Get orders by designer error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch designer's orders",
      error: error.message,
    });
  }
};

exports.getPrinterById = async (req, res) => {
  try {
    const { id } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Printer ID",
      });
    }

    const orders = await Order.find({ printer: id })
      .populate("companyName", "companyName")
      .populate("party", "partyName contactPerson personWhatsAppNo GSTNo")
      .populate("productItem", "itemName")
      .populate("createdBy")
      .populate("designer", "name")
      .populate("printer", "name")
      .populate("reworkHistory.createdBy", "name")
      .sort({ createdAt: -1 });

    // if (!orders || orders.length === 0) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "No orders found for this printer",
    //   });
    // }

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("❌ Get orders by printer error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch printer's orders",
      error: error.message,
    });
  }
};

exports.getBinderById = async (req, res) => {
  try {
    const { id } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Binder ID",
      });
    }

    const orders = await Order.find({ binder: id })
      .populate("companyName", "companyName")
      .populate("party", "partyName contactPerson personWhatsAppNo GSTNo")
      .populate("productItem", "itemName")
      .populate("createdBy")
      .populate("designer", "name")
      .populate("printer", "name")
      .populate("binder", "name")
      .populate("bookletBinder", "name")
      .populate("reworkHistory.createdBy", "name")
      .sort({ createdAt: -1 });

    // if (!orders || orders.length === 0) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "No orders found for this binder",
    //   });
    // }

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("❌ Get orders by binder error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch binder's orders",
      error: error.message,
    });
  }
};

exports.getBookletBinderById = async (req, res) => {
  try {
    const { id } = req.user;
    console.log("bookletBinder", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Booklet Binder ID",
      });
    }

    const orders = await Order.find({ bookletBinder: id })
      .populate("companyName", "companyName")
      .populate("party", "partyName contactPerson personWhatsAppNo GSTNo")
      .populate("productItem", "itemName")
      .populate("createdBy")
      .populate("designer", "name")
      .populate("printer", "name")
      .populate("binder", "name")
      .populate("bookletBinder", "name")
      .populate("reworkHistory.createdBy", "name")
      .sort({ createdAt: -1 });

    console.log("orders", orders);

    // if (!orders || orders.length === 0) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "No orders found for this booklet binder",
    //   });
    // }

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("❌ Get orders by booklet binder error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booklet binder's orders",
      error: error.message,
    });
  }
};

exports.getOrdersByStaffId = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id, "id");
    // 1. Validate staffId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID format",
      });
    }

    // 2. Check if staff exists
    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    // 3. Fetch orders created by the staff member
    const orders = await Order.find({ createdBy: id })
      .populate({
        path: "companyName",
        select: "companyName",
      })
      .populate({
        path: "party",
        select:
          "partyName address contactPerson personMobileNo personWhatsAppNo GSTNo",
      })
      .populate({
        path: "productItem",
        select: "itemName",
      })
      .populate({
        path: "createdBy",
        select: "firstName lastName",
      })
      .populate({
        path: "designer",
        select: "name",
      })
      .populate({
        path: "printer",
        select: "name",
      })
      .populate({
        path: "binder",
        select: "name",
      })
      .populate({
        path: "bookletBinder",
        select: "name",
      })
      .populate({
        path: "reworkHistory.createdBy",
        select: "name",
      })
      .sort({ createdAt: -1 });

    // 4. If no orders found, return an empty array with a message
    if (!orders || orders.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No orders found for this staff member",
        count: 0,
        data: [],
      });
    }

    // 5. Return the orders
    res.status(200).json({
      success: true,
      message: "Orders retrieved successfully",
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching orders by staff ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// Add this to your order.controller.js
exports.updateStaffStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { statusType, status } = req.body; // statusType can be 'printer', 'binder', or 'bookletBinder'

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Order ID",
      });
    }

    // Validate status type and value
    const validStatusTypes = ["printer", "binder", "bookletBinder"];
    const validStatusValues = ["Pending", "In Progress", "Done"];

    if (!validStatusTypes.includes(statusType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status type",
      });
    }

    if (!validStatusValues.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    // Create update object based on status type
    const updateField = `${statusType}Status`;
    const updateData = { [updateField]: status };

    const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, {
      new: true,
    })
      .populate("companyName", "companyName")
      .populate("party", "partyName")
      .populate("productItem", "itemName");

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `${statusType} status updated successfully`,
      data: updatedOrder,
    });
  } catch (error) {
    console.error("❌ Update staff status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: error.message,
    });
  }
};
