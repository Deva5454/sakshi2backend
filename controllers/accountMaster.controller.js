const mongoose = require("mongoose");
const AccountMaster = require("../models/accountMaster.model");
const Lead = require("../models/lead.model");
const xlsx = require("xlsx"); 
const AssignTask = require("../models/assignTask.model");
const Order = require("../models/order.model");
const Staff = require("../models/staff.model");
const Party = require("../models/Party.model");
const CompanyName = require("../models/companyName.model");

// Create a new Account Master
exports.createAccountMaster = async (req, res) => {
  // console.log("🚀 ~ req.body.GSTNo:", req.body.GSTNo)
  try {
    const partyRequiredFields = [
      "partyName",
      // "ownerName",
      // "ownerMobileNo",
      "ownerWhatsAppNo",
      // "contactPerson",
      // "personMobileNo",
      // "personWhatsAppNo",
      // "contactForPayment",
      // "contactMobileNo",
      // "contactWhatsAppNo",
      // "GSTNo",
      "address"
    ];

    for (const field of partyRequiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `Missing required party field: ${field}`,
        });
      }
    }

    const requiredAddressFields = ["unitNo", "marketName", "streetAddress", "area", "pincode"];
    for (const field of requiredAddressFields) {
      if (!req.body.address[field]) {
        return res.status(400).json({
          success: false,
          message: `Missing required address field: ${field}`,
        });
      }
    }

    const pincodeRegex = /^[0-9]{6}$/;
    if (!pincodeRegex.test(req.body.address.pincode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pincode format. Must be 6 digits.",
      });
    }

    if (!req.body.companyName || !req.body.reasonToVisit || !req.body.createdBy) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: companyName, reasonToVisit, or createdBy",
      });
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (req.body.ownerEmail && !emailRegex.test(req.body.ownerEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid owner email format",
      });
    }
    if (req.body.contactPersonEmail && !emailRegex.test(req.body.contactPersonEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact person email format",
      });
    }
    if (req.body.contactForPaymentEmail && !emailRegex.test(req.body.contactForPaymentEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact for payment email format",
      });
    }

    if (!req.body.companyName || !req.body.reasonToVisit || !req.body.createdBy) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: companyName, reasonToVisit, or createdBy",
      });
    }

    const staff = await Staff.findById(req.body.createdBy);
    if (!staff) {
      return res.status(400).json({
        success: false,
        message: "Invalid createdBy ID. Staff member does not exist.",
      });
    }

    const company = await CompanyName.findById(req.body.companyName);
    if (!company) {
      return res.status(400).json({
        success: false,
        message: "Invalid companyName ID. Company does not exist.",
      });
    }

    const existingParty = await Party.findOne({
      $and: [
      { companyName: req.body.companyName },
        { partyName: req.body.partyName },
        { ownerWhatsAppNo: req.body.ownerWhatsAppNo }
      ]
    });

     if (existingParty) {
      return res.status(400).json({
        success: false,
        message: "A party with this company, name and mobile number already exists",

      });
    }

    // Create the Party with statusApproval based on isRequestMode
    const partyData = {
      companyName: req.body.companyName,
      partyName: req.body.partyName,
      ownerName: req.body.ownerName,
      ownerMobileNo: req.body.ownerMobileNo,
      ownerWhatsAppNo: req.body.ownerWhatsAppNo,
      ownerEmail: req.body.ownerEmail || null,
      contactPerson: req.body.contactPerson,
      personMobileNo: req.body.personMobileNo,
      contactPersonEmail: req.body.contactPersonEmail || null,
      personWhatsAppNo: req.body.personWhatsAppNo,
      contactForPayment: req.body.contactForPayment,
      contactMobileNo: req.body.contactMobileNo,
      contactWhatsAppNo: req.body.contactWhatsAppNo,
      contactForPaymentEmail: req.body.contactForPaymentEmail || null,
      GSTNo: req.body.GSTNo || null,
      address: req.body.address,
      reference: req.body.reference,
      statusApproval: req.body.isRequestMode ? "Pending" : "Approved" // Set based on isRequestMode
    };

    const newParty = await Party.create(partyData);

    const accountMasterData = {
      companyName: req.body.companyName,
      party: newParty._id,
      reasonToVisit: req.body.reasonToVisit,
      createdBy: req.body.createdBy
    };

    const newAccountMaster = await AccountMaster.create(accountMasterData);

    const populatedAccountMaster = await AccountMaster.findById(newAccountMaster._id)
      .populate("companyName", "companyName")
      .populate("party")
      .populate("createdBy", "firstName lastName email");

    res.status(201).json({
      success: true,
      message: "Account master created successfully",
      data: populatedAccountMaster,
    });

  } catch (error) {
    console.error("Error creating account master:", error);
    // if (error.code === 11000) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Duplicate entry. Party name or GST number already exists.",
    //   });
    // }
    res.status(500).json({
      success: false,
      message: "Failed to create account master",
      error: error.message,
    });
  }
};

