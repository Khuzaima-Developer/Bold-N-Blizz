async function loginPortal(page) {
  // Open the login page
  await page.goto("https://mnpcourier.com/cplight/login");

  // Fill in the login credentials
  await page.type(
    "#app > section > div > div > div > div.card.card-primary > form > div > div:nth-child(1) > input",
    `${process.env.USER}`
  );
  await page.type(
    "#app > section > div > div > div > div.card.card-primary > form > div > div:nth-child(2) > input",
    `${process.env.PASSWORD}`
  );

  // Click the login button
  await page.click(
    "#app > section > div > div > div > div.card.card-primary > form > div > div:nth-child(4) > button"
  );

  // Wait for navigation after login
  await page.waitForNavigation();
}

module.exports = { loginPortal };
