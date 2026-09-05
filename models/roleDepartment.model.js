  const mongoose = require("mongoose");
  const CompanyName = require("./companyName.model");

  const roleDepartmentSchema = new mongoose.Schema({
    CompanyName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyName",
      required: true,
    },
    roleDepartment: {
      type: String,
      required: true,
    },
  })
  const roleDepartment = mongoose.model("RoleDepartment", roleDepartmentSchema);
  module.exports = roleDepartment;