exports.getAllAccountMasters = async (req, res) => {
  try {
    const { statusApproval } = req.query; // Optional query parameter

    // Build query object
    const query = {};
    if (statusApproval && ["Pending", "Approved"].includes(statusApproval)) {
      query["party.statusApproval"] = statusApproval;
    }

    const accountMasters = await AccountMaster.find()
      .populate("createdBy", "firstName lastName email")
      .populate("companyName", "companyName avatar _id")
      .populate({
        path: "party",
        select: "-__v",
        match: statusApproval ? { statusApproval } : {} // Filter by statusApproval
      })
      .sort({ createdAt: -1 });

    // Filter out null parties (in case some don't match the statusApproval)
    const filteredAccountMasters = accountMasters.filter(account => account.party !== null);

    const assignTasks = await AssignTask.aggregate([
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            partyName: "$partyName",
            companyName: "$companyName"
          },
          latestTask: { $first: "$$ROOT" }
        }
      }
    ]);

    const taskMap = {};
    assignTasks.forEach(task => {
      const key = `${task._id.partyName}_${task._id.companyName}`;
      taskMap[key] = task.latestTask;
    });

    const enrichedAccountMasters = await Promise.all(
      filteredAccountMasters.map(async (account) => {
        const taskKey = `${account?.party?._id}_${account?.companyName?._id}`;
        const latestTask = taskMap[taskKey];

        let taskDetails = {
          assignedTo: account.createdBy,
          remarks: "NA",
          status: "Not Started"
        };

        if (latestTask) {
          const populatedTask = await AssignTask.populate(latestTask, {
            path: 'assignTo',
            select: 'firstName lastName email'
          });

          taskDetails = {
            assignedTo: populatedTask.assignTo || account.createdBy,
            remarks: populatedTask.remarks || "NA",
            status: populatedTask.status || "Not Started"
          };
        }

        return {
          _id: account._id,
          companyName: {
            _id: account.companyName?._id,
            name: account.companyName?.companyName,
            avatar:account.companyName?.avatar
          },
          reasonToVisit: account.reasonToVisit,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
          createdBy: account.createdBy,
          party: {
            _id: account.party._id,
            partyName: account.party.partyName,
            ownerName: account.party.ownerName,
            ownerMobileNo: account.party.ownerMobileNo,
            ownerWhatsAppNo: account.party.ownerWhatsAppNo,
            ownerEmail: account.party.ownerEmail || "N/A",
            contactPerson: account.party.contactPerson,
            personMobileNo: account.party.personMobileNo,
            personWhatsAppNo: account.party.personWhatsAppNo,
            contactPersonEmail: account.party.contactPersonEmail || "N/A",
            contactForPayment: account.party.contactForPayment,
            contactMobileNo: account.party.contactMobileNo,
            contactWhatsAppNo: account.party.contactWhatsAppNo,
            contactForPaymentEmail: account.party.contactForPaymentEmail || "N/A",
            GSTNo: account.party.GSTNo,
            address: account.party.address,
            partyTag: account.party.partyTag,
            statusApproval: account.party.statusApproval, // Include statusApproval
            createdAt: account.party.createdAt,
            updatedAt: account.party.updatedAt
          },
          assignment: taskDetails
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedAccountMasters.length,
      data: enrichedAccountMasters
    });

  } catch (error) {
    console.error("Error getting account masters:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch account masters",
      error: error.message
    });
  }
};
// exports.bulkCreateAccountMasters = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     if (!req.file) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({
//         success: false,
//         message: "No file uploaded",
//       });
//     }

