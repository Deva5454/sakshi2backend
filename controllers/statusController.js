const OrderStatus = require("../models/OrderStatus.model")

const mongoose = require("mongoose")

const STATUS_MODELS = {
  order: OrderStatus,
}

const getStatusModel = (type) => {
  const model = STATUS_MODELS[type.toLowerCase()]
  if (!model) {
    throw new Error(`Invalid status type: ${type}. Supported types: ${Object.keys(STATUS_MODELS).join(", ")}`)
  }
  return model
}

exports.createStatus = async (req, res) => {
  try {
    const { type } = req.params
    const { name, orderNumber, isDefault, isActive, color, description, createdBy } = req.body


    // Validate required fields
    if (!name || !orderNumber) {
      return res.status(400).json({
        success: false,
        message: "Name and Order Number are required",
      })
    }

    // Get appropriate model
    const StatusModel = getStatusModel(type)

    // Check if order number already exists
    const existingStatus = await StatusModel.findOne({ orderNumber })
    if (existingStatus) {
      return res.status(400).json({
        success: false,
        message: `Order number ${orderNumber} already exists for ${type} status`,
      })
    }

    // Create status data
    const statusData = {
      name: name.trim(),
      orderNumber: Number.parseInt(orderNumber),
      isDefault: Boolean(isDefault),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      color: color || "#6B7280",
      description: description || "",
      createdBy: req.user?.id,
      statusType: type.toLowerCase(),
    }

    console.log("Creating status with data:", statusData)

    const status = new StatusModel(statusData)
    await status.save()

    const populatedStatus = await StatusModel.findById(status._id).populate("createdBy", "name")

    console.log(`✅ ${type} status created successfully:`, populatedStatus._id)

    res.status(201).json({
      success: true,
      message: `${type} status created successfully`,
      data: populatedStatus,
    })
  } catch (error) {
    console.error(`❌ Create ${req.params.type} status error:`, error)
    res.status(500).json({
      success: false,
      message: `Failed to create ${req.params.type} status`,
      error: error.message,
    })
  }
}

// Get All Statuses
exports.getAllStatuses = async (req, res) => {
  try {
    const { type } = req.params
    const { page = 1, limit = 50, isActive, search } = req.query

    console.log(`=== GET ALL ${type.toUpperCase()} STATUSES DEBUG ===`)
    console.log("Type:", type)
    console.log("Query params:", req.query)
    console.log("==========================================")

    // Get appropriate model
    const StatusModel = getStatusModel(type)

    // Build filter
    const filter = {}

    if (isActive !== undefined) {
      filter.isActive = Boolean(isActive)
    }

    if (search) {
      filter.name = { $regex: search, $options: "i" }
    }

    // Calculate pagination
    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Get statuses
    const statuses = await StatusModel.find(filter)
      .populate("createdBy", "name")
      .sort({ orderNumber: 1 }) // Sort by order number
      .skip(skip)
      .limit(Number.parseInt(limit))

    // Get total count
    const totalCount = await StatusModel.countDocuments(filter)

    console.log(`📊 Found ${statuses.length} ${type} statuses out of ${totalCount} total`)

    res.status(200).json({
      success: true,
      data: statuses,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(totalCount / Number.parseInt(limit)),
        totalCount,
        hasNext: skip + statuses.length < totalCount,
        hasPrev: Number.parseInt(page) > 1,
      },
    })
  } catch (error) {
    console.error(`❌ Get all ${req.params.type} statuses error:`, error)
    res.status(500).json({
      success: false,
      message: `Failed to fetch ${req.params.type} statuses`,
      error: error.message,
    })
  }
}

// Get Status by ID
exports.getStatusById = async (req, res) => {
  try {
    const { type, id } = req.params

    console.log(`=== GET ${type.toUpperCase()} STATUS BY ID DEBUG ===`)
    console.log("Type:", type)
    console.log("Status ID:", id)
    console.log("==========================================")

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Status ID",
      })
    }

    // Get appropriate model
    const StatusModel = getStatusModel(type)

    const status = await StatusModel.findById(id).populate("createdBy", "name")

    if (!status) {
      return res.status(404).json({
        success: false,
        message: `${type} status not found`,
      })
    }

    console.log(`✅ ${type} status found:`, status._id)

    res.status(200).json({
      success: true,
      data: status,
    })
  } catch (error) {
    console.error(`❌ Get ${req.params.type} status by ID error:`, error)
    res.status(500).json({
      success: false,
      message: `Failed to fetch ${req.params.type} status`,
      error: error.message,
    })
  }
}

