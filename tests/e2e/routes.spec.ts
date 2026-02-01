
import { test, expect } from '@playwright/test';

test.describe('Routes Page', () => {
    test('loads routes list without infinite spinner', async ({ page }) => {
        // Go to Routes page (will redirect to login if not authenticated, but verifying load)
        // Note: In dev mode, we might need to be logged in to see the table.
        // For now, checks if it crashes or spins forever.

        await page.goto('http://localhost:8080/routes');

        // 1. Check if we are redirected to auth (Expected behavior if not logged in)
        // OR if we stay on routes (if session persists/mocked).

        // If we see "Danh Mục Tuyến Đường", it loaded.
        // If we see "Đang đăng nhập..." or spinner forever, it failed.

        // Wait for potential redirect
        await page.waitForTimeout(2000);

        const url = page.url();
        if (url.includes('/auth')) {
            console.log("Redirected to Auth - This is valid behavior for unauth user");
            return;
        }

        // If not redirected, we expect to see the Header
        await expect(page.getByText('Danh Mục Tuyến Đường')).toBeVisible({ timeout: 10000 });

        // And NO spinner
        // The spinner has class 'animate-spin' or explicitly Loader2
        // We check that the main loading state is gone.
        await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 10000 });
    });
});