//     const globalCompanyName = req.body.companyName;
//     const globalCreatedBy = req.body.createdBy;

//     const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const data = xlsx.utils.sheet_to_json(sheet);

//     const accountMasters = [];
//     const errors = [];

//     for (const row of data) {
//       row.companyName = globalCompanyName || row.companyName;
//       row.createdBy = globalCreatedBy || row.createdBy;

//       const partyData = {
//         companyName: row.companyName,
//         partyName: row.partyName,
//         ownerName: row.ownerName || null,
//         ownerMobileNo: row.ownerMobileNo || null,
//         ownerWhatsAppNo: row.ownerWhatsAppNo,
//         ownerEmail: row.ownerEmail || null,
//         contactPerson: row.contactPerson || null,
//         personMobileNo: row.personMobileNo || null,
//         personWhatsAppNo: row.personWhatsAppNo || null,
//         contactPersonEmail: row.contactPersonEmail || null,
//         contactForPayment: row.contactForPayment || null,
//         contactMobileNo: row.contactMobileNo || null,
//         contactWhatsAppNo: row.contactWhatsAppNo || null,
//         contactForPaymentEmail: row.contactForPaymentEmail || null,
//         GSTNo: row.GSTNo || null,
//         address: {
//           unitNo: row.unitNo,
//           marketName: row.marketName,
//           streetAddress: row.streetAddress,
//           landMark: row.landMark || null,
//           area: row.area,
//           pincode: row.pincode,
//         },
//         reference: row.reference,
//         statusApproval: row.isRequestMode ? "Pending" : "Approved"
//       };

//       const requiredFields = [];
//       if (!globalCompanyName) requiredFields.push("companyName");
//       if (!globalCreatedBy) requiredFields.push("createdBy");
//       requiredFields.push("partyName", "ownerWhatsAppNo", "unitNo", "marketName", "streetAddress", "area", "pincode", "reasonToVisit", "reference");

//       let isValid = true;

//       for (const field of requiredFields) {
//         const fieldParts = field.split(".");
//         let value = row;
//         for (const part of fieldParts) {
//           value = value[part];
//           if (!value) {
//             errors.push(`Missing required field ${field} in row ${JSON.stringify(row)}`);
//             isValid = false;
//             break;
//           }
//         }
//       }

//       if (isValid) {
//         const company = await CompanyName.findById(row.companyName).session(session);
//         if (!company) {
//           errors.push(`Invalid companyName ID in row ${JSON.stringify(row)}`);
//           continue;
//         }

//         const staff = await Staff.findById(row.createdBy).session(session);
//         if (!staff) {
//           errors.push(`Invalid createdBy ID in row ${JSON.stringify(row)}`);
//           continue;
//         }

//         const existingParty = await Party.findOne({
//           $and: [
//             { companyName: row.companyName },
//             { partyName: row.partyName },
//             { ownerWhatsAppNo: row.ownerWhatsAppNo }
//           ]
//         }).session(session);

//         if (existingParty) {
//           errors.push(`Party already exists in row ${JSON.stringify(row)}`);
//           continue;
//         }

//         const newParty = await Party.create([partyData], { session });
//         const accountMasterData = {
//           companyName: row.companyName,
//           party: newParty[0]._id,
//           reasonToVisit: row.reasonToVisit,
//           reference: row.reference,
//           createdBy: row.createdBy
//         };

//         const newAccountMaster = await AccountMaster.create([accountMasterData], { session });
//         accountMasters.push(newAccountMaster[0]);
//       }
//     }

//     if (errors.length > 0) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({
//         success: false,
//         message: "Some records failed to process",
//         errors,
//       });
//     }

//     await session.commitTransaction();
//     session.endSession();

