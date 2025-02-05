const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const fetchWithRetry = require("../public/js/orders/customerTracking/fetch-retries-url.js");
const puppeteer = require("puppeteer");
const {
  customerTrackingData,
} = require("../public/js/orders/customerTracking/extract-customer-tracking.js");
const { launchBrowser } = require("../public/js/orders/launch-browser.js");

// Define customer schema

const customerSchema = new Schema({
  CN: {
    type: String,
    required: true,
    unique: true,
  },
  consignee: {
    type: String,
    required: true,
  },
  consigneePH: {
    type: String,
    required: true,
  },
  dest: {
    type: String,
    required: true,
  },
  destBR: {
    type: String,
    required: true,
  },
  booking: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "Pending",
  },
  reason: {
    type: String,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  deliveryTime: {
    type: String,
  },
  COD: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
  gst: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
  trackingId: {
    type: Schema.Types.ObjectId,
    ref: "CustomerTracking",
  },
});

// Assign static methods to schema
// customerSchema.statics.updateCustomers = async function (customers) {
//   try {
//     for (const customerData of customers) {
//       const existingCustomer = await this.findOne({ CN: customerData.CN });

//       if (existingCustomer) {
//         // Compare fields and determine if an update is necessary
//         let needsUpdate = false;
//         const updatedData = { ...existingCustomer.toObject() };

//         // Check for data changes or new fields
//         for (const key in customerData) {
//           if (key === "CN") continue; // Skip the CN field as it acts as the identifier

//           // If the field is different, mark for update and update the field
//           if (customerData[key] !== existingCustomer[key]) {
//             updatedData[key] = customerData[key];
//             needsUpdate = true;
//           }
//         }

//         // If there are changes, update the document
//         if (needsUpdate) {
//           await this.updateOne(
//             { CN: customerData.CN },
//             {
//               $set: {
//                 consignee: customerData.consignee,
//                 consigneePH: customerData.consigneePH,
//                 dest: customerData.dest,
//                 destBR: customerData.destBR,
//                 booking: customerData.booking,
//                 status: customerData.status,
//                 reason: customerData.reason,
//                 attempts: customerData.attempts,
//                 deliveryTime: customerData.deliveryTime,
//                 COD: customerData.COD,
//                 totalAmount: customerData.totalAmount,
//                 gst: customerData.gst,
//                 updatedAt: Date.now(), // Reset the updatedAt field to the current time
//               },
//             }
//           );
//           console.log("updated from updateCustomers");
//         }
//       } else {
//         // Insert a new document if it doesn't exist
//         await this.create({
//           CN: customerData.CN,
//           consignee: customerData.consignee,
//           consigneePH: customerData.consigneePH,
//           dest: customerData.dest,
//           destBR: customerData.destBR,
//           booking: customerData.booking,
//           status: customerData.status,
//           reason: customerData.reason,
//           attempts: customerData.attempts,
//           deliveryTime: customerData.deliveryTime,
//           COD: customerData.COD,
//           totalAmount: customerData.totalAmount,
//           gst: customerData.gst,
//           updatedAt: Date.now(), // Set the current time as the creation time
//         });
//       }
//     }
//   } catch (err) {
//     console.error("Error updating customers:", err);
//     throw err;
//   }
// };

customerSchema.statics.newUpdateCustomers = async function (dataArray) {
  if (!Array.isArray(dataArray)) {
    throw new Error("Input data must be an array of objects.");
  }

  try {
    for (const data of dataArray) {
      // Find the existing customer based on CN
      const existingCustomer = await this.findOne({ CN: data.CN });

      if (existingCustomer) {
        // Check if there are any changes to the fields
        const mismatchedFields = Object.keys(data).filter((key) => {
          if (key !== "CN" && existingCustomer[key] !== data[key]) {
            return true;
          }
          return false;
        });

        const isUpdated = mismatchedFields.length > 0;

        if (isUpdated) {
          // Only update fields that have changed
          await Customer.findOneAndUpdate(
            { CN: existingCustomer.CN }, // Query to find the customer
            {
              $set: { ...data, updatedAt: new Date() }, // Set the new data along with the updatedAt
            },
            { new: true, upsert: false } // Update or return the updated document without creating a new one
          );
          console.log(`Customer updated ${existingCustomer.CN}`);
        }
      } else {
        // Create a new customer if the CN doesn't exist
        const newCustomer = new this(data);
        await newCustomer.save();
        console.log(`Created new customer ${newCustomer.CN}`);
      }
    }
  } catch (error) {
    console.error(`Error in newUpdateCustomers: ${error.message}`);
    // Don't throw error, instead log it, to prevent app crash
  }
};

// Static method to delete old customers
customerSchema.statics.deleteOldCustomers = async function () {
  try {
    // Fetch all customers
    const customers = await this.find({});

    // Get today's date (for calculation purposes, using UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Normalize to midnight UTC

    // Iterate over each customer and process the 'booking' field
    for (const customer of customers) {
      // Parse the 'booking' field (e.g., '10 Jan 2024') into a Date object
      const [day, month, year] = customer.booking.split(" ");
      const bookingDate = new Date(`${month} ${day} ${year} UTC`); // Parse as UTC

      // Calculate the cutoff date (31 days ago from today)
      const cutoffDate = new Date(today);
      cutoffDate.setDate(today.getDate() - 31); // 31 days ago from today

      // Check if the booking date is older than the cutoff date
      if (bookingDate < cutoffDate) {
        // Delete the customer if the booking is older than the cutoff date
        await this.deleteOne({ _id: customer._id });
        console.log(`Deleted old customer with CN: ${customer.CN}`);
      }
    }
    console.log("Old customer deleted successfully");
  } catch (err) {
    console.error("Error deleting old customers:", err);
    throw err;
  }
}; // Correct method name

customerSchema.statics.monitorTrackingData = async function (
  browser,
  batchSize = 1,
  delay = 2000
) {
  let page = await browser.newPage();
  try {
    const CNs = await this.aggregate([{ $group: { _id: "$CN" } }]);

    if (!CNs.length) {
      console.log("No tracking IDs found.");
      return;
    }

    // Process tracking IDs in batches
    for (let i = 0; i < CNs.length; i += batchSize) {
      const batch = CNs.slice(i, i + batchSize);

      for (const CNObj of batch) {
        const CN = CNObj._id; // Extract the CN value from the group

        try {
          const trackingDataUrl = `https://www.mulphilog.com/tracking/${CN}`;
          if (page.isClosed()) {
            console.log("Page was closed, skipping extraction.");
            await browser.newPage();
          }

          // Navigate to the tracking page and wait until the page is fully loaded
          await page.goto(trackingDataUrl, {
            waitUntil: "domcontentloaded",
            timeout: 60000, // Timeout after 1 minute if the page doesn't load
          });
          await customerTrackingData(page, CN);
        } catch (err) {
          console.error(`Error processing tracking ID ${CN}: ${err.message}`);
        }
      }

      // Introduce a delay between batches
      if (i + batchSize < CNs.length) {
        await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before processing the next batch
      }
    }

    console.log("monitorTrackingData process completed.");
  } catch (err) {
    console.error("Error in monitorTrackingData:", err.message);
  } finally {
    // Close the browser after the process is completed
    await browser.close();
  }
};

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;
