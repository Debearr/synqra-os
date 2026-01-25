const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('Starting Advanced Scenarios Audit (Creator Stamp & Profiles)...');
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    const artifactsDir = path.resolve(__dirname, 'audit_artifacts');
    if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir);

    // Helper to run a test generation
    async function runGeneration(testName, interceptorData) {
        console.log(`\n--- Running Scenario: ${testName} ---`);

        // Reset to Studio entry
        await page.goto('http://localhost:3000/studio', { waitUntil: 'load' }); // Try direct access? 
        // Likely redirects to / if no access.
        // So let's go front door if needed, or check if we are already in studio.
        if (!page.url().includes('/studio')) {
            await page.goto('http://localhost:3000');
            const inStudio = await page.url().includes('/studio');
            if (!inStudio) {
                // Do login flow
                await page.waitForSelector('input[placeholder="______"]');
                await page.fill('input[placeholder="______"]', 'SYNQRA');
                await page.click('button:has-text("Enter")');
                await page.waitForURL('**/studio');
            }
        }

        // Setup Interception
        await page.unroute('**/api/council'); // Clear previous
        await page.route('**/api/council', async route => {
            const request = route.request();
            const postData = JSON.parse(request.postData() || '{}');

            // Merge interceptor data
            const newData = { ...postData, ...interceptorData };
            console.log(`[Intercept] Modifying request payload:`, JSON.stringify(interceptorData));

            await route.continue({
                postData: JSON.stringify(newData)
            });
        });

        // Loop to clear "Create another" if present
        if (await page.isVisible('button:has-text("Create another ->")')) {
            await page.click('button:has-text("Create another ->")');
        }

        // Fill Form
        await page.waitForSelector('textarea');
        await page.fill('textarea', 'Write a short professional status update inviting collaboration.');

        const selects = page.locator('select');
        await selects.nth(0).selectOption('LinkedIn');
        await selects.nth(1).selectOption('Direct');

        // Click Create
        const createButton = page.locator('button', { hasText: /CREATE|COMPLETE|ADJUST/ });
        await createButton.click();

        // Wait for result
        try {
            await Promise.race([
                page.waitForSelector('text="Your output is ready."', { timeout: 30000 }),
                page.waitForSelector('text="Let\'s adjust this."', { timeout: 30000 })
            ]);
        } catch (e) {
            console.error(`Timeout waiting for result in ${testName}`);
            await page.screenshot({ path: path.resolve(artifactsDir, `error_${testName}.png`) });
            return;
        }

        // Capture Result
        await page.waitForTimeout(1000); // settle
        await page.screenshot({ path: path.resolve(artifactsDir, `${testName}.png`), fullPage: true });
        console.log(`Screenshot saved: ${testName}.png`);

        const contentLocator = page.locator('div.text-white\\/90');
        const content = await contentLocator.innerText();
        console.log(`Content Output: "${content.substring(0, 50)}..."`); // Log first 50 chars

        fs.writeFileSync(path.resolve(artifactsDir, `${testName}.txt`), content);

        return content;
    }

    try {
        // STEP 5: CREATOR STAMP STRESS TEST
        // 1. Disabled
        const contentDisabled = await runGeneration('stamp_disabled', { creatorStampEnabled: false });

        // 2. Enabled
        const contentEnabled = await runGeneration('stamp_enabled', { creatorStampEnabled: true });

        // Compare
        console.log('\n--- Stamp Verification ---');
        console.log('Disabled Content Length:', contentDisabled?.length);
        console.log('Enabled Content Length:', contentEnabled?.length);
        // Heuristic check: Enabled might have a signature line like "Created by Synqra" or similar?
        // Actually, we don't know the exact string, but we can look for "bottom-right" or just see if the text differs.

        // STEP 6: CLONE PROFILE CHECK
        // Synqra (Default, effectively same as stamp_disabled usually)
        await runGeneration('profile_synqra', { identityProfile: 'synqra', creatorStampEnabled: false });

        // Noid
        await runGeneration('profile_noid', { identityProfile: 'noid', creatorStampEnabled: false });

        // AuraFX
        await runGeneration('profile_aurafx', { identityProfile: 'aurafx', creatorStampEnabled: false });

    } catch (error) {
        console.error('Error during advanced scenarios:', error);
    } finally {
        await browser.close();
        console.log('Browser closed.');
    }
})();
