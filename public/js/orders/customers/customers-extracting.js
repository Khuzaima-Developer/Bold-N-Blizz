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
        // Find the customer where trackingId is missing and CN matches trackingId
        const noTracking = await Customer.findOne({
          trackingId: { $exists: false },
          CN: tracking.trackingId,
        });

        if (noTracking) {
          // Add trackingId to customer
          customer.trackingId = tracking._id;
          await customer.save();
          console.log(
            `Tracking ID ${tracking._id} added to Customer ${customer.CN}`
          );
        }
      }
    }
  } catch (error) {
    console.error("Error adding references to customers:", error.message);
  }
}

async function extractCustomersData(page) {
  if (!page) {
    console.error(
      "❌ Invalid Puppeteer page object passed to extractCustomersData"
    );
    return []; // Return empty array instead of throwing an error
  }

  try {
    // ✅ Ensure the table is loaded
    await page.waitForSelector("table tbody tr", { timeout: 60 * 1000 });

    const extractedData = await page.evaluate(() => {
      let rowTexts = [];

      document.querySelectorAll("table tbody tr").forEach((row) => {
        const columns = row.children;
        const getText = (el) => (el ? el.innerText.trim() : "N/A");

        const customerData = {
          CN: getText(columns[1]?.querySelector("span")),
          consignee: getText(columns[8]) || "N/A", // ✅ Prevent empty values
          consigneePH: getText(columns[9]) || "N/A",
          booking: getText(columns[4]) || "N/A",
          dest: getText(columns[12]) || "N/A",
          destBR: getText(columns[13]) || "N/A",
          status: getText(columns[19]) || "N/A",
          reason: getText(columns[20]) || "N/A",
          attempts: Number(getText(columns[26])) || 0,
          deliveryTime: getText(columns[17]) || "N/A",
          COD: Number(getText(columns[18])) || 0,
          totalAmount: Number(getText(columns[24])) || 0,
          gst: Number(getText(columns[25])) || 0,
        };

        rowTexts.push(customerData);
      });

      return rowTexts;
    });

    let rowTexts = [...extractedData]; // ✅ Ensure rowTexts is properly defined

    // ✅ Filter out invalid customers (extra safeguard)
    rowTexts = rowTexts.filter(
      (c) =>
        c.consignee !== "N/A" &&
        c.consigneePH !== "N/A" &&
        c.dest !== "N/A" &&
        c.destBR !== "N/A" &&
        c.booking !== "N/A"
    );

    // ✅ Try to update customers
    try {
      if (rowTexts.length > 0) {
        await Customer.newUpdateCustomers(rowTexts);
        addRefToCustomers();
      } else {
        console.warn("⚠️ No valid customer data to update.");
      }
    } catch (dbError) {
      console.error("❌ Error updating customers:", dbError);
    }

    return rowTexts;
  } catch (error) {
    console.error("❌ Error extracting customer data:", error);
    return []; // ✅ Return an empty array on error
  }
}

async function pageData(page, initialDataSelector, totalDataSelector) {
  return await page.evaluate(
    (initialSel, totalSel) => {
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.innerText.trim() : "0"; // Default to "0" if not found
      };

      const initialDataText = getText(initialSel);
      const totalDataText = getText(totalSel);

      return parseInt(totalDataText) - parseInt(initialDataText);
    },
    initialDataSelector,
    totalDataSelector
  );
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
  extractCustomersData,
  pageData,
  getAllCustomersCN,
  addRefToCustomers,
};
