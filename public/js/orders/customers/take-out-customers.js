const puppeteer = require("puppeteer");

const dateSelector =
  "#app > div > div.main-content > section > div.card > div > div:nth-child(4) > input";
const submitButton =
  "#app > div > div.main-content > section > div.card > div > div:nth-child(8) > button";

const isLocal = !process.env.NODE_ENV || process.env.NODE_ENV === "development";

/**
 * Calculate a date 31 days earlier than the current date.
 * @returns {string} The date in 'YYYY-MM-DD' format.
 */
function getDate31DaysEarlier() {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - 31);
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(currentDate.getDate()).padStart(2, "0");
  return `${day}-${month}-${year}`;
}

function getDeployment31DaysEarlier() {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - 31);
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(currentDate.getDate()).padStart(2, "0");
  return `${month}-${day}-${year}`;
}

async function handleDialog(page) {
  // Set a flag to track if a dialog was triggered
  let dialogDetected = false;

  // Listen for dialog events
  page.on("dialog", async (dialog) => {
    try {
      dialogDetected = true; // Set flag to true when a dialog is detected
      console.log("Dialog detected:", dialog.message());

      if (!dialog.handled) {
        await dialog.dismiss();
        console.log("Dialog dismissed.", dialog.message());
      }
    } catch (error) {
      console.error("Error handling dialog:", error.message);
    }
  });

  // Check if any dialog was detected, and only proceed with dialog handling if true
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second to check if any dialog has appeared
}

async function verifyDateInput(page) {
  await handleDialog(page);
  let date31DaysEarlier = getDate31DaysEarlier();
  let currentDateValue = await page.evaluate((selector) => {
    const input = document.querySelector(selector);
    return input ? input.value : null; // Return the value or null if not found
  }, dateSelector);

  const targetURL = "https://mnpcourier.com/cplight/qsr";

  let [year, month, day] = currentDateValue.split("-");
  currentDateValue = `${day}-${month}-${year}`;

  await page.waitForSelector(dateSelector, { visible: true });

  if (currentDateValue !== date31DaysEarlier) {
    console.log("Date mismatch. Navigating to reset the page...");
    await page.goto(targetURL, { waitUntil: "load" });
    await fillDateInput(page);
  }
  await handleDialog(page);
}

async function fillDateInput(page) {
  let inputDate = await page.waitForSelector(dateSelector, { visible: true });
  let date31DaysEarlier = getDeployment31DaysEarlier();
  if (isLocal) {
    date31DaysEarlier = getDate31DaysEarlier();
  }

  if (!inputDate) {
    console.log("Date input not found. Navigating to reset the page...");
  }

  return new Promise(async (resolve, reject) => {
    try {
      // Simulate user interaction to set the date
      await page.evaluate(
        (selector, dateValue) => {
          const input = document.querySelector(selector);
          if (input) {
            input.focus();
            input.value = dateValue;
            const inputEvent = new Event("input", { bubbles: true });
            const changeEvent = new Event("change", { bubbles: true });
            input.dispatchEvent(inputEvent);
            input.dispatchEvent(changeEvent);
          }
        },
        dateSelector,
        date31DaysEarlier
      );

      await page.type(dateSelector, date31DaysEarlier);
      const dateValue = await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        return element ? element.value : "Element not found";
      }, dateSelector); // Replace with the actual selector

      await verifyDateInput(page);

      await page.click(submitButton);

      console.log("fillDateInput");
      resolve();
    } catch (error) {
      console.error("Error in fillDateInput:", error);
      reject(error);
    }
  });
}

function todayDate() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(currentDate.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

function monthEarlierDate() {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - 31);
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(currentDate.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

module.exports = {
  getDate31DaysEarlier,
  fillDateInput,
  todayDate,
  monthEarlierDate,
};
