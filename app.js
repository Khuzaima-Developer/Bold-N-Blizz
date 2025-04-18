require("./public/js/orders/orders-var.js");

// env function
if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

//variables
const express = require("express");
const app = express();
const ejsMate = require("ejs-mate");
const path = require("path");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");

// require pages
const ExpressError = require("./utils/error-handler/ExpressError.js");
const {
  userActivityDetected,
  scheduleScrape,
} = require("./public/js/orders/updates/scrape-execution.js");
const Timer = require("./models/timer.js");

// port
let port = process.env.PORT;
const DbUrl = process.env.ATLAS_DB_URL;

// route variables
const ordersPath = require("./routes/orders.js");

async function main() {
  await mongoose.connect(DbUrl, {
    tlsAllowInvalidCertificates: true,
    serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
    socketTimeoutMS: 45000,
    timeoutMS: 20 * 60 * 1000,
  });
}

main() // call the main function to connect to MongoDB
  .then(() => {
    console.log("Connected to MongoDB!");
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB!");
    console.error(error); // Log the actual error for debugging
  });

let store = MongoStore.create({
  mongoUrl: DbUrl,
  crypto: {
    secret: process.env.SESSION_SECRET_KEY,
  },
  touchAfter: 24 * 60 * 60,
});

store.on("error", function (e) {
  console.error("Session Store Error", e);
});

// session options
let sessionOptions = {
  store,
  secret: process.env.SESSION_SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

// use methods
app.use(express.static(path.join(__dirname, "/public")));
app.use("/utils", express.static(path.join(__dirname, "/utils")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.json());
app.use(session(sessionOptions));
app.use(flash());

// set methods
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

// engine methods
app.engine("ejs", ejsMate);

// Listen method
app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});

// res.locals
app.use(async (req, res, next) => {
  const dataTimer = await Timer.findOne({ name: "scrapeAllData" });
  if (!dataTimer || !dataTimer.updatedTime) {
    res.locals.remainingTime = "The data isn't updated yet"; // Default value if no data
    return next();
  }
  const updateTime = new Date(dataTimer.updatedTime);
  const isRunning = dataTimer.running;
  const timer = new Date(dataTimer.timer);

  res.locals.timer = timer;
  res.locals.isRunning = isRunning;
  res.locals.updatedTime = updateTime; // Use the timer function
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use("/orders", async (req, res, next) => {
  try {
    const now = Date.now();
    const lastActivity = await Timer.findOne({ name: "InactiveTime" });

    if (lastActivity) {
      const inActiveTime = now - lastActivity.timer;

      if (inActiveTime > 6 * 60 * 60 * 1000) {
        req.session.updated = true;

        await Timer.findOneAndUpdate(
          { name: "InactiveTime" },
          { timer: now },
          { upsert: true }
        );

        return res.redirect("/orders/update-data"); // RETURN TO END
      }
    }

    await Timer.findOneAndUpdate(
      { name: "InactiveTime" },
      { timer: now },
      { upsert: true }
    );

    next(); // only if no redirect
  } catch (err) {
    console.error("Middleware error:", err);
    next(err);
  }
});

scheduleScrape();

// routes
app.use("/orders", ordersPath);

// Page not found method
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page not found!"));
});

// custom error  styling method
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something Went Wrong" } = err;
  res.status(statusCode).render("error.ejs", { err });
});
