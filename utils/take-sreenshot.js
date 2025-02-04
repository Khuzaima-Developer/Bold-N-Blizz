const puppeteer = require("puppeteer");
const axios = require("axios");
const FormData = require("form-data");
const { PassThrough } = require("stream");

const uploadPreset = "screenshot";
const cloudName = "dwa6fadzq";
const apiKey = "742349255641615";
const apiSecret = "Sbi3um1IUY8ftbH83yPd3S9rafM";

async function takeScreenshotAndUpload(page, index) {
  try {
    // Take a screenshot and save as a buffer
    const screenshotBuffer = await page.screenshot({ fullPage: true });
    console.log("preset", uploadPreset);

    if (!screenshotBuffer) {
      throw new Error("Screenshot capture failed.");
    }
    if (!uploadPreset) {
      throw new Error("Upload preset is not defined.");
    }

    // Convert buffer to a readable stream
    const stream = new PassThrough();
    stream.end(screenshotBuffer);

    // Prepare FormData for Cloudinary upload
    const formData = new FormData();
    formData.append("file", stream, { filename: `screenshot_${index}.jpg` }); // Unique filename
    formData.append("upload_preset", uploadPreset);

    // Upload to Cloudinary
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData,
      { headers: formData.getHeaders() }
    );

    // Check if the response contains the secure_url
    if (response.data && response.data.secure_url) {
      console.log(`Uploaded Screenshot ${index}:`);
      return response.data.secure_url;
    } else {
      throw new Error("Failed to upload the screenshot to Cloudinary");
    }
  } catch (error) {
    console.error("Error during screenshot upload:", error);
    // Optionally rethrow the error to be handled further upstream
    throw error;
  }
}

function takeScreenshotsFor1Min(page) {
  let counter = 0;

  let screenshots = setInterval(() => {
    // Take screenshot every second with a unique index (counter)
    takeScreenshotAndUpload(page, counter);
    counter++;
  }, 1000);

  setTimeout(() => {
    clearInterval(screenshots); // Stop after 1 minute (60 seconds)
    console.log("Completed 1 minute of screenshots.");
  }, 30000);
}

module.exports = { takeScreenshotsFor1Min, takeScreenshotAndUpload };







// const date31DaysEarlier = getDate31DaysEarlier();
// // Selector for the date input field
// const dateSelector =
//   "#app > div > div.main-content > section > div.card > div > div:nth-child(4) > input";
// const head =
//   "#app > div > div.main-content > section > div.card > div:nth-child(1)";

// /**
//  * Calculate a date 30 days earlier than the current date.
//  * @returns {string} The date in 'YYYY-MM-DD' format.
//  */

// function getDate31DaysEarlier() {
//   const currentDate = new Date();
//   currentDate.setDate(currentDate.getDate() - 31);
//   const year = currentDate.getFullYear();
//   const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
//   const day = String(currentDate.getDate()).padStart(2, "0");
//   return `${day}-${month}-${year}`;
// }

// async function handleDialog(page) {
//   // Set a flag to track if a dialog was triggered
//   let dialogDetected = false;

//   // Listen for dialog events
//   page.on("dialog", async (dialog) => {
//     try {
//       dialogDetected = true;

//       if (!dialog.handled) {
//         await dialog.dismiss();
//         console.log("Dialog dismissed.", dialog.message());
//       }
//     } catch (error) {
//       console.error("Error handling dialog:", error.message);
//     }
//   });

//   // Check if any dialog was detected, and only proceed with dialog handling if true
//   await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second to check if any dialog has appeared
// }

// async function fillDateInput(page) {
//   await page.waitForSelector(dateSelector, { visible: true });

//   return new Promise(async (resolve, reject) => {
//     try {
//       // Simulate user interaction to set the date
//       await page.evaluate(
//         (selector, dateValue) => {
//           const input = document.querySelector(selector);
//           if (input) {
//             input.focus();
//             input.value = dateValue;
//             const inputEvent = new Event("input", { bubbles: true });
//             const changeEvent = new Event("change", { bubbles: true });
//             input.dispatchEvent(inputEvent);
//             input.dispatchEvent(changeEvent);
//           }
//         },
//         dateSelector,
//         date31DaysEarlier
//       );

//       await page.type(dateSelector, date31DaysEarlier);

//       const dateValue = await page.evaluate((selector) => {
//         const element = document.querySelector(selector);
//         return element ? element.value : "Element not found";
//       }, dateSelector); // Replace with the actual selector
//       console.log(dateValue, date31DaysEarlier);
//       console.log("fillDateInput");
//       await verifyDateInput(page);
//     } catch (error) {
//       console.error("Error in fillDateInput:", error);
//       reject(error);
//     }
//   });
// }

// /**
//  * Verify if the input[type="date"] field value matches the expected date.
//  * @param {puppeteer.Page} page - Puppeteer page object
//  */
// async function verifyDateInput(page) {
//   let currentDateValue = await page.evaluate((selector) => {
//     const input = document.querySelector(selector);
//     return input ? input.value : null; // Return the value or null if not found
//   }, dateSelector);

//   const targetURL = "https://mnpcourier.com/cplight/qsr";

//   let [year, month, day] = currentDateValue.split("-");
//   currentDateValue = `${day}-${month}-${year}`;

//   await page.waitForSelector(dateSelector, { visible: true });

//   if (currentDateValue !== date31DaysEarlier) {
//     console.log("Date mismatch. Navigating to reset the page...");
//     await page.goto(targetURL, { waitUntil: "load" });
//     await fillDateInput(page);
//   }
//   await page.click(
//     "#app > div > div.main-content > section > div.card > div > div:nth-child(8) > button"
//   );
//   await handleDialog(page);
//   console.log("verifyDateInput");
// }