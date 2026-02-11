const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('Starting Studio Entry Audit...');
    const browser = await chromium.launch(); // Headless by default
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('Navigating to http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'load' });

        // Wait for input
        const inputSelector = 'input[placeholder="______"]';
        await page.waitForSelector(inputSelector);

        console.log('Typing access code...');
        await page.fill(inputSelector, 'SYNQRA');

        // Click Enter button
        // The button text is "Enter" or "Processing"
        // It has text "Enter" initially.
        const buttonSelector = 'button:has-text("Enter")';
        await page.click(buttonSelector);
        console.log('Clicked Enter...');

        // Wait for navigation
        await page.waitForURL('**/studio', { timeout: 10000 });
        console.log('Navigated to Studio.');

        // Wait for studio to settle (loading states etc)
        await page.waitForTimeout(3000);

        // Screenshot
        const artifactsDir = path.resolve(__dirname, 'audit_artifacts');
        if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir);
        const screenshotPath = path.resolve(artifactsDir, 'studio_ready.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Screenshot saved: ${screenshotPath}`);

        // Verify Identity Asset count in Studio
        // "Identity hierarchy still respected (one asset only)."
        // "Status indicators are calm"

        const content = await page.content();
        const images = await page.$$('img');
        console.log(`Studio Image Count: ${images.length}`);
        for (const img of images) {
            const src = await img.getAttribute('src');
            console.log(`Studio Image: ${src}`);
        }

        // Logic to verify identity hierarchy
        // This requires manual inspection of logs or screenshot, 
        // but I can check if multiple logos interact.

    } catch (error) {
        console.error('Error during studio entry:', error);
    } finally {
        await browser.close();
        console.log('Browser closed.');
    }
})();