//     const populatedAccountMasters = await AccountMaster.find({ _id: { $in: accountMasters.map(am => am._id) } })
//       .populate("companyName", "companyName")
//       .populate("party")
//       .populate("createdBy", "firstName lastName email");

//     res.status(201).json({
//       success: true,
//       message: "Bulk account masters created successfully",
//       data: populatedAccountMasters,
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("Error in bulk create account masters:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to bulk create account masters",
//       error: error.message,
//     });
//   }
// };
exports.bulkCreateAccountMasters = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if file is uploaded
    if (!req.file) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Get global companyName and createdBy from request body
    const globalCompanyName = req.body.companyName;
    const globalCreatedBy = req.body.createdBy;

    // Validate global fields
    if (!globalCompanyName || !globalCreatedBy) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "companyName and createdBy are required in the request body",
      });
    }

    // Read and parse the uploaded CSV file
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const accountMasters = [];
    const errors = [];

    // Process each row in the CSV
    for (const row of data) {
      // Prepare party data from CSV row
      const partyData = {
        companyName: globalCompanyName,
        partyName: row.partyName || null,
        ownerName: row.ownerName || null,
        ownerMobileNo: row.ownerMobileNo || null,
        ownerWhatsAppNo: row.ownerWhatsAppNo || null,
        ownerEmail: row.ownerEmail || null,
        contactPerson: row.contactPerson || null,
        personMobileNo: row.personMobileNo || null,
        personWhatsAppNo: row.personWhatsAppNo || null,
        contactPersonEmail: row.contactPersonEmail || null,
        contactForPayment: row.contactForPayment || null,
        contactMobileNo: row.contactMobileNo || null,
        contactWhatsAppNo: row.contactWhatsAppNo || null,
        contactForPaymentEmail: row.contactForPaymentEmail || null,
        GSTNo: row.GSTNo || null,
        address: {
          unitNo: row.unitNo || null,
          marketName: row.marketName || null,
          streetAddress: row.streetAddress || null,
          landMark: row.landMark || null,
          area: row.area || null,
          pincode: row.pincode || null,
        },
        reference: row.reference || null,
        statusApproval: row.isRequestMode === "TRUE" ? "Pending" : "Approved",
        createdBy: globalCreatedBy,
      };

      // Validate companyName
      const company = await CompanyName.findById(globalCompanyName).session(session);
      if (!company) {
        errors.push(`Invalid companyName ID for row: ${JSON.stringify(row)}`);
        continue;
      }

      // Validate createdBy
      const staff = await Staff.findById(globalCreatedBy).session(session);
      if (!staff) {
        errors.push(`Invalid createdBy ID for row: ${JSON.stringify(row)}`);
        continue;
      }

      // Create new Party (no duplicate check to allow duplicate partyName)
      const newParty = await Party.create([partyData], { session });

      // Prepare AccountMaster data
      const accountMasterData = {
        companyName: globalCompanyName,
        party: newParty[0]._id,
        reasonToVisit: row.reasonToVisit || null,
        reference: row.reference || null,
        createdBy: globalCreatedBy,
      };

      // Create new AccountMaster
      const newAccountMaster = await AccountMaster.create([accountMasterData], { session });
      accountMasters.push(newAccountMaster[0]);
    }

    // If there are errors, rollback and return
    if (errors.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Some records failed to process",
        errors,
      });
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Populate and return the created AccountMasters
    const populatedAccountMasters = await AccountMaster.find({ _id: { $in: accountMasters.map(am => am._id) } })
      .populate("companyName", "companyName")
      .populate("party")
      .populate("createdBy", "firstName lastName email");

    res.status(201).json({
      success: true,
      message: "Bulk account masters created successfully",
      data: populatedAccountMasters,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error in bulk create account masters:", error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk create account masters",
      error: error.message,
    });
  }
};
exports.getAccountMasterById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid AccountMaster ID",
      });
    }

    const accountMaster = await AccountMaster.findById(id)
      .populate("companyName") // Include _id for company selection
      .populate("party")
      .populate("createdBy", "_id firstName lastName email"); // Include _id for createdBy selection

    if (!accountMaster) {
      return res.status(404).json({
        success: false,
        message: "AccountMaster not found",
      });
    }

    // Transform the data to match frontend structure
    const responseData = {
      companyName: accountMaster.companyName._id.toString(), // Just the ID for the company select
      partyName: accountMaster.party.partyName, // Direct party name for the party input
      ownerName: accountMaster.party.ownerName,
      ownerMobileNo: accountMaster.party.ownerMobileNo,
      ownerWhatsAppNo: accountMaster.party.ownerWhatsAppNo,
      ownerEmail: accountMaster.party.ownerEmail || "",
      contactPerson: accountMaster.party.contactPerson,
      personMobileNo: accountMaster.party.personMobileNo,
      personWhatsAppNo: accountMaster.party.personWhatsAppNo,
      contactPersonEmail: accountMaster.party.contactPersonEmail || "",
      contactForPayment: accountMaster.party.contactForPayment,
      contactMobileNo: accountMaster.party.contactMobileNo,
      contactWhatsAppNo: accountMaster.party.contactWhatsAppNo,
      contactForPaymentEmail: accountMaster.party.contactForPaymentEmail || "",
      GSTNo: accountMaster.party.GSTNo,
      address: {
        unitNo: accountMaster.party.address.unitNo,
        marketName: accountMaster.party.address.marketName,
        streetAddress: accountMaster.party.address.streetAddress,
        landMark: accountMaster.party.address.landMark || "", // Handle optional field
        area: accountMaster.party.address.area,
        pincode: accountMaster.party.address.pincode,
      },
      reasonToVisit: accountMaster.reasonToVisit,
      reference: accountMaster.reference || "",
      createdBy: accountMaster.createdBy._id.toString(), // Just the ID for the staff select
      // Include additional fields that might be needed for display
      createdById: accountMaster.createdBy._id.toString(),
      companyNameObj: accountMaster.companyName, // Entire company object if needed
      createdByObj: accountMaster.createdBy, // Entire staff object if needed
    };

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching account master:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch account master",
      error: error.message,
    });
  }
};

