const { timeout } = require("puppeteer");
const Customer = require("../../../../models/customers.js");
const CustomerTracking = require("../../../../models/customer-tracking.js");
const Timer = require("../../../../models/timer.js");
const { now } = require("mongoose");
require("../orders-var.js");

async function extractingData(page) {
  try {
    // Scroll to bottom to ensure all elements are loaded
    await autoScroll(page);

    // Wait for all elements to load completely
    await page.waitForSelector("div.card > div.solid-divider", {
      timeout: 30 * 60 * 1000,
    });

    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Extract data from all matching elements
    let trackingData = await page.evaluate(() => {
      let cards = [
        ...document.querySelectorAll("div.card > div.solid-divider"),
      ]; // Get all elements

      return cards.map((card) => {
        let trackingIdElement = card.querySelector("div:nth-child(3) > b");
        let row = card.querySelector(
          "div.col-12.table-rseponsive > table > thead > tr:nth-child(2)"
        );

        let columns = row ? [...row.children] : [];

        return {
          trackingId: trackingIdElement?.textContent.trim() || "N/A",
          date: columns[0]?.textContent.trim() || "N/A",
          details: columns[1]?.textContent.trim() || "N/A",
          location: columns[2]?.textContent.trim() || "N/A",
          status: columns[3]?.textContent.trim() || "N/A",
        };
      });
    });

    console.log(
      `✅ Successfully extracted ${trackingData.length} tracking records.`
    );

    if (!Array.isArray(trackingData) || trackingData.length === 0) {
      console.warn("⚠ No tracking data found.");
      return;
    }

    // Process and update only changed tracking records
    for (const tracking of trackingData) {
      try {
        let existingTracking = await CustomerTracking.findOne({
          trackingId: tracking.trackingId,
        });

        const hasChanged =
          !existingTracking ||
          existingTracking.date !== tracking.date ||
          existingTracking.details !== tracking.details ||
          existingTracking.location !== tracking.location ||
          existingTracking.status !== tracking.status;

        if (hasChanged) {
          await CustomerTracking.updateTrackings(tracking);
          console.log(
            `✅ Tracking data for ID ${tracking.trackingId} updated.`
          );
        }
      } catch (err) {
        console.error(
          `❌ Error processing tracking ID (${tracking.trackingId}):`,
          err.message
        );
      }
    }
  } catch (err) {
    console.error("❌ Error extracting data:", err.message);
    throw err;
  }
}

// Function to scroll down the page to load all elements
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100; // Scroll 100px at a time
      const timer = setInterval(() => {
        let scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

async function navigateTrackings(page) {
  const tracking = await Timer.findOne({ name: "InactiveTime" });

  try {
    if (!tracking) {
      await Timer.create({
        name: "InactiveTime",
        timer: Date.now(),
        running: false,
      });
    }

    if (tracking.running) {
      console.log("⚠️ Function already extracting customer data.");
      return;
    }

    await Timer.findOneAndUpdate(
      { name: "InactiveTime" },
      { $set: { running: true } }
    );

    // Step 1: Fetch CNs from MongoDB if not provided
    let remainingCNs = await Customer.aggregate([{ $group: { _id: "$CN" } }]);
    remainingCNs = remainingCNs.map((cn) => cn._id); // Extract CN values

    if (remainingCNs.length === 0) {
      console.log("⚠️ No CNs found to process.");
      return;
    }

    // Step 2: Open the tracking page
    await page.goto(trackingUrl);
    await page.waitForSelector(trackingsInput, { timeout: 30 * 60 * 1000 }); // 30 min timeout

    // Step 3: Process CNs in batches of 50 using `while` loop
    while (remainingCNs.length > 0) {
      const currentBatch = remainingCNs.splice(0, 50); // Take first 50 CNs
      const joinCN = currentBatch.join(",");

      // Type CNs into input
      await page.click(trackingsInput, { clickCount: 3 }); // Clear input first
      await page.type(trackingsInput, joinCN);

      // ✅ Corrected delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Click search button
      await page.click(searchTrackingsBtn);

      // Wait & extract data
      await extractingData(page);

      console.log(
        `✅ Extracted data for batch of ${currentBatch.length} CNs. Remaining: ${remainingCNs.length}`
      );
    }
  } catch (err) {
    console.error("❌ Error navigating trackings:", err.message);
  } finally {
    await Timer.findOneAndUpdate(
      { name: "InactiveTime" },
      { $set: { running: false } }
    );
  }
}

module.exports = { navigateTrackings };
