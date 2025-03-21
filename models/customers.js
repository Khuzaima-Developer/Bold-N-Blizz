const mongoose = require("mongoose");
const Schema = mongoose.Schema;
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
  } catch (err) {
    console.error("Error deleting old customers:", err);
    throw err;
  }
}; // Correct method name

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;
