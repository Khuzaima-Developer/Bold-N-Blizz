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
  } else if (minutes === 0) {
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
      timer: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
    });
  }

  scrapeAllData();

  while (true) {
    // Fetch the latest execution time
    nextExecution = await Timer.findOne({ name: "scrapeAllData" });

    const now = Date.now();
    const delay = Math.max(nextExecution.timer - now, 0);

    executionTimer(delay);

    // Wait until the next execution time
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Fetch the latest timer from DB (in case it was updated)
    const updatedExecution = await Timer.findOne({ name: "scrapeAllData" });

    if (!updatedExecution || updatedExecution.timer > Date.now()) {
      console.log("🔄 Timer updated, rescheduling...");
      continue; // Skip execution if the timer was changed
    }

    console.log("🚀 Running scraper...");
    await scrapeAllData();

    // Set the next execution time
    updatedExecution.timer = new Date(Date.now() + 6 * 60 * 60 * 1000);
    await updatedExecution.save();

    console.log(`✅ Next execution set for: ${updatedExecution.timer}`);
  }
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

    if (inActiveTime > 5 * 1000) {
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
