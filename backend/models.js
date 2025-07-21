const mongoose = require("mongoose");

const memorySchema = new mongoose.Schema({
  latitude: Number,
  longitude: Number,
  memory: String,
  place: String,
});

module.exports = mongoose.model("Memoo", memorySchema);
