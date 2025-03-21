const { extractCustomersData, pageData } = require("./customers-extracting.js");
const { fillDateInput } = require("./take-out-customers.js");

/**
 * Scrapes data from two pages (if navigation is required) and logs them.
 * @param {string} url     The URL of the webpage to scrape.
 */

async function customersData(page) {
  try {
    await fillDateInput(page);

    async function scrapeCustomers(page) {
      try {
        const isTable = "table tbody";
        const findTable = await page
          .waitForSelector(isTable, { timeout: 30 * 1000 })
          .catch(() => null);

        if (!findTable) {
          console.log("⚠️ Table not found! Retrying...");
          setTimeout(async () => {
            await fillDateInput(page); // Refill the date input
            return await scrapeCustomers(page); // Retry scraping
          }, 5 * 1000);
        }

        // Wait for the table to be available before scraping
        await page.waitForSelector(
          isTable,
          { visible: true },
          { timeout: 60 * 1000 }
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));

        while (true) {
          // Extract data from the current page using Cheerio
          await extractCustomersData(page);
          //   await trackCustomerById()

          let dataNum = await pageData(page, initialData, totalData);

          // If next page is not available, break the loop
          if (dataNum <= 49) break;

          // Click the next page button to load the next page
          await page.click(nextPageBtn);
          console.log("more data loaded");
          // Wait for the page to load before continuing the loop
        }
        // Log the combined data collected from all pages
        console.log("Customers data founded");
      } catch (error) {
        console.error("Error occurred while scraping:", error.message);
        await page.reload({ waitUntil: "networkidle2" });
      }
    }
    await scrapeCustomers(page);
  } catch (error) {
    console.error(
      "Error occurred while getting customers data:",
      error.message
    );
  }
}

module.exports = { customersData };
