async function setupInterception(page) {
  await page.setRequestInterception(true);

  page.on("request", async (request) => {
    const resourceType = request.resourceType();
    if (["stylesheet", "image", "font", "media"].includes(resourceType)) {
      request.abort(); // Block unwanted resources before the page loads
    } else {
      request.continue();
    }
  });
}

module.exports = { setupInterception };
