async function loginPortal(page) {
  // Open the login page
  await page.goto(loginUrl);

  // Fill in the login credentials
  await page.type(
    emailInput,
    `${process.env.USER}`
  );
  await page.type(
    passwordInput,
    `${process.env.PASSWORD}`
  );

  // Click the login button
  await page.click(
    loginSubmitBtn
    
  );

  // Wait for navigation after login
  await page.waitForNavigation();
}

module.exports = { loginPortal };
