const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const axios = require("axios");
const https = require("https");
const agent = new https.Agent({
  rejectUnauthorized: false, // Disable SSL certificate validation
});

let customerTrackingSchema = new Schema({
  trackingId: {
    type: String,
    required: true,
    unique: true,
  },
  date: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    Default: "Not Defined",
  },
  status: {
    type: String,
    default: "Pending",
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
});

customerTrackingSchema.statics.updateTrackings = async function (tracking) {
  try {
    if (!tracking || !tracking.trackingId) {
      throw new Error("Invalid tracking data or missing trackingId.");
    }

    const existingCustomer = await this.findOne({
      trackingId: tracking.trackingId,
    });

    if (existingCustomer) {
      // Check if an update is necessary
      let needsUpdate = false;
      const updatedData = { ...existingCustomer.toObject() };

      // Compare fields in the tracking data
      for (const key in tracking) {
        if (key === "trackingId") continue; // Skip the trackingId field

        // If the new value differs from the existing value, mark for update
        if (tracking[key] !== existingCustomer[key]) {
          updatedData[key] = tracking[key];
          needsUpdate = true;
        }
      }

      // Reset the `updatedAt` field to the current time if any changes are detected
      if (needsUpdate) {
        updatedData.updatedAt = Date.now();
        await this.updateOne(
          { trackingId: tracking.trackingId },
          { $set: updatedData }
        );
        console.log(`Tracking ID ${tracking.trackingId} updated successfully.`);
      }
    } else {
      // Create a new document if it doesn't exist
      await this.create({
        trackingId: tracking.trackingId,
        date: tracking.date || "N/A",
        details: tracking.details || "N/A",
        location: tracking.location || "N/A",
        status: tracking.status || "N/A",
        updatedAt: Date.now(),
      });
      console.log(`Tracking ID ${tracking.trackingId} created successfully.`);
    }
  } catch (err) {
    console.error("Error updating tracking:", err.message);
    throw err;
  }
};



const CustomerTracking = mongoose.model(
  "CustomerTracking",
  customerTrackingSchema
);

module.exports = CustomerTracking;
