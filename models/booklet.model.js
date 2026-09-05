const mongoose = require('mongoose');

const bookletSchema = new mongoose.Schema({
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
    orderNumber: {
        type: Number
    },
    itemName: {
        type: String,
        required: true,
        trim: true
    },
    issueDate: {
        type: Date,
        require: true,
    },
    receivedDate: {
        type: Date,
        require: true,
    },
    remarks: {
        type: String,
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
    qty: {
        type: Number,
        required: true,
        min: 0
    },
    laminationType: {
        type: String,
        required: true,
        enum: ["Glossy", "Matt"],
    },
    UV: {
        type: Boolean,
        required: true
    },
    noOfSheetUse: {
        type: Number,
        required: true
    },
    sheetSize: {
        type: String,
        required: true
    },
    paperType: {
        type: String,
        required: true
    },
    GSM: {
        type: Number,
        required: true,
    },
    ratePerUnit: {
        type: Number,
        required: true,
    },
    pasting: {
        type: Boolean,
        required: true
    },
    cutting: {
        type: Boolean,
        required: true
    },
    foil: {
        type: Boolean,
        required: true
    },
    punching: {
        type: Boolean,
        required: true
    },
    attachFile: {
        type: [String],
        default: []
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Booklet', bookletSchema);