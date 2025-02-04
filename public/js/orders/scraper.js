const puppeteer = require("puppeteer");
const { customersData } = require("./customers/get-customers-data.js");
const Customer = require("../../../models/customers.js");
const scrapeCustomerTracking = require("./customerTracking/extract-customer-tracking.js");
const {
  getAllCustomersCN,
  addRefToCustomers,
} = require("./customers/customers-extracting.js");
const { loginPortal } = require("./login-portal.js");
const { takeScreenshotsFor1Min } = require("../../../utils/take-sreenshot.js");

const scrapeAllData = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-software-rasterizer",
        "--remote-debugging-port=9222",
      ],

      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      timeout: 3 * 60 * 60 * 1000,
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    // Check if the current URL is the login page

    await loginPortal(page);
    // await takeScreenshotsFor1Min(page);
    const currentUrl = await page.url();

    if (currentUrl === "https://mnpcourier.com/cplight/login") {
      await loginPortal(page);
    }

    //   The url to qsr
    if (
      currentUrl === "https://mnpcourier.com/cplight/" ||
      currentUrl === "http://mnpcourier.com/cplight"
    ) {
      setTimeout(async () => {
        await page.goto("https://mnpcourier.com/cplight/qsr", {
          waitUntil: "load",
        });
      }, 1000);
    }
    setTimeout(async () => {
      await customersData(page);

      // Extract customer IDs
      await Customer.deleteOldCustomers();
      await Customer.monitorTrackingData();
      addRefToCustomers();
    }, 1000);
  } catch (e) {
    console.log("There is an error while scrapping the whole data");
    console.error(e);
  }
};

module.exports = { scrapeAllData };