exports.updateAccountMaster = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid AccountMaster ID",
      });
    }

    const accountMaster = await AccountMaster.findById(id);
    if (!accountMaster) {
      return res.status(404).json({
        success: false,
        message: "AccountMaster not found",
      });
    }

    if (!req.body.companyName || !req.body.reasonToVisit) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: companyName or reasonToVisit",
      });
    }

    const company = await CompanyName.findById(req.body.companyName);
    if (!company) {
      return res.status(400).json({
        success: false,
        message: "Invalid companyName ID. Company does not exist.",
      });
    }

    // Validate createdBy if provided
    if (req.body.createdBy) {
      if (!mongoose.Types.ObjectId.isValid(req.body.createdBy)) {
        return res.status(400).json({
          success: false,
          message: "Invalid createdBy ID",
        });
      }
      const staff = await Staff.findById(req.body.createdBy);
      if (!staff) {
        return res.status(400).json({
          success: false,
          message: "Invalid createdBy ID. Staff member does not exist.",
        });
      }
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (req.body.ownerEmail && !emailRegex.test(req.body.ownerEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid owner email format",
      });
    }
    if (req.body.contactPersonEmail && !emailRegex.test(req.body.contactPersonEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact person email format",
      });
    }
    if (req.body.contactForPaymentEmail && !emailRegex.test(req.body.contactForPaymentEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact for payment email format",
      });
    }
    const partyId = accountMaster.party;

    const partyUpdateData = {
      partyName: req.body.partyName,
      ownerName: req.body.ownerName,
      ownerMobileNo: req.body.ownerMobileNo,
      ownerWhatsAppNo: req.body.ownerWhatsAppNo,
      ownerEmail: req.body.ownerEmail || null,
      contactPerson: req.body.contactPerson,
      personMobileNo: req.body.personMobileNo,
      personWhatsAppNo: req.body.personWhatsAppNo,
      contactPersonEmail: req.body.contactPersonEmail || null,
      contactForPayment: req.body.contactForPayment,
      contactMobileNo: req.body.contactMobileNo,
      contactWhatsAppNo: req.body.contactWhatsAppNo,
      contactForPaymentEmail: req.body.contactForPaymentEmail || null,
      GSTNo: req.body.GSTNo,
      address: req.body.address,
      reference: req.body.reference,
      // Preserve existing statusApproval unless explicitly updated
      statusApproval: req.body.statusApproval || (await Party.findById(partyId)).statusApproval,
    };

