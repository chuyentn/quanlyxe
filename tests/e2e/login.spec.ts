import { test, expect } from '@playwright/test';

test('has title and redirects to auth', async ({ page }) => {
    try {
        // Start from the index page
        await page.goto('http://localhost:8080');

        // Expect title to contain the app name or related text
        await expect(page).toHaveTitle(/SAVACO|QuanLyXe|Fleet/i);

        // Wait for loader to disappear (max 10s as safety timeout is 5s)
        await expect(page.getByText('Đang kiểm tra xác thực')).not.toBeVisible({ timeout: 10000 });

        // Check for email input or any login form indicator
        await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    } catch (e) {
        console.log("DEBUG PAGE CONTENT:");
        console.log(await page.content());
        throw e;
    }
});
