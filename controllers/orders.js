// Require dependencies
const ExpressError = require("../utils/error-handler/ExpressError.js");
const Customer = require("../models/customers.js");
const CustomerTracking = require("../models/customer-tracking.js");
const moment = require("moment");
const {
  monthEarlierDate,
  formatDate,
} = require("../public/js/orders/customers/take-out-customers.js");

const startDate = monthEarlierDate();
const endDate = formatDate(new Date());

module.exports.deliveredOrders = async (req, res, next) => {
  try {
    // Fetch orders with status "D-DELIVERED" and expand the tracking reference
    const deliveredOrders = await Customer.find({
      status: "D-DELIVERED",
    }).populate("trackingId");

    if (!deliveredOrders || deliveredOrders.length === 0) {
      console.log("No delivered orders found.");
      return res.render("pages/delivered-orders.ejs", { deliveredOrders: [] });
    }

    const total = deliveredOrders.length;

    res.render("pages/delivered-orders.ejs", {
      deliveredOrders,
      startDate,
      endDate,
      total,
    });
  } catch (error) {
    console.error(
      "An error occurred while processing delivered orders:",
      error
    );
    next(new ExpressError("Failed to retrieve delivered orders.", 500)); // Pass the error to the global error handler
  }
};

module.exports.returnedOrders = async (req, res, next) => {
  try {
    // Fetch orders with status "D-RETURNED" and expand the tracking reference
    const returnedOrders = await Customer.find({
      status: "RS-Return to Shipper",
    }).populate("trackingId");

    if (!returnedOrders || returnedOrders.length === 0) {
      return res.render("pages/returned-orders.ejs", { returnedOrders: [] });
    }

    const total = returnedOrders.length;

    res.render("pages/returned-orders.ejs", {
      returnedOrders,
      startDate,
      endDate,
      total,
    });
  } catch (e) {
    console.error("An error occurred while processing returned orders:", e);
    next(new ExpressError("Failed to retrieve returned orders.", 500)); // Pass the error to the global error handler
  }
};

function parseDate(dateString) {
  let [day, month, year] = dateString.split(" ");
  let parsedDate = new Date(`${month} ${day} ${year}`);
  parsedDate.setUTCHours(0, 0, 0, 0); // Normalize to midnight UTC
  return parsedDate;
}

module.exports.bookings = async (req, res, next) => {
  try {
    // Get today's date and normalize to midnight UTC
    let today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Calculate the cutoff date (3 days ago)
    let cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - 3);

    // Fetch all customers
    let customers = await Customer.find({});
    let earlier3Days = formatDate(cutoffDate);

    // Filter customers based on booking dates and exclude certain statuses
    let bookingOrders = customers.filter((customer) => {
      let bookingDate = parseDate(customer.booking);
      let status = customer.status;
      return (
        bookingDate > cutoffDate &&
        bookingDate < today &&
        status !== "D-DELIVERED" &&
        status !== "RS-Return to Shipper"
      );
    });

    // Render filtered customers in EJS
    res.render("pages/bookings.ejs", {
      bookingOrders,
      earlier3Days,
      endDate,
      total: bookingOrders.length,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).send("Error fetching bookings.");
  }
};

module.exports.undelivers = async (req, res, next) => {
  try {
    // Get today's date and normalize to midnight UTC
    let today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Calculate the cutoff date (3 days ago)
    let cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - 2);

    // Fetch all customers
    let customers = await Customer.find({});

    // Filter customers based on booking dates and exclude certain statuses
    let undeliverOrders = customers.filter((customer) => {
      let bookingDate = parseDate(customer.booking);
      let status = customer.status;
      return (
        bookingDate < cutoffDate &&
        status !== "D-DELIVERED" &&
        status !== "RS-Return to Shipper"
      );
    });

    // Render filtered customers in EJS
    res.render("pages/undeliver.ejs", {
      undeliverOrders,
      startDate,
      endDate,
      total: undeliverOrders.length,
    });
  } catch (error) {
    console.error("Error fetching undeliver orders:", error);
    res.status(500).send("Error fetching bookings.");
  }
};

module.exports.dailyUpdates = async (req, res, next) => {
  try {
    // Define the date range for 1 day ago
    function todayDateWithInitialTime() {
      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0]; // Format as YYYY-MM-DD
      const initialTime = "00:00:00"; // Initial time
      let dateString = `${formattedDate}T${initialTime}`;
      // Create a Date object from the string
      const date = new Date(dateString);
      // Adjust the time to ensure it's 00:00:00 in the local timezone
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

      return date;
    }

    const todayDate = todayDateWithInitialTime();

    // Perform the aggregation
    const dailyUpdates = await Customer.aggregate([
      {
        $lookup: {
          from: "customertrackings", // Reference to the CustomerTracking collection
          localField: "trackingId", // Field in the Customer model
          foreignField: "_id", // Field in the CustomerTracking model
          as: "trackingDetails", // Join result in trackingDetails array
        },
      },
      {
        $match: {
          $or: [
            { updatedAt: { $gte: todayDate } }, // Customers updated in the last 1 day
            { "trackingDetails.updatedAt": { $gte: todayDate } }, // Associated tracking updated
          ],
        },
      },
    ]);

    // Render the EJS view and pass the data
    res.render("pages/daily-updates.ejs", {
      dailyUpdates,
      startDate,
      endDate,
      total: dailyUpdates.length,
    });
  } catch (e) {
    console.error("An error occurred while processing daily updates:", e);
    next(new ExpressError("Failed to retrieve daily updates.", 500)); // Pass the error to the global error handler
  }
};