if (req.body.companyName || req.body.partyName || req.body.ownerWhatsAppNo) {
      const existingParty = await Party.findOne({
        $and: [
          { _id: { $ne: partyId } }, // Exclude current party
          { companyName: req.body.companyName || accountMaster.companyName },
          { partyName: req.body.partyName || accountMaster.party.partyName },
          { ownerWhatsAppNo: req.body.ownerWhatsAppNo || accountMaster.party.ownerWhatsAppNo }
        ]
      });

      if (existingParty) {
        return res.status(400).json({
          success: false,
          message: "A party with this company, name and mobile number already exists",
        });
      }
    }

    const updatedParty = await Party.findByIdAndUpdate(partyId, partyUpdateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedParty) {
      return res.status(404).json({
        success: false,
        message: "Associated Party not found",
      });
    }

    const accountMasterUpdateData = {
      companyName: req.body.companyName,
      reasonToVisit: req.body.reasonToVisit,
      reference: req.body.reference,
      ...(req.body.createdBy && { createdBy: req.body.createdBy }), // Conditionally include createdBy
    };

    console.log("Updating AccountMaster with:", accountMasterUpdateData); // Debug log

    const updatedAccountMaster = await AccountMaster.findByIdAndUpdate(
      id,
      accountMasterUpdateData,
      { new: true, runValidators: true }
    )
      .populate("companyName", "companyName")
      .populate("party")
      .populate("createdBy", "firstName lastName email");

    if (!updatedAccountMaster) {
      return res.status(404).json({
        success: false,
        message: "Failed to update AccountMaster",
      });
    }

    console.log("Updated AccountMaster:", updatedAccountMaster); // Debug log

    res.status(200).json({
      success: true,
      message: "Account master updated successfully",
      data: updatedAccountMaster,
    });
  } catch (error) {
    console.error("Error updating account master:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate entry. Party name or GST number already exists.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to update account master",
      error: error.message,
      stack: error.stack,
    });
  }
};

// Update Account Master Status
exports.updateAccountMasterStatus = async (req, res) => {
  try {
    // Validate status if provided
    if (!req.body.status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    // Update the AccountMaster document
    const updatedAccountMaster = await AccountMaster.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status }, // Only update status if it's part of the schema
      { new: true, runValidators: true }
    ).populate("createdBy", "firstName lastName email");

    if (!updatedAccountMaster) {
      return res.status(404).json({
        success: false,
        message: "Account master not found",
      });
    }

    // Find the latest assign task for this party
    const latestTask = await AssignTask.findOne({ partyName: updatedAccountMaster.partyName })
      .sort({ createdAt: -1 })
      .populate("assignTo", "firstName lastName email");

    // Prepare assignedTo, remarks, and status from the latest task
    let assignedTo = updatedAccountMaster.createdBy;
    let remarks = "NA";
    let status = req.body.status || "Not Started"; // Use the provided status

    if (latestTask) {
      assignedTo = latestTask.assignTo || updatedAccountMaster.createdBy;
      remarks = latestTask.remarks || "NA";
      status = latestTask.status || req.body.status || "Not Started";
    }

    // Format the response to match the schema and include task data
    const formattedData = {
      _id: updatedAccountMaster._id,
      companyName: updatedAccountMaster.companyName,
      partyName: updatedAccountMaster.partyName,
      ownerName: updatedAccountMaster.ownerName,
      ownerMobileNo: updatedAccountMaster.ownerMobileNo,
      ownerWhatsAppNo: updatedAccountMaster.ownerWhatsAppNo,
      contactPerson: updatedAccountMaster.contactPerson,
      personMobileNo: updatedAccountMaster.personMobileNo,
      personWhatsAppNo: updatedAccountMaster.personWhatsAppNo,
      contactForPayment: updatedAccountMaster.contactForPayment,
      contactMobileNo: updatedAccountMaster.contactMobileNo,
      contactWhatsAppNo: updatedAccountMaster.contactWhatsAppNo,
      GSTNo: updatedAccountMaster.GSTNo,
      address: {
        unitNo: updatedAccountMaster.address.unitNo,
        marketName: updatedAccountMaster.address.marketName,
        streetAddress: updatedAccountMaster.address.streetAddress,
        landMark: updatedAccountMaster.address.landMark,
        area: updatedAccountMaster.address.area,
        pincode: updatedAccountMaster.address.pincode,
      },
      reasonToVisit: updatedAccountMaster.reasonToVisit,
      partyTag: updatedAccountMaster.partyTag,
      createdBy: updatedAccountMaster.createdBy
        ? `${updatedAccountMaster.createdBy.firstName} ${updatedAccountMaster.createdBy.lastName}`
        : "",
      createdById: updatedAccountMaster.createdBy ? updatedAccountMaster.createdBy._id : null,
      assignedTo: assignedTo
        ? {
            _id: assignedTo._id,
            name: `${assignedTo.firstName} ${assignedTo.lastName}`,
            email: assignedTo.email,
          }
        : null,
      remarks,
      status,
      createdAt: updatedAccountMaster.createdAt,
      updatedAt: updatedAccountMaster.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: "Account master status updated successfully",
      data: formattedData,
    });
  } catch (error) {
    console.error("Error updating account master status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update account master status",
      error: error.message,
    });
  }
};


