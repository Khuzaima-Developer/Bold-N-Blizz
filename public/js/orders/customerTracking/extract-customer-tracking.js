const cheerio = require("cheerio");
const puppeteer = require("puppeteer"); // Ensure puppeteer-core is properly configured
const CustomerTracking = require("../../../../models/customer-tracking.js");

/**
 * Extract data using Cheerio from the page's HTML content.
 * @param {Page} page - Puppeteer page object.
 * @returns {Array<string>} - Array of extracted text data.
 */
async function customerTrackingData(page, customerId) {
  if (!page || typeof page.content !== "function") {
    throw new Error(
      "Invalid Puppeteer page object passed to customerTrackingData."
    );
  }

  const html = await page.content(); // Get the page content
  const $ = cheerio.load(html); // Load the content with Cheerio

  const lastTrack =
    "body > section.innerTracking > div > div.traking-table.mn-hd > div.shipment > table > tbody > tr:nth-child(2)";

  // Extract data from the tracking table
  const trackingDate = $(lastTrack).find("td:nth-child(1)").text().trim();
  const trackingDetail = $(lastTrack).find("td:nth-child(2)").text().trim();
  const trackingLocation = $(lastTrack).find("td:nth-child(3)").text().trim();
  const trackingStatus = $(lastTrack).find("td:nth-child(4)").text().trim();

  if (trackingDate || trackingDetail || trackingLocation || trackingStatus) {
    const tracking = {
      trackingId: customerId || "N/A",
      date: trackingDate || "N/A",
      details: trackingDetail || "N/A",
      location: trackingLocation || "N/A",
      status: trackingStatus || "N/A",
    };

    try {
      // Call the static method to update or insert the tracking data
      await CustomerTracking.updateTrackings(tracking);
    } catch (error) {
      console.error(
        `Error saving tracking data for Customer ID ${customerId}:`,
        error.message
      );
    }

    return tracking; // Return the tracking object
  } else {
    return null; // Return null if no tracking data was found
  }
}

/**
 * Scrape customer tracking data in batches to optimize the process.
 * @param {Array<string>} customerIds - Array of customer IDs to scrape.
 */

async function scrapeCustomerTracking(customerIds) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  const MAX_PARALLEL_PAGES = 5; // Reduce the parallel pages for lower CPU usage
  const DELAY_BETWEEN_BATCHES = 5000; // Add a longer delay between batches

  const processBatch = async (batch) => {
    const promises = batch.map(async (customerId) => {
      let page;
      try {
        page = await browser.newPage();

        // Block unnecessary requests to save CPU and bandwidth
        await page.setRequestInterception(true);
        page.on("request", (request) => {
          const resourceType = request.resourceType();
          if (["image", "stylesheet", "font"].includes(resourceType)) {
            request.abort();
          } else {
            request.continue();
          }
        });

        // Load the tracking page with a reasonable timeout
        await page.goto(`https://www.mulphilog.com/tracking/${customerId}`, {
          waitUntil: "domcontentloaded",
          timeout: 60000, // Shorter timeout to prevent stuck tasks
        });

        // Process the customer tracking data
        await customerTrackingData(page, customerId);
      } catch (error) {
        console.error(
          `Error processing Customer ID ${customerId}:`,
          error.message
        );
      } finally {
        if (page) {
          try {
            await page.close();
          } catch (err) {
            console.warn(
              `Failed to close page for Customer ID ${customerId}:`,
              err.message
            );
          }
        }
      }
    });

    // Use Promise.allSettled to ensure all tasks complete, even if some fail
    await Promise.allSettled(promises);
  };

  try {
    // Process customer IDs in batches
    for (let i = 0; i < customerIds.length; i += MAX_PARALLEL_PAGES) {
      const batch = customerIds.slice(i, i + MAX_PARALLEL_PAGES);
      await processBatch(batch);

      // Add delay to reduce CPU load further
      await new Promise((resolve) =>
        setTimeout(resolve, DELAY_BETWEEN_BATCHES)
      );
    }
  } catch (error) {
    console.error(
      "There is an error while processing the customer data:",
      error.message
    );
  } finally {
    try {
      await browser.close();
      console.log("Browser closed successfully.");
    } catch (err) {
      console.warn("Error while closing the browser:", err.message);
    }
    console.log("scrapeCustomerTracking complete.");
  }
}

// Example: Mock `customerTrackingData` function

module.exports = scrapeCustomerTracking;