// Update Status
exports.updateStatus = async (req, res) => {
  try {
    const { type, id } = req.params
    const updateData = req.body

    console.log(`=== UPDATE ${type.toUpperCase()} STATUS DEBUG ===`)
    console.log("Type:", type)
    console.log("Status ID:", id)
    console.log("Update data:", updateData)
    console.log("========================================")

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Status ID",
      })
    }

    // Get appropriate model
    const StatusModel = getStatusModel(type)

    // Check if order number already exists (if being updated)
    if (updateData.orderNumber) {
      const existingStatus = await StatusModel.findOne({
        orderNumber: updateData.orderNumber,
        _id: { $ne: id },
      })
      if (existingStatus) {
        return res.status(400).json({
          success: false,
          message: `Order number ${updateData.orderNumber} already exists for ${type} status`,
        })
      }
      updateData.orderNumber = Number.parseInt(updateData.orderNumber)
    }

    // Convert boolean fields
    if (updateData.isDefault !== undefined) {
      updateData.isDefault = Boolean(updateData.isDefault)
    }
    if (updateData.isActive !== undefined) {
      updateData.isActive = Boolean(updateData.isActive)
    }

    const status = await StatusModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "name")

    if (!status) {
      return res.status(404).json({
        success: false,
        message: `${type} status not found`,
      })
    }

    console.log(`✅ ${type} status updated successfully:`, status._id)

    res.status(200).json({
      success: true,
      message: `${type} status updated successfully`,
      data: status,
    })
  } catch (error) {
    console.error(`❌ Update ${req.params.type} status error:`, error)
    res.status(500).json({
      success: false,
      message: `Failed to update ${req.params.type} status`,
      error: error.message,
    })
  }
}

// Delete Status
exports.deleteStatus = async (req, res) => {
  try {
    const { type, id } = req.params

    console.log(`=== DELETE ${type.toUpperCase()} STATUS DEBUG ===`)
    console.log("Type:", type)
    console.log("Status ID:", id)
    console.log("========================================")

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Status ID",
      })
    }

    // Get appropriate model
    const StatusModel = getStatusModel(type)

    const status = await StatusModel.findById(id)

    if (!status) {
      return res.status(404).json({
        success: false,
        message: `${type} status not found`,
      })
    }

    // Check if it's default status
    if (status.isDefault) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete default ${type} status`,
      })
    }

    await StatusModel.findByIdAndDelete(id)

    console.log(`✅ ${type} status deleted successfully:`, status._id)

    res.status(200).json({
      success: true,
      message: `${type} status deleted successfully`,
      data: { id: status._id },
    })
  } catch (error) {
    console.error(`❌ Delete ${req.params.type} status error:`, error)
    res.status(500).json({
      success: false,
      message: `Failed to delete ${req.params.type} status`,
      error: error.message,
    })
  }
}

// Get Default Status
exports.getDefaultStatus = async (req, res) => {
  try {
    const { type } = req.params

    console.log(`=== GET DEFAULT ${type.toUpperCase()} STATUS DEBUG ===`)
    console.log("Type:", type)
    console.log("==========================================")

    // Get appropriate model
    const StatusModel = getStatusModel(type)

    const defaultStatus = await StatusModel.findOne({ isDefault: true, isActive: true }).populate("createdBy", "name")

    if (!defaultStatus) {
      return res.status(404).json({
        success: false,
        message: `No default ${type} status found`,
      })
    }

    console.log(`✅ Default ${type} status found:`, defaultStatus._id)

    res.status(200).json({
      success: true,
      data: defaultStatus,
    })
  } catch (error) {
    console.error(`❌ Get default ${req.params.type} status error:`, error)
    res.status(500).json({
      success: false,
      message: `Failed to fetch default ${req.params.type} status`,
      error: error.message,
    })
  }
}

// Reorder Statuses
exports.reorderStatuses = async (req, res) => {
  try {
    const { type } = req.params
    const { statusIds } = req.body // Array of status IDs in new order

    console.log(`=== REORDER ${type.toUpperCase()} STATUSES DEBUG ===`)
    console.log("Type:", type)
    console.log("Status IDs:", statusIds)
    console.log("==========================================")

    if (!Array.isArray(statusIds) || statusIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Status IDs array is required",
      })
    }

    // Get appropriate model
    const StatusModel = getStatusModel(type)

    // Update order numbers
    const updatePromises = statusIds.map((statusId, index) => {
      return StatusModel.findByIdAndUpdate(statusId, { orderNumber: index + 1 })
    })

    await Promise.all(updatePromises)

    // Get updated statuses
    const updatedStatuses = await StatusModel.find({ _id: { $in: statusIds } })
      .populate("createdBy", "name")
      .sort({ orderNumber: 1 })

    console.log(`✅ ${type} statuses reordered successfully`)

    res.status(200).json({
      success: true,
      message: `${type} statuses reordered successfully`,
      data: updatedStatuses,
    })
  } catch (error) {
    console.error(`❌ Reorder ${req.params.type} statuses error:`, error)
    res.status(500).json({
      success: false,
      message: `Failed to reorder ${req.params.type} statuses`,
      error: error.message,
    })
  }
}
