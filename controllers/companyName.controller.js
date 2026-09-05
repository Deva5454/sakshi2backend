const CompanyName = require("../models/companyName.model");
const AccountMaster = require("../models/accountMaster.model");
const mongoose = require("mongoose");

// Create a new CompanyName
exports.createCompanyName = async (req, res) => {
  try {
    // Check for required fields
    const requiredFields = ["companyName"];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`,
        });
      }
    }

    // Check if companyName already exists
    const existingCompany = await CompanyName.findOne({ companyName: req.body.companyName });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: "Company name already exists",
      });
    }

    // Create company name object
    const companyData = {
      companyName: req.body.companyName,
      avatar: req.body.avatar || null, // Include avatar field
    }

    // Create and save the company name
    const newCompany = new CompanyName(companyData);
    await newCompany.save();

    res.status(201).json({
      success: true,
      message: "Company name created successfully",
      data: newCompany,
    });
  } catch (error) {
    console.error("Error creating company name:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create company name",
      error: error.message,
    });
  }
};

// // Get all CompanyNames
// exports.getCompanyNames = async (req, res) => {
//   try {
//     const companies = await CompanyName.find().populate();
//     res.status(200).json({
//       success: true,
//       data: companies,
//     });
//   } catch (error) {
//     console.error("Error fetching company names:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch company names",
//       error: error.message,
//     });
//   }
// };

exports.getAllCompanyNames = async (req, res) => {
  try {
    // Get all company names sorted by newest first
    const companyNames = await CompanyName.find().select("companyName avatar").sort({ createdAt: -1 });

    // Return success response
    res.status(200).json({
      success: true,
      data: companyNames
    });

  } catch (error) {
    console.error("Error fetching company names:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch company names",
      error: error.message
    });
  }
};

exports.getCompanyNames = async (req, res) => {
  try {
    const companies = await CompanyName.aggregate([
      {
        $lookup: {
          from: "accountmasters", // must match MongoDB collection name (lowercase plural)
          localField: "_id",
          foreignField: "companyName",
          as: "partyList"
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: companies,
    });
  } catch (error) {
    console.error("Error fetching company names:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch company names",
      error: error.message,
    });
  }
};


// exports.getCompanyNames = async (req, res) => {
//   try {
//     const companiesWithParties = await CompanyName.aggregate([
//       {
//         $lookup: {
//           from: "accountmasters", // collection name in lowercase and plural
//           localField: "_id",
//           foreignField: "companyName",
//           as: "parties"
//         }
//       }
//     ]);

//     res.status(200).json({
//       success: true,
//       data: companiesWithParties,
//     });
//   } catch (error) {
//     console.error("Error fetching company names with parties:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch company names with parties",
//       error: error.message,
//     });
//   }
// };

// Get a single CompanyName by ID
exports.getCompanyNameById = async (req, res) => {
  try {
    const company = await CompanyName.findById(req.params.id);
    if (company) {
      res.status(200).json({
        success: true,
        data: company,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Company name not found",
      });
    }
  } catch (error) {
    console.error("Error fetching company name:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch company name",
      error: error.message,
    });
  }
};

// Update a CompanyName by ID
exports.updateCompanyName = async (req, res) => {
  try {
    // Check if companyName is being updated and if it already exists
    if (req.body.companyName) {
      const existingCompany = await CompanyName.findOne({
        companyName: req.body.companyName,
        _id: { $ne: req.params.id },
      });
      if (existingCompany) {
        return res.status(400).json({
          success: false,
          message: "Company name already in use",
        });
      }
    }

    // Prepare update data
    const updateData = {
      companyName: req.body.companyName,
      ...(req.body.avatar && { avatar: req.body.avatar }), // Only include avatar if provided
    };

    const updatedCompany = await CompanyName.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (updatedCompany) {
      res.status(200).json({
        success: true,
        message: "Company name updated successfully",
        data: updatedCompany,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Company name not found",
      });
    }
  } catch (error) {
    console.error("Error updating company name:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update company name",
      error: error.message,
    });
  }
};

// Delete a CompanyName by ID
exports.deleteCompanyName = async (req, res) => {
  try {
    const company = await CompanyName.findByIdAndDelete(req.params.id);
    if (company) {
      res.status(200).json({
        success: true,
        message: "Company name deleted successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Company name not found",
      });
    }
  } catch (error) {
    console.error("Error deleting company name:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete company name",
      error: error.message,
    });
  }
};

exports.getPartywithCompany = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate if companyId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID format",
      });
    }

    // Find all account masters that belong to the specified company
    const accountMasters = await AccountMaster.find({ 
      companyName: id 
    })
    .populate({
      path: 'party',
      match: { statusApproval: "Approved" }, // Only get approved parties
      select: 'partyName _id statusApproval address.unitNo address.marketName' // Include unitNo and marketName
    })
    .sort({ 'party.partyName': 1 });

    // Filter out any account masters where party is null (due to the match condition)
    const filteredAccounts = accountMasters.filter(account => account.party !== null);

    // Transform the data
    const parties = filteredAccounts.map(account => ({
      _id: account.party._id,
      partyName: account.party.partyName,
      unitNo: account.party.address.unitNo,
      marketName: account.party.address.marketName
    }));

    res.status(200).json({
      success: true,
      data: parties,
      count: parties.length,
      message: parties.length > 0 
        ? "Approved parties fetched successfully" 
        : "No approved parties found for this company",
    });

  } catch (error) {
    console.error("Error fetching approved parties by company:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch approved parties for the company",
      error: error.message,
    });
  }
};