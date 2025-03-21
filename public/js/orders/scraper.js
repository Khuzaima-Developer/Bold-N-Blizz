const { customersData } = require("./customers/get-customers-data.js");
const Customer = require("../../../models/customers.js");
const CustomerTracking = require("../../../models/customer-tracking.js");
const Timer = require("../../../models/timer.js");
const { addRefToCustomers } = require("./customers/customers-extracting.js");
const { loginPortal } = require("./login-portal.js");
const {
  useExistingPage,
  monitorMemoryUsage,
  handleDialog,
} = require("./scrape-settings/launch-browser.js");
const { setupInterception } = require("./scrape-settings/interception.js");
const { clearQsrPage } = require("./scrape-settings/clear-qsr-page.js");
const {
  navigateTrackings,
} = require("./customerTracking/extract-trackings.js");

const scrapeAllData = async () => {
  try {
    const scrape = await Timer.findOne({ name: "scrapeAllData" });
    if (scrape.running) {
      console.log("Scraping is already in progress.");
      return;
    }

    await Timer.findOneAndUpdate(
      { name: "scrapeAllData" },
      { $set: { running: true } }
    );

    const page = await useExistingPage();

    await page.setCacheEnabled(false);

    await handleDialog(page);

    await setupInterception(page);

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    // Check if the current URL is the login page

    await loginPortal(page);
    const currentUrl = await page.url();

    if (currentUrl === loginUrl) {
      await loginPortal(page);
    }

    //   The url to qsr
    if (
      currentUrl === "https://mnpcourier.com/cplight/" ||
      currentUrl === "http://mnpcourier.com/cplight"
    ) {
      setTimeout(async () => {
        await page.goto(qsrUrl, {
          waitUntil: "domcontentloaded",
        });
        await clearQsrPage(page);
      }, 1000);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await customersData(page);
    // Extract customer IDs

    await new Promise((resolve) => setTimeout(resolve, 10000));

    await Customer.deleteOldCustomers();
    await CustomerTracking.deleteOldTrackings();

    await navigateTrackings(page);

    await addRefToCustomers();

    console.log("All data scraped");
    await Timer.findOneAndUpdate(
      { name: "scrapeAllData" },
      { $set: { running: false } }
    );

    // Kill the browser process forcefully
    await page.close();

    console.log("✅ Browser closed successfully.");
  } catch (e) {
    console.log("There is an error while scrapping the whole data");
    console.error(e);
  }
};

module.exports = { scrapeAllData };
