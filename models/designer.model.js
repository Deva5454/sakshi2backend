const mongoose = require('mongoose');

const designerSchema = new mongoose.Schema({
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
    attachFile: {
        type: [String],
        default: []
    },
    remarks: {
        type: String,
        trim: true
    },
    fileRemarks: {
        type: String,
        trim: true
    },
    assignTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff",
        required: true,
    },
    designFile: {
        type: [String],
        default: []
    },
    reworkFile: {
        type: [String],
        default: []
    },
    attachApprovalProof: {
        type: String,
    },
    attachPerformaProof: {
        type: String,
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Designer', designerSchema);