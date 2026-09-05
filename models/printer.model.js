const mongoose = require('mongoose');

const printerSchema = new mongoose.Schema({
    orderedNo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
    },
    companyName: {
        type: String,
        required: true,
        enum: ["Sakshi Creation", "Quality Packaging"],
    },
    partyName: {
        type: String,
        required: true,
        trim: true
    },
    itemName: {
        type: String,
        required: true,
        trim: true
    },
    assignTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff",
        required: true,
    },
    size: {
        type: String,
        required: true,
        trim: true
    },
    binding: {
        type: Number,
        required: true,
        min: 0
    },
    subPaper: {
        type: Number,
        required: true,
    },
    usedPaper: {
        type: Number,
        required: true,
    },
    pType: {
        type: Number,
        required: true,
    },
    rate: {
        type: Number,
        required: true,
    },
    ratePerUnit: {
        type: Number,
        required: true,
    },
    GSM: {
        type: Number,
        required: true,
    },
    sheetSize: {
        type: String,
        required: true,
    },
    paperType: {
        type: String,
        required: true,
    },
    remarks: {
        type: String,
        trim: true
    },
    attachFile: {
        type: [String],
        default: []
    },
    assignTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff",
        required: true,
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Printer', printerSchema);