const puppeteer = require("puppeteer");

async function launchBrowser() {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--remote-debugging-port=9222",
      ],
      waitUntil: "networkidle2",
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined, // Cloud environment path
      timeout: 30 * 1000, // Increased timeout to 60 seconds
    });

    return browser; // If successful, return the browser
  } catch (error) {
    console.error(`Error occurred: ${error.message}`);
    console.log("Retrying...");

    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
    return launchBrowser(); // Retry the function recursively
  }
}

module.exports = { launchBrowser }; //
