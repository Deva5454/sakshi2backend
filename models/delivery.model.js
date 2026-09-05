const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
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
    number: {
        type: Number,
        required: true,
    },
    rate: {
        type: Number,
        required: true,
    },
    color: {
        type: Number,
        required: true,
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
    remarks: {
        type: String,
    },
    deliveryToParty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff",
        required: true,
    },
    attachFile: [{
        type: String,
    }],
    date: {
        type: Date,
        required: true
    },
    time: {
        type: Date,
        required: true
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Delivery', deliverySchema);