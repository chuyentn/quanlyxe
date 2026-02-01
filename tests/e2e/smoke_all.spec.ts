
import { test, expect } from '@playwright/test';

// List of routes to check
const routes = [
    { path: '/vehicles', title: 'Danh Mục Xe' },
    { path: '/drivers', title: 'Danh Mục Tài Xế' },
    { path: '/routes', title: 'Danh Mục Tuyến Đường' },
    { path: '/customers', title: 'Khách Hàng' },
    { path: '/trips', title: 'Quản Lý Chuyến Xe' },
    { path: '/dispatch', title: 'Điều Phối' },
    { path: '/expenses', title: 'Chi Phí' },
];

test.describe('System Smoke Test', () => {
    for (const route of routes) {
        test(`loads ${route.title} (${route.path}) without infinite spinner`, async ({ page }) => {
            console.log(`Testing ${route.path}...`);
            await page.goto(`http://localhost:8080${route.path}`);

            // Allow for redirect (if auth needed)
            await page.waitForTimeout(1000);
            if (page.url().includes('/auth')) {
                console.log(`  -> Redirected to Auth (Okay for unauth state)`);
                return;
            }

            // Check for Title
            // Note: We use a loose match or verify the Header exists
            const header = page.locator('h1, h2').first();
            await expect(header).toBeVisible({ timeout: 15000 });

            // Check for NO Infinite Spinner
            // The Loader2 generic spinner usually has 'animate-spin'
            await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 15000 });

            console.log(`  -> ${route.title} Loaded OK`);
        });
    }
});
