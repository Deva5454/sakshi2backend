const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  companyName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompanyName',
    required: [true, 'Company name is required'],
  },
  name: {
    type: String,
    required: [true, 'Vendor name is required'],
    trim: true,
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    match: [/^[0-9]{10}$/, 'Contact number must be 10 digits'],
  },
  whatsappNumber: {
    type: String,
    required: [true, 'WhatsApp number is required'],
    match: [/^[0-9]{10}$/, 'WhatsApp number must be 10 digits'],
  },
  gst: {
    type: String,
    trim: true,
    match: [/^[0-9A-Z]{15}$/, 'GST number must be 15 characters alphanumeric'],
    default: '',
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Vendor', VendorSchema);