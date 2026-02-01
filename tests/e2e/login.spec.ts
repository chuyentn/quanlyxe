import { test, expect } from '@playwright/test';

test('has title and redirects to auth', async ({ page }) => {
    // Start from the index page
    await page.goto('http://localhost:8080');

    // Expect title to contain the app name or related text
    // Adjust based on actual app title
    await expect(page).toHaveTitle(/SAVACO|QuanLyXe|Fleet/i);

    // Should show loading or redirect to auth
    // Wait for the "Checking authentication" to disappear or Login form to appear

    // Wait for loader to disappear (max 7s as safety timeout is 5s)
    await expect(page.getByText('Đang kiểm tra xác thực')).not.toBeVisible({ timeout: 8000 });

    // Check for email input or any login form indicator
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });

});
