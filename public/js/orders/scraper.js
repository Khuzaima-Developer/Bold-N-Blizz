const puppeteer = require("puppeteer");
const { customersData } = require("./customers/get-customers-data.js");
const Customer = require("../../../models/customers.js");
const CustomerTracking = require("../../../models/customer-tracking.js");
const scrapeCustomerTracking = require("./customerTracking/extract-customer-tracking.js");
const {
  getAllCustomersCN,
  addRefToCustomers,
} = require("./customers/customers-extracting.js");

const url = "https://mnpcourier.com/cplight/qsr";

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    // Open the login page
    await page.goto("https://mnpcourier.com/cplight/login");

    // Fill in the login credentials
    await page.type(
      "#app > section > div > div > div > div.card.card-primary > form > div > div:nth-child(1) > input",
      `${process.env.USER}`
    );
    await page.type(
      "#app > section > div > div > div > div.card.card-primary > form > div > div:nth-child(2) > input",
      `${process.env.PASSWORD}`
    );

    // Click the login button
    await page.click(
      "#app > section > div > div > div > div.card.card-primary > form > div > div:nth-child(4) > button"
    );

    // Wait for navigation after login
    await page.waitForNavigation();

    // Check if the current URL is the login page
    const currentUrl = await page.url();

    if (currentUrl === "https://mnpcourier.com/cplight/login") {
      console.log("Login failed or still on login page");
      await browser.close();
      return;
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

    await customersData(page);

    page.on("dialog", async (dialog) => {
      console.log(`Dialog detected: ${dialog.message()}`); // Log the dialog message
      await dialog.dismiss(); // Dismiss the dialog
    });

    // Extract customer IDs
    await getAllCustomersCN();
    let customerIds = await getAllCustomersCN();

    await scrapeCustomerTracking(customerIds);
    await addRefToCustomers();

    setInterval(async () => {
    await customersData(page);
    await Customer.monitorTrackingData();
    await Customer.deleteOldCustomers();
    await addRefToCustomers();
    }, 7 * 60 * 60 * 1000); // Run every 7 hours

    // Keep the browser open if you need to interact manually or close it after a certain time
    // await browser.close();
  } catch (e) {
    console.log("There is an error while scrapping the whole data");
    console.error(e);
  }
})();
