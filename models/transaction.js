const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
});

module.exports = mongoose.model("transactions", transactionSchema);