exports.deleteAccountMaster = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const accountMasterId = req.params.id;

    // 1. Find the AccountMaster with party details
    const accountMaster = await AccountMaster.findById(accountMasterId)
      .populate('party')
      .session(session);
    
    if (!accountMaster) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Account master not found",
      });
    }

    // Store party ID for deletion
    const partyId = accountMaster.party._id;

    // 2. Delete the AccountMaster
    await AccountMaster.findByIdAndDelete(accountMasterId).session(session);

    // 3. Delete the associated Party
    await Party.findByIdAndDelete(partyId).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Account master and associated party deleted successfully",
      deletedCounts: {
        accountMaster: 1,
        party: 1
      },
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error("Error in deleteAccountMaster:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete account master and party",
      error: error.message,
    });
  }
};

// Get all Staff for createdBy dropdown
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find({}, 'firstName lastName _id');
    const formattedStaff = staff.map(s => ({
      id: s._id,
      name: `${s.firstName} ${s.lastName}`
    }));

    res.status(200).json({
      success: true,
      data: formattedStaff,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.getAccountMasterByCompanyAndParty = async (req, res) => {
  try {

    const {companyId , partyId} = req.body
    // Validate both IDs
    if (!mongoose.Types.ObjectId.isValid(companyId) || 
        !mongoose.Types.ObjectId.isValid(partyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format(s)"
      });
    }

    // Find account master where both company and party match
    const accountMaster = await AccountMaster.findOne({
      companyName: companyId,
      party: partyId
    })
    .populate({
      path: "companyName",
      select: "-__v" // All company fields except version
    })
    .populate({
      path: "party",
      select: "-__v" // All party fields except version
    })
    .populate({
      path: "createdBy",
      select: "-__v -password" // All staff fields except version and password
    });

    if (!accountMaster) {
      return res.status(404).json({
        success: false,
        message: "No account found matching these company and party IDs"
      });
    }

    // Return complete populated data
    res.status(200).json({
      success: true,
      data: {
        accountMaster: {
          _id: accountMaster._id,
          reasonToVisit: accountMaster.reasonToVisit,
          createdAt: accountMaster.createdAt,
          updatedAt: accountMaster.updatedAt,
          company: accountMaster.companyName.toObject(),
          party: accountMaster.party.toObject(),
          createdBy: accountMaster.createdBy.toObject()
        }
      }
    });

  } catch (error) {
    console.error("Error fetching account:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch account data",
      error: error.message
    });
  }
};

