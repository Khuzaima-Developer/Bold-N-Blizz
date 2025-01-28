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

customerTrackingSchema.statics.monitorTrackingData = async function (
  batchSize = 10,
  delay = 5000
) {
  try {
    // Fetch all tracking IDs
    const allTrackingData = await this.find({}, "trackingId").lean();
    const trackingIds = allTrackingData.map((data) => data.trackingId);

    // Check if tracking IDs exist
    if (trackingIds.length === 0) {
      console.log("No tracking IDs found.");
      return;
    }

    // Process in batches
    for (let i = 0; i < trackingIds.length; i += batchSize) {
      const batch = trackingIds.slice(i, i + batchSize);

      const batchPromises = batch.map(async (trackingId) => {
        try {
          // Fetch tracking data with a custom HTTPS agent
          const response = await axios.get(
            `https://www.mulphilog.com/tracking/${trackingId}`,
            { httpsAgent: agent }
          );

          const newTrackingData = response.data;

          // Fetch the existing tracking data
          const existingTrackingData = await this.findOne({
            trackingId,
          }).lean();

          // Check if data has changed
          const hasChanged =
            !existingTrackingData ||
            existingTrackingData.Date !== newTrackingData.Date ||
            existingTrackingData.Details !== newTrackingData.Details ||
            existingTrackingData.Location !== newTrackingData.Location ||
            existingTrackingData.Status !== newTrackingData.Status;

          if (hasChanged) {
            // Update the data if there are changes
            await this.updateOne(
              { trackingId },
              {
                $set: {
                  Date: newTrackingData.Date,
                  Details: newTrackingData.Details,
                  Location: newTrackingData.Location || "Not Defined", // Default location
                  Status: newTrackingData.Status,
                  updatedAt: Date.now(),
                },
              },
              { upsert: true } // Insert if not found
            );
            console.log(
              `Tracking data for ID ${trackingId} updated successfully.`
            );
          }
        } catch (error) {
          console.error(
            `Error fetching or updating data for tracking ID ${trackingId}: ${error.message}`
          );
        }
      });

      // Wait for all promises in the batch to complete
      await Promise.all(batchPromises);

      // Introduce a delay between batches
      if (i + batchSize < trackingIds.length) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    console.log("monitorTrackingData process completed successfully.");
  } catch (error) {
    console.error("Error in monitorTrackingData:", error.message);
  }
};

const CustomerTracking = mongoose.model(
  "CustomerTracking",
  customerTrackingSchema
);

module.exports = CustomerTracking;
