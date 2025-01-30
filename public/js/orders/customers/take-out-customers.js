const puppeteer = require("puppeteer");

const date31DaysEarlier = getDate31DaysEarlier();
// Selector for the date input field
const dateSelector =
  "#app > div > div.main-content > section > div.card > div > div:nth-child(4) > input";
const head =
  "#app > div > div.main-content > section > div.card > div:nth-child(1)";

/**
 * Calculate a date 30 days earlier than the current date.
 * @returns {string} The date in 'YYYY-MM-DD' format.
 */

function getDate31DaysEarlier() {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - 31);
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(currentDate.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

function todayDate() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(currentDate.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

/**
 * Simulate user interaction to change the input[type="date"] field to a date 30 days earlier.
 * @param {puppeteer.Page} page - Puppeteer page object
 */
async function fillDateInput(page) {
  // Ensure the element exists before interacting with it
  await page.waitForSelector(head, dateSelector, { visible: true });

  // Wrap the process in a Promise
  return new Promise(async (resolve, reject) => {
    try {
      page.on("dialog", async (dialog) => {
        try {
          console.log("Dialog detected:", dialog.message());

          if (!dialog.handled) {
            await dialog.dismiss();
            console.log("Dialog dismissed.");
          } else {
            console.log("Dialog was already handled.");
          }
        } catch (error) {
          console.error("Error handling dialog:", error.message);
        }
      });
      // Simulate user interaction to set the date
      await page.evaluate(
        (selector, dateValue) => {
          const input = document.querySelector(selector);
          if (input) {
            input.focus(); // Simulate focus
            input.value = dateValue; // Set the value programmatically
            const inputEvent = new Event("input", { bubbles: true });
            const changeEvent = new Event("change", { bubbles: true });
            input.dispatchEvent(inputEvent); // Trigger the input event
            input.dispatchEvent(changeEvent); // Trigger the change event
          }
        },
        dateSelector,
        date31DaysEarlier
      );

      await page.type(dateSelector, date31DaysEarlier);

      // Wait for the data search button click to complete
      setTimeout(async () => {
        await page.click(
          "#app > div > div.main-content > section > div.card > div > div:nth-child(8) > button"
        );
        resolve();
      }, 1000);
    } catch (error) {
      console.error("Error in fillDateInput:", error);
      reject(error); // Reject the promise if an error occurs
    }
  });
}

/**
 * Verify if the input[type="date"] field value matches the expected date.
 * @param {puppeteer.Page} page - Puppeteer page object
 */
async function verifyDateInput(page) {
  // Function to get the value from the input field

  page.on("dialog", async (dialog) => {
    try {
      console.log("Dialog detected:", dialog.message());

      if (!dialog.handled) {
        await dialog.dismiss();
        console.log("Dialog dismissed.");
      } else {
        console.log("Dialog was already handled.");
      }
    } catch (error) {
      console.error("Error handling dialog:", error.message);
    }
  });

  let currentDateValue = await page.evaluate((selector) => {
    const input = document.querySelector(selector);
    return input ? input.value : null; // Return the value or null if not found
  }, dateSelector);

  // Define the selector and the URL
  const targetURL = "https://mnpcourier.com/cplight/qsr";

  let [year, month, day] = currentDateValue.split("-");
  currentDateValue = `${day}-${month}-${year}`;

  // Wait for the selector to be visible
  await page.waitForSelector(dateSelector, { visible: true });

  // Check if the current date matches the expected date
  if (currentDateValue !== date31DaysEarlier) {
    console.log("Date mismatch. Navigating to reset the page...");
    await page.goto(targetURL, {
      waitUntil: "load",
    });

    // Retry the fillDateInput function
    await fillDateInput(page);
  }
}

module.exports = {
  getDate31DaysEarlier,
  fillDateInput,
  verifyDateInput,
  todayDate,
};
