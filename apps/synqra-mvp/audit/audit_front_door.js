const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('Starting Front Door Audit...');
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
        console.log('Navigating to http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'load' });

        // Wait a bit for JS to execute
        await page.waitForTimeout(2000);

        // Take screenshot
        const artifactsDir = path.resolve(__dirname, 'audit_artifacts');
        if (!fs.existsSync(artifactsDir)) {
            fs.mkdirSync(artifactsDir);
        }
        const screenshotPath = path.resolve(artifactsDir, 'front_door.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Screenshot saved: ${screenshotPath}`);

        // Check content
        const title = await page.title();
        console.log(`Page Title: ${title}`);

        const content = await page.content();
        const hasIdentityAsset = content.includes('synqra') || content.includes('Synqra') || content.includes('SYNQRA');
        console.log(`Identity Asset Detected: ${hasIdentityAsset}`);

        // Check for specific elements that indicate "Quiet Luxury"
        // e.g. minimal text, specific fonts (Inter, Roboto), dark mode classes
        const bodyClass = await page.evaluate(() => document.body.className);
        console.log(`Body Classes: ${bodyClass}`);

        // Check for multiple logos
        const images = await page.$$('img');
        console.log(`Number of images found: ${images.length}`);
        let logoCount = 0;
        for (const img of images) {
            const src = await img.getAttribute('src');
            const alt = await img.getAttribute('alt');
            console.log(`Image source: ${src}, Alt: ${alt}`);
            if ((alt && alt.toLowerCase().includes('logo')) || (src && src.toLowerCase().includes('logo'))) {
                logoCount++;
            }
        }
        console.log(`Potential logo count: ${logoCount}`);

    } catch (error) {
        console.error('Error during audit:', error);
    } finally {
        await browser.close();
        console.log('Browser closed.');
    }
})();
