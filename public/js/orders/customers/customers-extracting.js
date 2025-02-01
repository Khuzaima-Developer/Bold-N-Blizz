const cheerio = require("cheerio");
const CustomerTracking = require("../../../../models/customer-tracking.js");
const Customer = require("../../../../models/customers.js");

/**
 * Extract data using Cheerio from the page's HTML content.
 * @param {Page} page - Puppeteer page object.
 * @returns {Array<string>} - Array of extracted text data.
 */

async function addRefToCustomers() {
  try {
    // Fetch all Customers
    const customers = await Customer.find({});

    // Loop through each customer
    for (const customer of customers) {
      // Find the corresponding CustomerTracking entries using the CN
      const existingTrackings = await CustomerTracking.find({
        trackingId: customer.CN,
      });

      // Add trackingId to each Customer document if matching CustomerTracking exists
      for (const tracking of existingTrackings) {
        if (tracking.trackingId === customer.CN) {
          // Add refId (trackingId) from CustomerTracking to Customer document
          customer.trackingId = tracking._id;

          // Save the updated Customer document
          await customer.save();
        }
      }
    }
    console.log("Add ref to customers");
  } catch (error) {
    console.error("Error adding references to customers:", error.message);
  }
}

let rowTexts = [];
async function extractDataWithCheerio(page) {
  if (!page || typeof page.content !== "function") {
    throw new Error(
      "Invalid Puppeteer page object passed to extractDataWithCheerio"
    );
  }

  // Extract HTML content from the Puppeteer page
  const html = await page.content();
  const $ = cheerio.load(html);

  $("table tbody tr").each((_, element) => {
    let CN = $(element).find("td:nth-child(2) span").text().trim();
    let bookingDate = $(element).find("td:nth-child(5)").text().trim();
    let consignee = $(element).find("td:nth-child(9)").text().trim();
    let dest = $(element).find("td:nth-child(13)").text().trim();
    let status = $(element).find("td:nth-child(20)").text().trim();
    let consigneePH = $(element).find("td:nth-child(10)").text().trim();
    let destBR = $(element).find("td:nth-child(14)").text().trim();
    let deliveryTime = $(element).find("td:nth-child(18)").text().trim();
    let COD = +$(element).find("td:nth-child(19)").text().trim();
    let reason = $(element).find("td:nth-child(21)").text().trim();
    let totalAmount = +$(element).find("td:nth-child(25)").text().trim();
    let gst = +$(element).find("td:nth-child(26)").text().trim();
    let attempts = +$(element).find("td:nth-child(27)").text().trim();

    if (CN || bookingDate || consignee || dest) {
      rowTexts.push({
        CN: CN, // Fallback to "N/A" if data is missing
        consignee: consignee,
        consigneePH: consigneePH,
        booking: bookingDate,
        dest: dest,
        destBR: destBR,
        status: status, // Fallback to "N/A" if data is missing
        reason: reason,
        attempts: attempts,
        deliveryTime: deliveryTime,
        COD: COD,
        totalAmount: totalAmount,
        gst: gst,
      });
    }
  });

  await Customer.newUpdateCustomers(rowTexts);
  addRefToCustomers();
  // Log for debugging purposes
  if (rowTexts.length === 0) {
    console.log("No rows extracted from the table.");
  }

  // Always return an array, even if it's empty
  return rowTexts;
}

async function continuouslyCheckAndUpdateData(page) {
  // Check data every 1 minute (60000 milliseconds)
  setInterval(async () => {
    await extractDataWithCheerio(page);
  }, 6000000); // You can adjust the interval as needed (e.g., every 1 minute)

  // If you want to run the first extraction immediately
  await extractDataWithCheerio(page);
}

async function pageData(page) {
  // Extract HTML content from the Puppeteer page
  const html = await page.content();

  // Load the HTML into Cheerio
  const $ = cheerio.load(html);

  const initialData =
    "#app > div > div.main-content > section > div.card > div.row.mt-3.pb-2 > div > div.justify-content-center > div:nth-child(3) > span:nth-child(1)";
  const totalData =
    "#app > div > div.main-content > section > div.card > div.row.mt-3.pb-2 > div > div.justify-content-center > div:nth-child(3) > span:nth-child(3)";
  const initialDataText = $(initialData).text().trim();
  const totalDataText = $(totalData).text().trim();

  const pageData = parseInt(totalDataText) - parseInt(initialDataText);

  return pageData;
}

async function getAllCustomersCN() {
  try {
    // Fetch all customers' consignment numbers (CN)
    const customers = await Customer.find({}, "CN"); // Only retrieve CN field

    // Map the CN to a new array
    const customerIds = customers.map((customer) => customer.CN);
    return customerIds; // Return the array of all consignment numbers
  } catch (error) {
    console.error("Error fetching customer consignment numbers:", error);
    return []; // Return an empty array in case of error
  }
}

module.exports = {
  extractDataWithCheerio,
  pageData,
  getAllCustomersCN,
  continuouslyCheckAndUpdateData,
  addRefToCustomers,
};
