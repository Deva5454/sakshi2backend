const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    mobileNo: { type: String, required: true },
    whatsappNo: { type: String, required: true },
    address: { type: String, required: true },
    aadharNo: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      match: /^[0-9]{12}$/,
    },
    joiningDate: { type: Date, required: true },
    birthDay: { type: Date },
    password: { type: String, required: true },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    CompanyName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyName",
      required: true,
    },
    status: { type: Boolean, default: true },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    aadharFiles: {
      type: [{ type: String }], // Array of strings
      // required: false, // Made required
      // validate: {
      //   validator: function (v) {
      //     return v && v.length > 0; // Ensure at least one file
      //   },
      //   message: "At least one Aadhar file is required",
      // },
    }, // New field for Aadhar files
    addressFiles: [{ type: String }], // New field for Address files
  },
  { timestamps: true }
);

const Staff = mongoose.model("Staff", staffSchema);
module.exports = Staff;
