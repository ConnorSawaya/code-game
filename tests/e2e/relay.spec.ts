import { test, expect } from "@playwright/test";

test("landing and play pages render core entry points", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /pass the idea\. break the meaning/i })).toBeVisible();

  await page.goto("/play");
  await expect(page.getByRole("button", { name: /create relay room/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /find a room/i })).toBeVisible();
});
