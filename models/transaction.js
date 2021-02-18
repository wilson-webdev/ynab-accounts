const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  dateAdded: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("transactions", transactionSchema);