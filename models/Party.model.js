// models/Party.js
const mongoose = require("mongoose");

const partySchema = new mongoose.Schema({
    companyName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CompanyName",
    required: true
  },
  partyName: { 
    type: String, 
    // required: true,
    // unique: true 
  },
  ownerName: { type: String, required: false },
  ownerMobileNo: { type: String, required: false },
  ownerWhatsAppNo: { type: String, required: true },
  ownerEmail: {
    type: String,
    // match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    trim: true,
  },
  contactPerson: { type: String, required: false },
  personMobileNo: { type: String, required: false },
  personWhatsAppNo: { type: String, required: false },
  contactPersonEmail: {
    type: String,
    // match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    trim: true,
  },
  contactForPayment: { type: String, required: false },
  contactMobileNo: { type: String, required: false },
  contactWhatsAppNo: { type: String, required: false },
  contactForPaymentEmail: {
    type: String,
    // match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    trim: true,
  },
  GSTNo: {
    type: String,
    required: false,
    // unique: true,
  },
  address: {
    unitNo: { type: String, required: false },
    marketName: { type: String, required: false },
    streetAddress: { type: String, required: false },
    landMark: { type: String },
    area: { type: String, required: true },
    pincode: {
      type: String,
      required: true,
      // match: /^[0-9]{6}$/,
    },
  },
  partyTag: {
    type: String,
    enum: ["New", "Customer"],
    default: "New",
  },
  statusApproval: {
    type: String,
    enum: ["Pending", "Approved"],
    default: "Pending",
  }
}, { timestamps: true });

// Update partyTag based on Orders collection
partySchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('partyName')) {
    const Order = mongoose.model('Order');
    const orderExists = await Order.findOne({ partyName: this.partyName });
    if (orderExists) {
      this.partyTag = "Customer";
    }
  }
  next();
});

const Party = mongoose.model("Party", partySchema);
module.exports = Party;