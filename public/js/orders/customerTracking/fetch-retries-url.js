const axios = require("axios");
const https = require("https");
const agent = new https.Agent({
  rejectUnauthorized: false, // Disable SSL certificate validation
});

const fetchWithRetry = async (
  url,
  retries = 3,
  delay = 3000,
  maxPageRetries = 3,
  page
) => {
  // Retry logic for fetching the URL
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (!page) {
        // Fetch logic if page parameter is not passed
        const response = await axios.get(url, {
          timeout: 60000, // 1-minute timeout per request
        });

        if (response.status === 200) {
          return url; // Return the valid URL
        } else {
          throw new Error(`Request failed with status code ${response.status}`);
        }
      } else {
        // Retry page navigation logic if page parameter is passed
        for (let pageAttempt = 0; pageAttempt < maxPageRetries; pageAttempt++) {
          try {
            await page.goto(url, {
              waitUntil: "domcontentloaded",
              timeout: 300000, // 300 seconds timeout
            });
            return url; // Return valid page URL if navigation successful
          } catch (error) {
            console.error(
              `Page load attempt ${pageAttempt + 1} failed for ${url}: ${
                error.message
              }`
            );
            if (pageAttempt < maxPageRetries - 1) {
              console.log(`Retrying page load for ${url} in 5 seconds...`);
              await new Promise((resolve) => setTimeout(resolve, 5000));
            } else {
              console.error(
                `Failed to load page for ${url} after ${maxPageRetries} attempts.`
              );
              return null; // Return null if page fails to load after max retries
            }
          }
        }
      }
    } catch (error) {
      console.error(
        `Fetch attempt ${attempt + 1} failed for ${url}: ${error.message}`
      );
      if (attempt < retries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error(
          `Failed to fetch data from ${url} after ${retries} attempts.`
        );
        return null; // Return null if all retries fail
      }
    }
  }
};

module.exports = fetchWithRetry;
