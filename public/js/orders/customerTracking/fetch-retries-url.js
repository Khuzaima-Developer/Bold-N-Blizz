const axios = require("axios");
const https = require("https");
const agent = new https.Agent({
  rejectUnauthorized: false, // Disable SSL certificate validation
});

const fetchWithRetry = async (url, retries = 3, delay = 3000) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.get(url, {
        httpsAgent: agent,
        timeout: 60000, // 1-minute timeout per request
      });

      if (response.status === 200) {
        return url; // Return the valid URL
      } else {
        throw new Error(`Request failed with status code ${response.status}`);
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
