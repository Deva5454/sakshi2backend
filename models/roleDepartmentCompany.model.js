const mongoose = require("mongoose");
const roleDepartment = require("./roleDepartment.model");

const roleDepartmentCompanySchema = new mongoose.Schema({
    roleDepartment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RoleDepartment",
        required: true,
    },
    roleDepartmentCompanyName: {
        type: String,
        required: true,
    },
})
const roleDepartmentCompany = mongoose.model("RoleDepartmentCompany", roleDepartmentCompanySchema);
module.exports = roleDepartmentCompany;