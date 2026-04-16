import { test, expect } from "@playwright/test";

test("landing and play pages render core entry points", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /pass the code\. ship the chaos/i })).toBeVisible();

  await page.goto("/play");
  await expect(page.getByRole("button", { name: /create (demo )?room/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /find (demo )?room/i })).toBeVisible();
});
