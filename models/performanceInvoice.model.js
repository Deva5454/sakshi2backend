const mongoose = require("mongoose");

const performanceInvoiceSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true, // Keep unique if you want only one invoice per order
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    companyName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyName",
      required: true,
    },
    party: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Party",
      required: true,
    },
     assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    required: false,
  },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    color: {
      type: String,
      default: "",
    },
    size: {
      type: String,
      default: "",
    },
    pType: {
      type: String,
      default: "",
    },
    GSTNo: {
      type: String,
      default: "",
    },
    partyAddress: {
      unitNo: { type: String, default: "" },
      streetAddress: { type: String, default: "" },
      marketName: { type: String, default: "" },
      landMark: { type: String, default: "" },
      area: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },
    servicePerformance: {
      type: String,
      required: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    applyGST: {
      type: Boolean,
      default: false,
    },
    gstPercentage: { // NEW: GST Percentage
      type: Number,
      min: 0,
      default: 0,
    },
    finalAmount: {
      type: Number,
      default: 0,
    },
    daysAfterConfirmation: {
      type: Number,
      min: 0,
      default: undefined,
    },
    paymentTerms: {
      type: String,
      default: "",
    },
    signature: { // NEW: Signature URL
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const PerformanceInvoice = mongoose.model("PerformanceInvoice", performanceInvoiceSchema);
module.exports = PerformanceInvoice;