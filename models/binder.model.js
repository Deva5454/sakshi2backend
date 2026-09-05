const mongoose = require('mongoose');

const binderSchema = new mongoose.Schema({
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
    binding: {
        type: Number,
        required: true,
        min: 0
    },
    pagePerBook: {
        type: Number,
        required: true
    },
    qty: {
        type: Number,
        required: true
    },
    subPaper: {
        type: Number,
        required: false,
    },
    usedPaper: {
        type: Number,
        required: true,
    },
    ratePerUnit: {
        type: Number,
        required: false,
    },
    GSM: {
        type: Number,
        required: true,
    },
    sheetSize: {
        type: String,
        required: true,
    },
    rawPaperSize: {
        type: String,
        required: true,
    },
    rawPaperType: {
        type: String,
        trim: true
    },
    attachFile: {
        type: [String],
        default: []
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Binder', binderSchema);