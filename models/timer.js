const mongoose = require("mongoose");

const TimerSchema = new mongoose.Schema({
  name: String,
  timer: { type: Date, default: new Date(Date.now()) },
  running: { type: Boolean, default: false },
});

const Timer = mongoose.model("Timer", TimerSchema);

module.exports = Timer;
