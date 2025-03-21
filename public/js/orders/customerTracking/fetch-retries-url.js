const axios = require("axios");
const https = require("https");
const agent = new https.Agent({
  rejectUnauthorized: false, // Disable SSL certificate validation
});

const fetchRetries = async (url, retries = 3, delay = 3000) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.get(url, {
        timeout: 60 * 1000,
        maxContentLength: 60 * 1024, // 60KB limit
        responseType: "text",
        decompress: true,
        httpsAgent: agent,
        headers: { "Accept-Encoding": "gzip,deflate,br" },
      });

      if (response.status === 200) {
        return url; // ✅ Valid URL, return it
      } else {
        throw new Error(`Request failed with status code ${response.status}`);
      }
    } catch (error) {
      console.error(
        `❌ Attempt ${attempt + 1} failed for ${url}: ${error.message}`
      );

      if (attempt < retries - 1) {
        console.log(`🔄 Retrying ${url} in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error(`🚫 Failed to fetch ${url} after ${retries} attempts.`);
        return null; // Return null after max retries
      }
    }
  }
};

module.exports = { fetchRetries };
