const mongoose = require("mongoose");

const assignTaskSchema = new mongoose.Schema({
  companyName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CompanyName",
    required: true
  },
  partyName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Party",
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: String,
  reasonForVisit: {
    type: String,
    required: true
  },
  remarks: String,
  assignTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    required: true
  },
  status: {
    type: String,
    enum: ["Pending", "Rescheduled", "Completed", "Cancelled"],
    default: "Pending"
  },
  visitDate: Date,
  visitTime: String,
  feedback: String,
  rescheduleDate: Date,
  isRescheduledTask: {
    type: Boolean,
    default: false
  },
  originalTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AssignTask"
  },
  
}, { timestamps: true });

module.exports = mongoose.model("AssignTask", assignTaskSchema);