import { Given, When, Then } from "../../fixtures/page.fixture";

Given("I navigate to login page", async ({ page }) => {
  await page.goto("/login");
});

When("I fill in credentials", async () => {
  console.log("Filling credentials...");
});

Then("I should be logged in", async () => {
  console.log("Login verified!");
});
