
const mongoose = require("mongoose")

const baseStatusSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    orderNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    color: {
      type: String,
      default: "#6B7280", 
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// Index for better performance
baseStatusSchema.index({ orderNumber: 1 })
baseStatusSchema.index({ isActive: 1 })
baseStatusSchema.index({ isDefault: 1 })

module.exports = baseStatusSchema
