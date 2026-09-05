// models/AccountMaster.js
const mongoose = require("mongoose");

const accountMasterSchema = new mongoose.Schema({
  companyName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CompanyName",
    required: true,
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Party",
    required: false
  },
  reasonToVisit: {
    type: String,
    // enum: ["Visit", "Order", "Reference"],
    required: false,
  },
   reference: {
    type: String,
    required: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    required: true,
  },
}, { timestamps: true });

const AccountMaster = mongoose.model("AccountMaster", accountMasterSchema);
module.exports = AccountMaster;