const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
    materialName: {
        type: String,
        required: [true, 'Material name is required']
    },
    materialSize: {
        type: String,
        required: [true, 'Material size is required']
    },
    materialGSM: {
        type: Number,
        required: [true, 'Material GSM is required']
    },
},
    { timestamps: true }
);

module.exports = mongoose.model('Material', MaterialSchema);