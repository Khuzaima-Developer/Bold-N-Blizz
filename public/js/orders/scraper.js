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
  closeBrowserIfExists,
} = require("./scrape-settings/launch-browser.js");
const { setupInterception } = require("./scrape-settings/interception.js");
const { clearQsrPage } = require("./scrape-settings/clear-qsr-page.js");
const {
  navigateTrackings,
} = require("./customerTracking/extract-trackings.js");

const scrapeAllData = async () => {
  await closeBrowserIfExists();
  const page = await useExistingPage();
  try {
    await page.setCacheEnabled(false);

    await handleDialog(page);

    await setupInterception(page);

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

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
    await new Promise((resolve) => setTimeout(resolve, 500));

    await customersData(page);
    // Extract customer IDs

    await new Promise((resolve) => setTimeout(resolve, 500));

    await Customer.deleteOldCustomers();
    await CustomerTracking.deleteOldTrackings();

    await navigateTrackings(page);

    addRefToCustomers();

    await Timer.findOneAndUpdate(
      { name: "scrapeAllData" },
      { $set: { running: false, updatedTime: new Date(Date.now()) } }
    );

    // Kill the browser process forcefully
    await page.close();
    await closeBrowserIfExists();
  } catch (e) {
    console.error("There is an error while scrapping the whole data");
    await Timer.findOneAndUpdate(
      { name: "scrapeAllData" },
      { $set: { running: false, updatedTime: new Date(Date.now()) } }
    );
    console.error(e);
  }
};

module.exports = { scrapeAllData };
