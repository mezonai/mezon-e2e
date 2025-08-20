import { expect, Given, When, Then } from "../../fixtures/page.fixture";

Then("I should see the Mezon homepage", async ({ PageObjects }) => {
  await PageObjects.HomePage.verifyOnHomepage();
});

Then("I should see the main navigation menu", async ({ PageObjects }) => {
  await PageObjects.HomePage.verifyNavigationMenu();
});

Then("I should be redirected to login page", async ({ page }) => {
  const currentUrl = page.url();
  expect(currentUrl).toContain('/login');
});

Then("I should see the login form", async ({ PageObjects }) => {
  await PageObjects.LoginPage.verifyOnLoginPage();
});

Then("I should see {string} link", async ({ PageObjects }, linkText: string) => {
  await PageObjects.HomePage.verifyLinkExists(linkText);
});

Then("I should see {string} button", async ({ PageObjects }, buttonText: string) => {
  if (buttonText === "Login") {
    await PageObjects.HomePage.verifyLoginButton();
  }
});

Then("I should see the hero section", async ({ PageObjects }) => {
  await PageObjects.HomePage.verifyHeroSection();
});

Then("I should see the features section", async ({ PageObjects }) => {
  await PageObjects.HomePage.verifyFeaturesSection();
});

Then("I should see the footer section", async ({ PageObjects }) => {
  await PageObjects.HomePage.verifyFooterSection();
});

When("I resize browser to mobile view", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
});

Then("I should see mobile navigation", async ({ PageObjects }) => {
  await PageObjects.HomePage.verifyMobileNavigation();
});

Then("the content should be properly formatted", async ({ PageObjects }) => {
  await PageObjects.HomePage.verifyResponsiveLayout();
});

When("I navigate to homepage", async ({ PageObjects }) => {
  await PageObjects.HomePage.navigate();
});

Then("all critical elements should be present", async ({ PageObjects }) => {
  await PageObjects.HomePage.verifyCriticalElements();
});

Then("there should be no broken links", async ({ PageObjects }) => {
  await PageObjects.HomePage.verifyNoBrokenLinks();
});