// controllers/accountMasterController.js
exports.approveParty = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Party ID",
      });
    }

    const party = await Party.findById(id);
    if (!party) {
      return res.status(404).json({
        success: false,
        message: "Party not found",
      });
    }

    if (party.statusApproval === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Party is already approved",
      });
    }

    party.statusApproval = "Approved";
    await party.save();

    const accountMaster = await AccountMaster.findOne({ party: id })
      .populate("companyName", "companyName")
      .populate("party")
      .populate("createdBy", "firstName lastName email");

    res.status(200).json({
      success: true,
      message: "Party approved successfully",
      data: accountMaster,
    });

  } catch (error) {
    console.error("Error approving party:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve party",
      error: error.message,
    });
  }
};

exports.getAccountMasterByStaffId = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🚀 ~ req:", req.params)
    console.log("🚀 ~ staffId:", id)

    // Validate staffId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Staff ID",
      });
    }

    // Check if staff exists
    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    // Find account masters created by this staff
    const accountMasters = await AccountMaster.find({ createdBy: id })
      .populate("companyName", "_id companyName")
      .populate("party", "-__v")
      .populate("createdBy", "_id firstName lastName email")
      .sort({ createdAt: -1 });

    // if (!accountMasters.length) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "No account masters found for this staff member",
    //   });
    // }

    // Fetch latest tasks for each party and company combination
    const assignTasks = await AssignTask.aggregate([
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            partyName: "$partyName",
            companyName: "$companyName"
          },
          latestTask: { $first: "$$ROOT" }
        }
      }
    ]);

    const taskMap = {};
    assignTasks.forEach(task => {
      const key = `${task._id.partyName}_${task._id.companyName}`;
      taskMap[key] = task.latestTask;
    });

    // Enrich account masters with task details
    const enrichedAccountMasters = await Promise.all(
      accountMasters.map(async (account) => {
        const taskKey = `${account.party._id}_${account.companyName._id}`;
        const latestTask = taskMap[taskKey];

        let taskDetails = {
          assignedTo: account.createdBy,
          remarks: "NA",
          status: "Not Started"
        };

        if (latestTask) {
          const populatedTask = await AssignTask.populate(latestTask, {
            path: 'assignTo',
            select: 'firstName lastName email'
          });

          taskDetails = {
            assignedTo: populatedTask.assignTo || account.createdBy,
            remarks: populatedTask.remarks || "NA",
            status: populatedTask.status || "Not Started"
          };
        }

        return {
          _id: account._id,
          companyName: {
            _id: account.companyName?._id,
            name: account.companyName?.companyName
          },
          reasonToVisit: account.reasonToVisit,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
          createdBy: account.createdBy,
          party: {
            _id: account.party._id,
            partyName: account.party.partyName,
            ownerName: account.party.ownerName,
            ownerMobileNo: account.party.ownerMobileNo,
            ownerWhatsAppNo: account.party.ownerWhatsAppNo,
            contactPerson: account.party.contactPerson,
            personMobileNo: account.party.personMobileNo,
            personWhatsAppNo: account.party.personWhatsAppNo,
            contactForPayment: account.party.contactForPayment,
            contactMobileNo: account.party.contactMobileNo,
            contactWhatsAppNo: account.party.contactWhatsAppNo,
            GSTNo: account.party.GSTNo,
            address: account.party.address,
            partyTag: account.party.partyTag,
            statusApproval: account.party.statusApproval,
            createdAt: account.party.createdAt,
            updatedAt: account.party.updatedAt
          },
          assignment: taskDetails
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedAccountMasters.length,
      data: enrichedAccountMasters,
    });

  } catch (error) {
    console.error("Error fetching account masters by staff ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch account masters",
      error: error.message,
    });
  }
};

exports.searchParties = async (req, res) => {
  try {
    const { q } = req.query;
    const query = q ? { partyName: { $regex: q, $options: 'i' } } : {};
    const parties = await Party.find(query).limit(20).sort({ partyName: 1 });
    
    res.status(200).json({
      success: true,
      data: parties,
    });
  } catch (error) {
    console.error("Error searching parties:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search parties",
      error: error.message,
    });
  }
};