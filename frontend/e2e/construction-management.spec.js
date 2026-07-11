import { test, expect } from "@playwright/test";

const login = async (page) => {
  await page.goto("/login");
  await page.getByLabel(/username|email/i).fill(process.env.E2E_USERNAME || "admin");
  await page.getByLabel(/password/i).fill(process.env.E2E_PASSWORD || "admin");
  await page.getByRole("button", { name: /login|sign in/i }).click();
};

test.describe("construction management smoke audit", () => {
  test("dashboard separates USD and AFN financial totals", async ({ page }) => {
    await login(page);
    await page.goto("/");

    await expect(page.getByText(/financial overview/i)).toBeVisible();
    await expect(page.getByText(/USD/i)).toBeVisible();
    await expect(page.getByText(/AFN/i)).toBeVisible();
  });

  test("projects and expenses pages are reachable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);

    await page.goto("/manager/projects");
    await expect(page.locator("body")).toContainText(/project/i);

    await page.goto("/manager/expenses");
    await expect(page.locator("body")).toContainText(/expense/i);
  });

  test("unauthorized sessions redirect away from protected routes", async ({ page }) => {
    await page.goto("/manager/projects");

    await expect(page).toHaveURL(/login|auth/i);
  });
});
