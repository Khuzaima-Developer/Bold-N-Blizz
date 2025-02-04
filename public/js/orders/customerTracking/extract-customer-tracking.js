const cheerio = require("cheerio");
const puppeteer = require("puppeteer"); // Ensure puppeteer-core is properly configured
const CustomerTracking = require("../../../../models/customer-tracking.js");
const fetchWithRetry = require("../customerTracking/fetch-retries-url.js");

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
      // Fetch the existing tracking data from the database
      const existingTrackingData = await CustomerTracking.findOne({
        trackingId: customerId,
      });

      // Call the static method to update or insert the tracking data
      const hasChanged =
        !existingTrackingData ||
        existingTrackingData.date !== tracking.date ||
        existingTrackingData.details !== tracking.details ||
        existingTrackingData.location !== tracking.location ||
        existingTrackingData.status !== tracking.status;

      if (hasChanged) {
        // Update or insert the new tracking data if changes are detected
        await CustomerTracking.updateTrackings(tracking);
        console.log(`Tracking data for Customer ID ${customerId} updated.`);
      }else {
        console.log(`No changes detected for Customer ID ${customerId}.`);
      }
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

  const MAX_PARALLEL_PAGES = 5; // Reduce CPU usage
  const DELAY_BETWEEN_BATCHES = 5000; // Delay between batches

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

        const customerUrl = `https://www.mulphilog.com/tracking/${customerId}`;

        // Validate URL before navigating
        const validUrl = await fetchWithRetry(customerUrl);
        if (!validUrl) {
          console.error(
            `Skipping Customer ID ${customerId} due to invalid URL.`
          );
          return;
        }

        // **NEW: Retry logic for Puppeteer navigation**
        const maxPageRetries = 3;
        for (let attempt = 0; attempt < maxPageRetries; attempt++) {
          try {
            await page.goto(validUrl, {
              waitUntil: "domcontentloaded",
              timeout: 300000, // 300 seconds timeout
            });
            break; // Success! Break out of retry loop
          } catch (error) {
            console.error(
              `Attempt ${attempt + 1} failed for ${customerId}: ${
                error.message
              }`
            );
            if (attempt < maxPageRetries - 1) {
              console.log(
                `Retrying page load for ${customerId} in 5 seconds...`
              );
              await new Promise((resolve) => setTimeout(resolve, 5000));
            } else {
              console.error(
                `Failed to load page for ${customerId} after ${maxPageRetries} attempts.`
              );
              return; // Skip this customer
            }
          }
        }

        // Process the customer tracking data
        await customerTrackingData(page, customerId);
      } catch (error) {
        console.error(
          `Error processing Customer ID ${customerId}: ${error.message}`
        );
      } finally {
        if (page) {
          try {
            await page.close();
          } catch (err) {
            console.warn(
              `Failed to close page for Customer ID ${customerId}: ${err.message}`
            );
          }
        }
      }
    });

    await Promise.allSettled(promises);
  };

  try {
    // Process customer IDs in batches
    for (let i = 0; i < customerIds.length; i += MAX_PARALLEL_PAGES) {
      const batch = customerIds.slice(i, i + MAX_PARALLEL_PAGES);
      await processBatch(batch);
      await new Promise((resolve) =>
        setTimeout(resolve, DELAY_BETWEEN_BATCHES)
      );
    }
  } catch (error) {
    console.error("Error while processing the customer data:", error.message);
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

module.exports = { scrapeCustomerTracking, customerTrackingData };
