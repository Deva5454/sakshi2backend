const mongoose = require("mongoose");
const  permissionSchema  = require("./permission.model");

const roleSchema = new mongoose.Schema({
  roleName: { type: String },
  isDelete: { type: Boolean, default: false },
  totalUser: { type: Number, default: 0 },
  permissions: permissionSchema
});

const Role = mongoose.model("Role", roleSchema);
module.exports = Role;
