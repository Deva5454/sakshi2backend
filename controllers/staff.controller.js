const Staff = require("../models/staff.model");
const jwt = require("jsonwebtoken");
const Role = require("../models/role.model");
const Order = require("../models/order.model");
const mongoose = require("mongoose");
const CompanyName = require("../models/companyName.model");
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");
var CryptoJS = require("crypto-js");

const SECRET_KEY = process.env.CRYPTO_SECRET || "your-secret-key";
// Encrypt function
 const encryptData = (text) => {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

// Decrypt function
 const decryptData = (ciphertext) => {
  var bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  var originalText = bytes.toString(CryptoJS.enc.Utf8);
  console.log(originalText, 'originalText')
  return originalText;
};

// Compare function (like bcrypt.compare)
 const compareData = (plainText, cipherText) => {
  const decrypted = decryptData(cipherText);
  return decrypted === plainText;
};

// Create a new Staff
exports.createStaff = async (req, res) => {
  try {
    const requiredFields = [
      "firstName",
      "lastName",
      "mobileNo",
      "whatsappNo",
      "address", // Added as required
      "aadharNo", // Added as required
      "joiningDate",
      "password",
      "role",
      "companyName",
      "aadharFiles", // Added as required
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`,
        });
      }
    }
    // Normalize email to lowercase if provided
    if (req.body.email) {
      req.body.email = req.body.email.toLowerCase();
      const existingEmail = await Staff.findOne({ email: req.body.email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
    }
    // Check if email already exists (only if provided)
    if (req.body.email) {
      const existingEmail = await Staff.findOne({ email: req.body.email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
    }

    // Validate aadharNo
    const aadharRegex = /^[0-9]{12}$/;
    if (!aadharRegex.test(req.body.aadharNo)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Aadhar number format. Must be 12 digits.",
      });
    }

    // Check if Aadhar number already exists
    const existingAadhar = await Staff.findOne({ aadharNo: req.body.aadharNo });
    if (existingAadhar) {
      return res.status(400).json({
        success: false,
        message: "Aadhar number already in use",
      });
    }

    // Validate aadharFiles (ensure at least one file)
    if (
      !req.body.aadharFiles ||
      !Array.isArray(req.body.aadharFiles) ||
      req.body.aadharFiles.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one Aadhar file is required",
      });
    }

    const roleId = req.body.role;
    const roleExists = await Role.findById(roleId);
    if (!roleExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid role ID. No matching role found.",
      });
    }
    const companyId = req.body.companyName;
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID format.",
      });
    }
    const companyExists = await CompanyName.findById(companyId);
    if (!companyExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID. No matching company found.",
      });
    }
    const hashedPassword = encryptData(req.body.password)

    const staffData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email || undefined, // Optional
      mobileNo: req.body.mobileNo,
      whatsappNo: req.body.whatsappNo,
      address: req.body.address,
      aadharNo: req.body.aadharNo,
      joiningDate: new Date(req.body.joiningDate),
      birthDay: req.body.birthDay ? new Date(req.body.birthDay) : null,
      CompanyName: companyId,
      password: hashedPassword,
      role: roleId,
      aadharFiles: req.body.aadharFiles, // Required
      addressFiles: req.body.addressFiles || [], // Optional
    };

    const newStaff = new Staff(staffData);
    await newStaff.save();

    // Populate role for the response
    const populatedStaff = await Staff.findById(newStaff._id)
      .populate("role")
      .populate("CompanyName")
      .select("-password");

    await updateAllRoleUserCounts();
    res.status(201).json({
      success: true,
      message: "Staff member created successfully",
      data: populatedStaff,
    });
  } catch (error) {
    console.error("Error creating staff:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create staff member",
      error: error.message,
    });
  }
};

// Get all Staff
exports.getStaff = async (req, res) => {
  try {
    const staff = await Staff.find()
      .populate("role")
      .populate("CompanyName")
      .select("-password");
    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a single Staff by ID
exports.getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id)
      .populate("role")
      .populate("CompanyName")
      // .select("-password");

    if (staff) {
      res.status(200).json({
        success: true,
        data: staff,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update a Staff by ID
exports.updateStaff = async (req, res) => {
  try {
    // Check if email is being updated and if it already exists
    if (req.body.email) {
      const existingStaff = await Staff.findOne({
        email: req.body.email,
        _id: { $ne: req.params.id },
      });
      if (existingStaff) {
        return res.status(400).json({
          success: false,
          message: "Email already in use by another staff member",
        });
      }
    }

    // Validate aadharNo if provided
    if (req.body.aadharNo) {
      const existingAadhar = await Staff.findOne({
        aadharNo: req.body.aadharNo,
        _id: { $ne: req.params.id },
      });
      if (existingAadhar) {
        return res.status(400).json({
          success: false,
          message: "Aadhar number already in use",
        });
      }

      const aadharRegex = /^[0-9]{12}$/;
      if (!aadharRegex.test(req.body.aadharNo)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Aadhar number format. Must be 12 digits.",
        });
      }
    }

    // Validate aadharFiles if provided (ensure at least one file if updating)
    if (
      req.body.aadharFiles &&
      (!Array.isArray(req.body.aadharFiles) ||
        req.body.aadharFiles.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one Aadhar file is required",
      });
    }

    // Validate role if provided
    if (req.body.role) {
      const roleExists = await Role.findById(req.body.role);
      if (!roleExists) {
        return res.status(400).json({
          success: false,
          message: "Invalid role ID. No matching role found.",
        });
      }
    }

    // Hash password if provided
    if (req.body.password) {
      req.body.password = encryptData(req.body.password);
    }

    // Convert date fields if provided
    if (req.body.joiningDate) {
      req.body.joiningDate = new Date(req.body.joiningDate);
    }
    if (req.body.birthDay) {
      req.body.birthDay = new Date(req.body.birthDay);
    }

    // Prepare update object, including new file fields
    const updateFields = {
      ...req.body,
      email: req.body.email || undefined, // Optional
      aadharNo: req.body.aadharNo || undefined, // Required, but can be unchanged
      aadharFiles: req.body.aadharFiles || undefined, // Required, but can be unchanged
      addressFiles: req.body.addressFiles || undefined, // Optional
    };

    const updatedStaff = await Staff.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate("role")
      .populate("CompanyName")
      .select("-password");
    if (updatedStaff) {
      await updateAllRoleUserCounts();
      res.status(200).json({
        success: true,
        message: "Staff member updated successfully",
        data: updatedStaff,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }
  } catch (error) {
    console.error("Error updating staff:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update staff member",
      error: error.message,
    });
  }
};
// Update Staff Status
exports.updateStaffStatus = async (req, res) => {
  try {
    const updatedStaff = await Staff.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    )
      .populate("role")
      .select("-password");

    if (updatedStaff) {
      res.status(200).json({
        success: true,
        message: "Staff status updated successfully",
        data: updatedStaff,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }
  } catch (error) {
    console.error("Error updating staff status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update staff status",
      error: error.message,
    });
  }
};

// Delete a Staff by ID
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (staff) {
      await updateAllRoleUserCounts();
      res.status(200).json({
        success: true,
        message: "Staff deleted successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Login Staff
exports.loginStaff = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find staff by email and populate role
    const staff = await Staff.findOne({ email }).populate("role");
    if (!staff) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if account is active
    if (!staff.status) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    // Verify password
    const isMatch = compareData(password, staff.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: staff._id, role: staff.role.roleName, roleData: staff.role },
      process.env.JWT_SECRET || "your_jwt_secret_key" // Replace with environment variable in production
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: staff._id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        role: staff.role,
        token,
      },
    });
  } catch (error) {
    console.error("Error logging in staff:", error);
    res.status(500).json({
      success: false,
      message: "Failed to login",
      error: error.message,
    });
  }
};

exports.getrol = async (req, res) => {
  try {
    const { roleName } = req.body;

    if (!roleName) {
      return res.status(400).json({
        success: false,
        message: "Role name is required in the request body",
      });
    }

    // Find the role by name
    const role = await Role.findOne({ roleName: roleName });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    const staffMembers = await Staff.find({ role: role._id })
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .populate("role");

    res.status(200).json({
      success: true,
      role: role,
      staffMembers: staffMembers,
      totalStaff: staffMembers.length,
    });
  } catch (error) {
    console.error("Error in getrol:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

async function updateAllRoleUserCounts() {
  try {
    // 1. Group staff by role and count users per role
    const roleCounts = await Staff.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);
    // 2. Prepare updates for roles that have users
    const updates = roleCounts.map(({ _id, count }) =>
      Role.findByIdAndUpdate(_id, { totalUser: count })
    );
    // 3. Handle roles with zero staff
    const allRoleIds = (await Role.find({}, "_id")).map((r) =>
      r._id.toString()
    );
    const countedRoleIds = roleCounts.map((r) => r._id.toString());
    const zeroUserRoleIds = allRoleIds.filter(
      (id) => !countedRoleIds.includes(id)
    );
    zeroUserRoleIds.forEach((roleId) => {
      updates.push(Role.findByIdAndUpdate(roleId, { totalUser: 0 }));
    });
    // 4. Execute all updates
    await Promise.all(updates);
    console.log("All role user counts updated successfully.");
  } catch (error) {
    console.error("Error updating role user counts:", error);
  }
}
// Function to normalize Aadhar number
const normalizeAadharNo = (aadharNo) => {
  if (!aadharNo) return null;
  // Convert scientific notation or number to string
  const normalized = Number(aadharNo).toFixed(0);
  return normalized.length === 12 && /^[0-9]{12}$/.test(normalized)
    ? normalized
    : null;
};

// Function to normalize date from DD-MM-YYYY or YYYY-MM-DD to YYYY-MM-DD
const normalizeDate = (dateStr) => {
  if (!dateStr) return null;
  // Handle DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split("-");
    const normalized = `${year}-${month}-${day}`;
    return /^\d{4}-\d{2}-\d{2}$/.test(normalized) &&
      !isNaN(new Date(normalized).getTime())
      ? normalized
      : null;
  }
  // Handle YYYY-MM-DD
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(dateStr) &&
    !isNaN(new Date(dateStr).getTime())
  ) {
    return dateStr;
  }
  return null;
};

exports.bulkCreateStaff = async (req, res) => {
  try {
    const { role, companyName } = req.body;
    const { file } = req.files || {};

    // Validate inputs
    if (!req.files || !file || !file[0] || !file[0].buffer) {
      return res.status(400).json({
        success: false,
        message: "No valid CSV file uploaded. Please upload a valid CSV file.",
      });
    }

    if (!role || !companyName) {
      return res.status(400).json({
        success: false,
        message: "Role and CompanyName are required.",
      });
    }

    // Validate role and company IDs
    if (!mongoose.Types.ObjectId.isValid(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role ID.",
      });
    }
    const roleExists = await Role.findById(role);
    if (!roleExists) {
      return res.status(400).json({
        success: false,
        message: `Role not found for ID ${role}.`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(companyName)) {
      return res.status(400).json({
        success: false,
        message: "Invalid companyName ID.",
      });
    }
    const companyExists = await CompanyName.findById(companyName);
    if (!companyExists) {
      return res.status(400).json({
        success: false,
        message: `Company not found for ID ${companyName}.`,
      });
    }

    // Ensure upload directory exists
    const uploadDir = path.join(__dirname, "../Uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Process CSV
    const csvFilePath = path.join(
      uploadDir,
      `csv-${Date.now()}-${Math.round(Math.random() * 1e9)}.csv`
    );
    fs.writeFileSync(csvFilePath, file[0].buffer);
    console.log(`Saved CSV file: ${csvFilePath}`);

    if (!fs.existsSync(csvFilePath)) {
      return res.status(400).json({
        success: false,
        message: `CSV file not found at path: ${csvFilePath}.`,
      });
    }

    const results = [];
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("error", (error) => {
        console.error("CSV parsing error:", error);
        fs.unlinkSync(csvFilePath);
        return res.status(400).json({
          success: false,
          message:
            "Failed to parse CSV file. Ensure it has the correct headers and format.",
        });
      })
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          const staffMembers = [];
          const aadharRegex = /^[0-9]{12}$/;
          const mobileRegex = /^[0-9]{10}$/;
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

          for (const row of results) {
            const {
              firstName,
              lastName,
              email,
              mobileNo,
              whatsappNo,
              address,
              aadharNo,
              joiningDate,
              birthDay,
              password,
            } = row;

            // Required fields validation
            const requiredFields = [
              "firstName",
              "lastName",
              "mobileNo",
              "whatsappNo",
              "address",
              "aadharNo",
              "joiningDate",
              "password",
            ];
            for (const field of requiredFields) {
              if (!row[field]) {
                fs.unlinkSync(csvFilePath);
                return res.status(400).json({
                  success: false,
                  message: `Missing required field '${field}' in row: ${JSON.stringify(
                    row
                  )}.`,
                });
              }
            }

            // Validate formats
            if (!mobileRegex.test(mobileNo)) {
              fs.unlinkSync(csvFilePath);
              return res.status(400).json({
                success: false,
                message: `Invalid mobileNo (must be 10 digits) in row: ${JSON.stringify(
                  row
                )}.`,
              });
            }

            if (!mobileRegex.test(whatsappNo)) {
              fs.unlinkSync(csvFilePath);
              return res.status(400).json({
                success: false,
                message: `Invalid whatsappNo (must be 10 digits) in row: ${JSON.stringify(
                  row
                )}.`,
              });
            }

            // Normalize and validate Aadhar number
            const normalizedAadhar = normalizeAadharNo(aadharNo);
            if (!normalizedAadhar || !aadharRegex.test(normalizedAadhar)) {
              fs.unlinkSync(csvFilePath);
              return res.status(400).json({
                success: false,
                message: `Invalid aadharNo (must be exactly 12 digits, no scientific notation) in row: ${JSON.stringify(
                  row
                )}. Ensure Aadhar number is formatted correctly in the CSV.`,
              });
            }

            if (email && !emailRegex.test(email)) {
              fs.unlinkSync(csvFilePath);
              return res.status(400).json({
                success: false,
                message: `Invalid email in row: ${JSON.stringify(row)}.`,
              });
            }

            // Normalize and validate dates
            const normalizedJoiningDate = normalizeDate(joiningDate);
            if (!normalizedJoiningDate) {
              fs.unlinkSync(csvFilePath);
              return res.status(400).json({
                success: false,
                message: `Invalid joiningDate (must be YYYY-MM-DD or DD-MM-YYYY) in row: ${JSON.stringify(
                  row
                )}.`,
              });
            }

            const normalizedBirthDay = birthDay
              ? normalizeDate(birthDay)
              : null;
            if (birthDay && !normalizedBirthDay) {
              fs.unlinkSync(csvFilePath);
              return res.status(400).json({
                success: false,
                message: `Invalid birthDay (must be YYYY-MM-DD or DD-MM-YYYY) in row: ${JSON.stringify(
                  row
                )}.`,
              });
            }

            // Check uniqueness
            if (email) {
              const existingEmail = await Staff.findOne({ email });
              if (existingEmail) {
                fs.unlinkSync(csvFilePath);
                return res.status(400).json({
                  success: false,
                  message: `Email already exists: ${email} in row: ${JSON.stringify(
                    row
                  )}.`,
                });
              }
            }

            const existingAadhar = await Staff.findOne({
              aadharNo: normalizedAadhar,
            });
            if (existingAadhar) {
              fs.unlinkSync(csvFilePath);
              return res.status(400).json({
                success: false,
                message: `Aadhar number already exists: ${normalizedAadhar} in row: ${JSON.stringify(
                  row
                )}.`,
              });
            }

            // Hash password
            const hashedPassword = encryptData(password);

            staffMembers.push({
              firstName,
              lastName,
              email: email || undefined,
              mobileNo,
              whatsappNo,
              address,
              aadharNo: normalizedAadhar,
              joiningDate: new Date(normalizedJoiningDate),
              birthDay: normalizedBirthDay
                ? new Date(normalizedBirthDay)
                : undefined,
              role,
              CompanyName: companyName,
              password: hashedPassword,
              aadharFiles: [],
              addressFiles: [],
            });
          }

          const savedStaff = await Staff.insertMany(staffMembers);

          // Update role counts
          await updateAllRoleUserCounts();

          // Clean up CSV file
          fs.unlinkSync(csvFilePath);

          // Populate for response
          const populatedStaff = await Staff.find({
            _id: { $in: savedStaff.map((s) => s._id) },
          })
            .populate("role")
            .populate("CompanyName")
            .select("-password");

          res.status(201).json({
            success: true,
            message: "Bulk staff creation completed",
            count: savedStaff.length,
            data: populatedStaff,
          });
        } catch (error) {
          console.error("Bulk create error:", error);
          fs.unlinkSync(csvFilePath);
          res.status(500).json({
            success: false,
            message:
              error.message ||
              "Failed to create staff in bulk. Please check the CSV file and try again.",
          });
        }
      });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({
      success: false,
      message:
        error.message || "Server error during bulk upload. Please try again.",
    });
  }
};

exports.updateStaffPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const staffId = req.params.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    // Verify current password
    const isMatch = compareData(currentPassword, staff.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedPassword = encryptData(newPassword);

    // Update password
    staff.password = hashedPassword;
    await staff.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update password",
      error: error.message,
    });
  }
};

exports.getStaffPermission = async (req, res) => {
  try {
    const { id } = req.params;

    // Check for required fields
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }

    // Find staff by ID and populate role
    const staff = await Staff.findById(id).populate("role");
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    // Return only role and permissions
    res.status(200).json({
      success: true,
      message: "Staff role permissions fetched successfully",
      data: staff.role?.permissions,
    });
  } catch (error) {
    console.error("Error fetching staff permissions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch staff permissions",
      error: error.message,
    });
  }
};
