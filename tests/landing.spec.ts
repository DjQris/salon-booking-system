import { expect, test } from "@playwright/test";

test("landing, responsive layouts, fonts, and persistent themes", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Aura & Edge Salon" })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", "dark");
  await expect(page.locator("h1")).toHaveCSS("font-weight", "400");
  expect(await page.locator("h1").evaluate(el => getComputedStyle(el).fontFamily)).toContain("Inter");
  expect(await page.locator("body").evaluate(el => getComputedStyle(el).fontFamily)).toContain("Geist");
  await expect.poll(() => page.locator(".salon-cover img").evaluate((img: HTMLImageElement) => img.naturalWidth), { timeout: 20000 }).toBeGreaterThan(0);
  await page.screenshot({ path: "test-results/landing-desktop-light.png", fullPage: true });
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.getByRole("button", { name: "Switch to light mode" })).toBeVisible();
  await page.screenshot({ path: "test-results/landing-desktop-dark.png", fullPage: true });
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.getByRole("link", { name: "Sign in to book" })).toBeVisible();
    await page.screenshot({ path: `test-results/landing-${width}.png`, fullPage: true });
  }
  expect(errors).toEqual([]);
});

test("customer and admin sign-in navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("link", { name: "Sign in to book" }).click();
  await expect(page).toHaveURL(/\/signin$/);
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  await page.screenshot({ path: "test-results/customer-signin.png", fullPage: true });
  await page.getByRole("link", { name: "Admin sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/admin-signin.png", fullPage: true });
  await page.getByRole("link", { name: "Back to the salon" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("booking and administration require separate sign-in", async ({ page, request }) => {
  await page.goto("/book");
  await expect(page).toHaveURL(/\/signin$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect((await request.post("/api/appointments", { data: {} })).status()).toBe(401);
  expect((await request.get("/api/admin/appointments")).status()).toBe(401);
  expect((await request.get("/api/admin/services")).status()).toBe(401);
});
