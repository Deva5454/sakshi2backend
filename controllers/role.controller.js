// role.controller.js
const Role = require("../models/role.model");
const Staff = require("../models/staff.model");

// Helper function to process permissions
const processPermissions = (permissions) => {
  const validatedPermissions = {
    Admin: {
      "View ( Own )": false,
      "View ( Global )": false,
      Create: false,
      Edit: false,
      Delete: false,
    },
    Staff: {
      "View ( Own )": false,
      "View ( Global )": false,
      Create: false,
      Edit: false,
      Delete: false,
    },
    Designer: {
      "View ( Own )": false,
      "View ( Global )": false,
      Create: false,
      Edit: false,
      Delete: false,
    },
    Printer: {
      "View ( Own )": false,
      "View ( Global )": false,
      Create: false,
      Edit: false,
      Delete: false,
    },
    Binder: {
      "View ( Own )": false,
      "View ( Global )": false,
      Create: false,
      Edit: false,
      Delete: false,
    },
    "Booklet & Folder Binder": {
      "View ( Own )": false,
      "View ( Global )": false,
      Create: false,
      Edit: false,
      Delete: false,
    },
    Delivery: {
      "View ( Own )": false,
      "View ( Global )": false,
      Create: false,
      Edit: false,
      Delete: false,
    },
  };

  // Update permissions with user-provided values
  for (const [module, perms] of Object.entries(permissions || {})) {
    if (validatedPermissions[module]) {
      for (const [perm, value] of Object.entries(perms)) {
        if (perm in validatedPermissions[module]) {
          validatedPermissions[module][perm] = Boolean(value);
        }
      }
    }
  }

  return validatedPermissions;
};

// CREATE role
exports.createRole = async (req, res) => {
  const { roleName, permissions } = req.body;

  try {
    // Validate roleName
    if (!roleName || typeof roleName !== "string" || roleName.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Role name is required and must be a non-empty string",
      });
    }

    const existingRole = await Role.findOne({ roleName });
    if (existingRole) {
      return res.status(406).json({
        success: false,
        message: `${roleName} role already exists`,
      });
    }

    // Process permissions
    // const processedPermissions = processPermissions(permissions);

    const newRole = new Role({
      roleName,
      permissions: permissions,
      isDelete: false,
      totalUser: 0,
    });

    await newRole.save();

    res.status(200).json({
      success: true,
      message: "Role created successfully",
      data: newRole,
    });
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error creating role",
    });
  }
};

// GET all roles
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find({ isDelete: false }).select(
      "-__v -updatedAt"
    );

    res.status(200).json({
      success: true,
      message: "Roles retrieved successfully",
      data: roles,
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error fetching roles",
    });
  }
};

// GET role by ID
exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findOne({
      _id: req.params.id,
      isDelete: false,
    }).select("-__v -updatedAt");

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Role retrieved successfully",
      data: role,
    });
  } catch (error) {
    console.error("Error fetching role:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error fetching role",
    });
  }
};

// UPDATE role by ID
exports.updateRoleById = async (req, res) => {
  const { roleName, permissions } = req.body;

  try {
    const role = await Role.findOne({
      _id: req.params.id,
      isDelete: false,
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Validate roleName if provided
    if (roleName && roleName !== role.roleName) {
      if (typeof roleName !== "string" || roleName.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Role name must be a non-empty string",
        });
      }

      const existingRole = await Role.findOne({
        roleName,
        isDelete: false,
      });
      if (existingRole && existingRole._id.toString() !== req.params.id) {
        return res.status(406).json({
          success: false,
          message: `${roleName} role already exists`,
        });
      }
    }

    // Update fields
    role.roleName = roleName || role.roleName;
    if (permissions) {
      role.permissions = permissions; // Directly use permissions without processing
    }
    role.updatedAt = Date.now();

    await role.save();

    // Fetch the updated role with all fields
    const updatedRole = await Role.findById(role._id).select("-__v -updatedAt");

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: updatedRole,  
    });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error updating role",
    });
  }
};


exports.deleteRoleById = async (req, res) => {
  try {
    // Check if role is assigned to any staff
    const staffWithRole = await Staff.findOne({ role: req.params.id });
    if (staffWithRole) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete role that is assigned to staff",
      });
    }

    // Permanently delete the role
    const deletedRole = await Role.findByIdAndDelete(req.params.id);

    if (!deletedRole) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Role deleted permanently",
    });
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error deleting role",
    });
  }
};
