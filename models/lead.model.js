const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema({
  companyName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CompanyName",
    required: true,
  },
  partyName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Party",
    required: true,
  },
  reason: {
    type: String,
    enum: ["Cold Call","Inquiry Call", "Confirmation Call", "Other"],
    required: true
  },
  customReason: {
    type: String,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled", "rescheduled"],
    default: "pending"
  },
  date: {
    type: Date,
  },
  time: {
    type: String,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format (24-hour)
  },
  callFeedback: {
    type: String,
    default: "",
  },
  rescheduleDate: {
    type: Date,
  },
  isRescheduledCall: {
    type: Boolean,
    default: false
  },
  originalLeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead"
  }
}, { timestamps: true });

// Pre-save hook to handle custom reason
leadSchema.pre('save', function (next) {
  if (this.reason === 'Other' && !this.customReason) {
    throw new Error('Custom reason is required when reason is "Other"');
  }
  next();
});

const Lead = mongoose.model("Lead", leadSchema);
module.exports = Lead;