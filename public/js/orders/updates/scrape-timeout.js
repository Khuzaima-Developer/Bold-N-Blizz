const { scrapeAllData } = require("../scraper.js");
const Timer = require("../../../../models/timer.js");

function executionTimer(delay) {
  const totalSeconds = delay / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (minutes >= 60) {
    console.log(`⏳ Waiting for ${hours}h ${remainingMinutes}m ${seconds}s`);
  } else if (minutes >= 0) {
    console.log(`⏳ Waiting for ${minutes}m ${seconds}s`);
  } else {
    console.log(`⏳ Waiting for ${seconds}s`);
  }
}

async function scheduleScrape() {
  let nextExecution = await Timer.findOne({ name: "scrapeAllData" });
  await Timer.updateMany({}, { $set: { running: false } });

  if (!nextExecution) {
    nextExecution = await Timer.create({
      name: "scrapeAllData",
      timer: new Date(Date.now()), // 6 hours from now
    });
  }

  scrapeAllData();
}

async function userActivityDetected() {
  const nextExecution = await Timer.findOne({ name: "scrapeAllData" });
  const lastActivity = await Timer.findOne({ name: "InactiveTime" });
  const now = Date.now();

  if (nextExecution) {
    if (nextExecution.timer - now < 30 * 60 * 1000) {
      console.log("nextExecution");
      nextExecution.timer = new Date(
        nextExecution.timer.getTime() + 60 * 60 * 1000
      ); // Add 1 hour
      await nextExecution.save();
    }
  }

  if (!lastActivity) {
    await Timer.create({
      name: "InactiveTime",
      timer: now,
    });
  }

  if (lastActivity) {
    const inActiveTime = now - lastActivity.timer;

    if (inActiveTime > 30 * 60 * 1000) {
      scrapeAllData();
    }
  }

  await Timer.findOneAndUpdate(
    { name: "InactiveTime" },
    { timer: now },
    { upsert: true }
  );
}

module.exports = { userActivityDetected, scheduleScrape };
