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

  const MAX_PARALLEL_PAGES = 10;

  // Define the batch processing function
  const processBatch = async (batch) => {
    const promises = batch.map(async (customerId) => {
      let page;
      try {
        page = await browser.newPage(); // Create a new page

        // Improve performance by blocking unnecessary requests
        await page.setRequestInterception(true);
        page.on("request", (request) => {
          const resourceType = request.resourceType();
          if (["image", "stylesheet", "font"].includes(resourceType)) {
            request.abort();
          } else {
            request.continue();
          }
        });

        // Navigate to the tracking page
        await page.goto(`https://www.mulphilog.com/tracking/${customerId}`, {
          waitUntil: "networkidle0",
          timeout: 120000, // Reasonable timeout
        });

        // Process the customer tracking data
        await customerTrackingData(page, customerId);
      } catch (error) {
        console.error(
          `Error processing Customer ID ${customerId}:`,
          error.message
        );
      } finally {
        // Ensure the page is closed properly
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

    await Promise.all(promises); // Wait for all promises to complete
  };

  try {
    // Process customer IDs in batches
    for (let i = 0; i < customerIds.length; i += MAX_PARALLEL_PAGES) {
      const batch = customerIds.slice(i, i + MAX_PARALLEL_PAGES);
      await processBatch(batch); // Process each batch
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Add a 1-second delay between batches
    }
  } catch (error) {
    console.error(
      "There is an error while processing the customer data:",
      error.message
    );
  } finally {
    // Close the browser after all batches are processed
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
