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
  }, 60000);
}

module.exports = { takeScreenshotsFor1Min, takeScreenshotAndUpload };
