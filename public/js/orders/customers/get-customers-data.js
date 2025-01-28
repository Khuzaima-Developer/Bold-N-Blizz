const {
  extractDataWithCheerio,
  pageData,
  continuouslyCheckAndUpdateData,
} = require("./customers-extracting.js");
const {
  verifyDateInput,
  fillDateInput,
} = require("./take-out-customers.js");

/**
 * Scrapes data from two pages (if navigation is required) and logs them.
 * @param {string} url     The URL of the webpage to scrape.
 */

async function customersData(page) {
  await fillDateInput(page);

  await verifyDateInput(page);

  async function scrapeCustomers(page) {
    try {
      const nextPageBtn =
        "#app > div > div.main-content > section > div.card > div.row.mt-3.pb-2 > div > div.justify-content-center > ul > li:nth-child(4) > a";
      const isTable = "table tbody";

      // Wait for the table to be available before scraping
      await page.waitForSelector(isTable, { visible: true });

      setTimeout(async () => {
        while (true) {
          // Extract data from the current page using Cheerio
          await extractDataWithCheerio(page);
          //   await trackCustomerById()

          let dataNum = await pageData(page);

          // If next page is not available, break the loop
          if (dataNum <= 49) break;

          // Click the next page button to load the next page
          await page.click(nextPageBtn);
          // Wait for the page to load before continuing the loop
        }
      }, 1000);

      await continuouslyCheckAndUpdateData(page);
      // Log the combined data collected from all pages
    } catch (error) {
      console.error("Error occurred while scraping:", error.message);
    }
  }
  await scrapeCustomers(page);
}

module.exports = { customersData };
