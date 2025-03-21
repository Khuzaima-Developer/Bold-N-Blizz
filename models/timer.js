const mongoose = require("mongoose");

const TimerSchema = new mongoose.Schema({
  name: String,
  timer: Date,
  running: { type: Boolean, default: false },
});

const Timer = mongoose.model("Timer", TimerSchema);

module.exports = Timer;
