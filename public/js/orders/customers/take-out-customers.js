const isLocal = !process.env.NODE_ENV || process.env.NODE_ENV === "development";

let todaysDate = new Date();

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
  currentDate.setUTCDate(currentDate.getUTCDate() - 31); // Always use UTC

  const year = currentDate.getUTCFullYear();
  const month = String(currentDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getUTCDate()).padStart(2, "0");

  console.log(`✅ Computed UTC Date: ${day}-${month}-${year}`); // Debugging

  return `${day}-${month}-${year}`;
}

async function verifyDateInput(page) {
  let date31DaysEarlier = getDate31DaysEarlier();
  let currentDateValue = await page.evaluate((selector) => {
    const input = document.querySelector(selector);
    return input ? input.value : null; // Return the value or null if not found
  }, startDateSelector);

  let [year, month, day] = currentDateValue.split("-");
  currentDateValue = `${day}-${month}-${year}`;

  await page.waitForSelector(startDateSelector, { visible: true });

  if (currentDateValue !== date31DaysEarlier) {
    console.log("Date mismatch. Updating the input...");
    await fillDateInput(page);
  }
}

async function fillDateInput(page) {
  let inputDate = await page.waitForSelector(startDateSelector, {
    visible: true,
  });

  const date31DaysEarlier = isLocal
    ? getDate31DaysEarlier()
    : getDeployment31DaysEarlier();

  if (!inputDate) {
    console.log("Date input not found. Navigating to reset the page...");
  }

  return new Promise(async (resolve, reject) => {
    try {
      // Simulate user interaction to set the date
      await page.evaluate((selector) => {
        const input = document.querySelector(selector);
        if (input) {
          input.focus();
          input.value = ""; // Fully clear the input before typing
          const inputEvent = new Event("input", { bubbles: true });
          input.dispatchEvent(inputEvent);
        }
      }, startDateSelector);

      // Type the date character by character
      for (const char of date31DaysEarlier) {
        await page.type(startDateSelector, char);
        await page.waitForTimeout(50); // Add slight delay to prevent input skipping
      }

      const dateValue = await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        return element ? element.value : "Element not found";
      }, startDateSelector);

      console.log(
        `🔹 Final Typed Input: ${dateValue}, Expected: ${date31DaysEarlier}`
      );

      await new Promise((resolve) => setTimeout(resolve, 3000));
      await page.click(dateSearchBtn);

      await verifyDateInput(page);
      resolve();
    } catch (error) {
      console.error("Error in fillDateInput:", error);
      reject(error);
    }
  });
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(date.getDate()).padStart(2, "0");
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
  formatDate,
  monthEarlierDate,
};
