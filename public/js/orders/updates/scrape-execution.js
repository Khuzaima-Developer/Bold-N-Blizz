const Timer = require("../../../../models/timer.js");

async function scheduleScrape() {
  let nextExecution = await Timer.findOne({ name: "scrapeAllData" });
  const lastActivity = await Timer.findOne({ name: "InactiveTime" });
  const now = Date.now();

  if (!lastActivity) {
    await Timer.create({
      name: "InactiveTime",
      timer: now,
    });
  }
  await Timer.updateMany({}, { $set: { running: false } });

  if (!nextExecution) {
    nextExecution = await Timer.create({
      name: "scrapeAllData",
    });
  }
}

async function userActivityDetected(req, res) {
  const lastActivity = await Timer.findOne({ name: "InactiveTime" });
  const now = Date.now();
  setTimeout(async () => {
    if (lastActivity) {
      const inActiveTime = now - lastActivity.timer;

      if (inActiveTime > 5 * 60 * 1000) {
        req.session.updated = true;
        res.redirect("/orders/update-data");
      }
      console.log("User activity detected", Date(inActiveTime));
    }

    await Timer.findOneAndUpdate(
      { name: "InactiveTime" },
      { timer: now },
      { upsert: true }
    );
    next();
  }, 10 * 1000);
}

module.exports = { userActivityDetected, scheduleScrape };
