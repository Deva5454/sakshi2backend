const mongoose = require("mongoose");

const sequenceSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true,
  },
  lastSequence: {
    type: Number,
    default: 100,
  },
});

const Sequence = mongoose.model("Sequence", sequenceSchema);

module.exports = Sequence;