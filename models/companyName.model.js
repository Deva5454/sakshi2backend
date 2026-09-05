const mongoose = require("mongoose");

const companyNameSchema = new mongoose.Schema({
  companyName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    
}, {
    timestamps: true,
  },)
const CompanyName = mongoose.model("CompanyName", companyNameSchema);
module.exports = CompanyName;