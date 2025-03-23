function dateMethod() {
  const isRailway = process.env.RAILWAY_ENV !== undefined; // Railway sets this in deployment
  const isProduction = process.env.NODE_ENV === "production";

  // ✅ Run deployment function ONLY when truly deployed
  if (isRailway || isProduction) {
    console.log("🚀 Running in Railway Deployment Mode");
    return getDeployment31DaysEarlier();
  } else {
    console.log("💻 Running in Local Development Mode");
    return getDate31DaysEarlier();
  }
}

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
  console.log("production");
  return `${day}-${month}-${year}`;
}

function getDeployment31DaysEarlier() {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - 31);

  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(currentDate.getDate()).padStart(2, "0");
  console.log("deployment");

  return `${month}-${day}-${year}`; // Change order to DD-MM-YYYY
}

async function typeStartDate(page, startDateSelector, date31DaysEarlier) {
  await page.evaluate(
    (selector, dateValue) => {
      const input = document.querySelector(selector);
      if (input) {
        input.focus();
        input.value = "";
        input.value = dateValue;
        const inputEvent = new Event("input", { bubbles: true });
        const changeEvent = new Event("change", { bubbles: true });
        input.dispatchEvent(inputEvent);
        input.dispatchEvent(changeEvent);
      }
    },
    startDateSelector,
    date31DaysEarlier
  );

  await page.type(startDateSelector, date31DaysEarlier, { delay: 1000 });

  const dateValue = await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element ? element.value : "Element not found";
  }, startDateSelector); // Replace with the actual selector

  console.log("Input value: " + dateValue + ", Expected: " + date31DaysEarlier);
  await new Promise((resolve) => setTimeout(resolve, 500));
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
    console.log(
      `Date mismatch. Inp date: ${currentDateValue} expected: ${date31DaysEarlier}`
    );
    await fillDateInput(page);
  }
}

async function fillDateInput(page) {
  let inputDate = await page.waitForSelector(startDateSelector, {
    visible: true,
  });

  const date31DaysEarlier = dateMethod();

  if (!inputDate) {
    console.log("Date input not found. Navigating to reset the page...");
  }

  return new Promise(async (resolve, reject) => {
    try {
      // Simulate user interaction to set the date
      await typeStartDate(page, startDateSelector, date31DaysEarlier);

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
