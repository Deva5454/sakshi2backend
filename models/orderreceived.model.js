const mongoose = require('mongoose');

const orderReceivedSchema = new mongoose.Schema({
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
        type: String,
        required: true,
        enum: ['yes', 'no']
    },
    startNumber: {
        type: String,
        required: function () { return this.number === 'yes'; },
        trim: true
    },
    endNumber: {
        type: String,
        required: function () { return this.number === 'yes'; },
        trim: true
    },
    color: {
        type: Number,
        required: true,
        min: 0
    },
    pType: {
        type: String,
        required: true,
        trim: true
    },
    remarks: {
        type: String,
        trim: true
    },
    attachFile: {
        type: [String],
        default: []
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('OrderReceived', orderReceivedSchema);