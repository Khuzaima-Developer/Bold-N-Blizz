const puppeteer = require("puppeteer");

let browser = null; // Declare browser globally to reuse

async function getBrowserInstance() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-background-networking",
        "--disable-popup-blocking",
        "--disable-infobars",
        "--disable-blink-features=AutomationControlled",
        "--disable-new-tab-first-run",
        "--disable-new-window-first-run",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-default-apps",
        "--disable-sync",
        "--disable-translate",
        "--remote-debugging-port=9222",
        "--no-zygote",
        "--media-cache-size=0",
        "--disable-crash-reporter",
        "--disable-software-rasterizer",
        "--disable-features=site-per-process",
        "--disable-logging",
        "--disable-background-timer-throttling",
        "--disable-renderer-backgrounding",
        "--disable-gpu-sandbox",
        "--disable-seccomp-filter",
        "--disable-breakpad",
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      timeout: 30 * 60 * 1000,
    });
  } else {
    console.log("Browser already exists");
  }
  return browser;
}

async function useExistingPage() {
  try {
    let browser = await getBrowserInstance();
    let pages = await browser.pages();

    if (pages.length > 0) {
      return pages[0]; // Return the first existing page
    } else {
      return await browser.newPage(); // If no page exists, create a new one
    }
  } catch (error) {
    console.error(`Error occurred: ${error.message}`);
    console.log("Retrying...");

    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
    return useExistingPage(); // Retry the function recursively
  }
}

async function handleDialog(page) {
  // Set a flag to track if a dialog was triggered
  let dialogDetected = false;

  // Listen for dialog events
  page.on("dialog", async (dialog) => {
    try {
      dialogDetected = true; // Set flag to true when a dialog is detected

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

function monitorMemoryUsage() {
  const memoryUsage = process.memoryUsage();
  console.log(`🔍 Memory Usage: 
      🟢 RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB
      🔵 Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB
      🟡 Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
      🔴 External: ${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`);
}

module.exports = { useExistingPage, monitorMemoryUsage, handleDialog };
