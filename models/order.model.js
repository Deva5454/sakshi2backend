const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    companyName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyName",
      required: true,
    },
    party: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Party",
      required: true,
    },
    productItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "productItem",
      required: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    filePaths: [
      {
        path: {
          type: String,
          trim: true,
        },
        remark: {
          type: String,
          trim: true,
          default: "",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: [
        "Received",
        "Designer",
        "Printer",
        "Binder",
        "Booklet & Folder Binder",
        "Delivery",
        "Hold",
      ],
      default: "Received",
    },
    orderNumber: {
      type: String,
      trim: true,
      unique: true,
      required: true,
    },
    number: {
      type: String,
      enum: ["Yes", "No"],
      trim: true,
      required: false,
    },
    size: {
      type: String,
      trim: true,
    },
    startNumber: {
      type: String,
      trim: true,
      required: function () {
        return this.number === "Yes";
      },
    },
    endNumber: {
      type: String,
      trim: true,
      required: function () {
        return this.number === "Yes";
      },
    },
    color: {
      type: String,
      enum: ["1", "2", "4", "6"],
      trim: true,
    },
    pType: {
      type: String,
      trim: true,
    },
    binding: {
      type: String,
      trim: true,
    },
    subPaper: {
      type: String,
      trim: true,
    },
    usedPaper: {
      type: String,
      trim: true,
    },
    printingrate: {
      type: String,
      trim: true,
    },
    //  },
    gsm: {
      type: String,
      trim: true,
    },
    // rowPaperSize: {
    //   type: String,
    //   trim: true,
    // },
    // rowPaperUser: {
    //   type: String,
    //   trim: true,
    // },
    rate: {
      type: Number,
      trim: true,
      min: 0, 
    },
    rateType: {
      type: String,
      enum: ["old", "new"],
      trim: true,
    },
    // Staff assignments
    designer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
    printer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
    binder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
    bookletBinder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },

    // Status tracking
    designerStatus: {
      type: String,
      enum: ["Pending", "In Progress", "Done", "Rework", "Approved"],
      default: "Pending",
    },
    printerStatus: {
      type: String,
      enum: ["Pending", "In Progress", "Done"],
      default: "Pending",
    },
    binderStatus: {
      type: String,
      enum: ["Pending", "In Progress", "Done"],
      default: "Pending",
    },
    bookletBinderStatus: {
      type: String,
      enum: ["Pending", "In Progress", "Done"],
      default: "Pending",
    },
    printerWastedSheet: {
      type: Number,
      min: 0,
      default: 0,
    },
    binderWastedSheet: {
      type: Number,
      min: 0,
      default: 0,
    },
    bookletBinderWastedSheet: {
      type: Number,
      min: 0,
      default: 0,
    },
    designerRemarks: {
      type: String,
      trim: true,
      default: "",
    },
    printerRemarks: {
      type: String,
      trim: true,
      default: "",
    },
    binderRemarks: {
      type: String,
      trim: true,
      default: "",
    },
    bookletBinderRemarks: {
      type: String,
      trim: true,
      default: "",
    },
    printerPapers: [
      {
        paperName: {
          type: String,
          required: true,
          trim: true
        },
        numberOfSheetsUsed: {
          type: String,
          trim: true,
          required: true,
        },
        sheetSize: {
          type: String,
          trim: true,
          required: true,
        },
        paperType: {
          type: String,
          trim: true,
          required: true,
        },
        gsm: {
          type: String,
          trim: true,
          required: true,
        },
        ratePerUnit: {
          type: String,
          trim: true,
          required: true,
        }
      }
    ],
    binderPapers: [
      {
        paperName: {
          type: String,
          required: true,
          trim: true
        },
        numberOfSheetsUsed: {
          type: String,
          trim: true,
          // required: true,
        },
        sheetSize: {
          type: String,
          trim: true,
          // required: true,
        },
        paperType: {
          type: String,
          trim: true,
          // required: true,
        },
        gsm: {
          type: String,
          trim: true,
          // required: true,
        },
        ratePerUnit: {
          type: String,
          trim: true,
          // required: true,
        }
      }
    ],
    bookletPapers: [
      {
        paperName: {
          type: String,
          required: true,
          trim: true,
          required: true,
        },
        numberOfSheetsUsed: {
          type: String,
          trim: true,
          required: true,
        },
        sheetSize: {
          type: String,
          trim: true,
          required: true,
        },
        paperType: {
          type: String,
          trim: true,
          required: true,
        },
        gsm: {
          type: String,
          trim: true,
          required: true,
        },
        ratePerUnit: {
          type: String,
          trim: true,
          required: true,
        }
      }
    ],

    // File uploads for each stage
    designFiles: [
      {
        path: {
          type: String,
          trim: true,
        },
        remark: {
          type: String,
          trim: true,
          default: "",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    printerFiles: [
      {
        path: {
          type: String,
          trim: true,
        },
        remark: {
          type: String,
          trim: true,
          default: "",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    binderFiles: [
      {
        path: {
          type: String,
          trim: true,
        },
        remark: {
          type: String,
          trim: true,
          default: "",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    bookletBinderFiles: [
      {
        path: {
          type: String,
          trim: true,
        },
        remark: {
          type: String,
          trim: true,
          default: "",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isLamination: {
      type: Boolean,
      default: false,
    },
    laminationType: {
      type: String,
      enum: ["", "Matte", "Gloss"],
      trim: true,
      default: "",
    },
    uv: {
      type: String,
      trim: true,
    },
    paper1: {
      type: String,
      trim: true,
    },
    paper2: {
      type: String,
      trim: true,
    },
    numberOfSheetUsed: {
      type: String,
      trim: true,
    },
    sheetSize: {
      type: String,
      trim: true,
    },
    paperType: {
      type: String,
      trim: true,
    },

    // Process checkboxes for booklet
    isPasting: {
      type: Boolean,
      default: false,
    },
    isCutting: {
      type: Boolean,
      default: false,
    },
    isCreasing: {
      type: Boolean,
      default: false,
    },
    isFoil: {
      type: Boolean,
      default: false,
    },
    isPunching: {
      type: Boolean,
      default: false,
    },
    // isPaper1: {
    //   type: Boolean,
    //   default: false,
    // },
    // isPaper2: {
    //   type: Boolean,
    //   default: false,
    // },
    validproof: [
      {
        path: {
          type: String,
          trim: true,
        },
        remark: {
          type: String,
          trim: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    invoiceValidProof: [
      {
        path: {
          type: String,
          trim: true,
        },
        remark: {
          type: String,
          trim: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    reworkHistory: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        remark: {
          type: String,
          trim: true,
        },
        files: [
          {
            path: String,
            remark: String,
          },
        ],
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Staff",
        },
      },
    ],
    issuedDate: {
      type: Date,
    },
    receivedDate: {
      type: Date,
    },
    pagesPerBook: {
      type: Number,
    },
    rateBook: {
      type: String,
      trim: true,
    },
    totalAmount: {
      type: String,
      trim: true,
    },
    ratePerUnit: {
      type: String,
      trim: true,
    },
    bindergst: {
      type: String,
      required: false,
    },
    deliveryDate: {
      type: Date,
    },
    deliveryTime: {
      type: String,
      trim: true,
    },
    deliveryStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
    isGst: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for better query performance
orderSchema.index({ companyName: 1, party: 1 })
orderSchema.index({ status: 1 })
orderSchema.index({ designer: 1 })
orderSchema.index({ printer: 1 })
orderSchema.index({ binder: 1 })
orderSchema.index({ bookletBinder: 1 })
orderSchema.index({ createdAt: -1 })

orderSchema.pre('save', async function(next) {
  try {
    // Only proceed if this is a new order (not an update)
    if (this.isNew) {
      const Party = mongoose.model('Party');
      
      // Find the party associated with this order
      const party = await Party.findById(this.party);
      
      if (party && party.partyTag === "New") {
        // Update the party tag to "Customer"
        party.partyTag = "Customer";
        await party.save();
        console.log(`Updated party ${party._id} tag from New to Customer`);
      }
    }
    next();
  } catch (error) {
    console.error("Error updating party tag:", error);
    next(error);
  }
});


const Order = mongoose.model("Order", orderSchema)
module.exports = Order
