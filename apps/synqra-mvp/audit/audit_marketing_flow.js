const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('Starting Audit of New Marketing Flow...');
    const auditEmail = process.env.AUDIT_EMAIL || 'audit@example.com';
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    const artifactsDir = path.resolve(__dirname, 'audit_artifacts');
    if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir);

    try {
        console.log('Navigating to http://localhost:3000 (New Homepage)...');
        await page.goto('http://localhost:3000', { waitUntil: 'load' });

        // Audit Homepage
        await page.screenshot({ path: path.resolve(artifactsDir, 'marketing_home.png'), fullPage: true });
        const content = await page.content();

        // Verify CTAs
        const applyText = await page.textContent('a[href="/pilot/apply"]');
        const waitlistText = await page.textContent('a[href="/waitlist"]');

        console.log(`Apply CTA Text: ${applyText}`);
        console.log(`Waitlist CTA Text: ${waitlistText}`);

        if (!content.includes('Drive Unseen')) throw new Error('Marketing copy missing');

        // Verify Navigate to Pilot
        console.log('Clicking Apply for Founder Pilot...');
        await page.click('a[href="/pilot/apply"]');
        await page.waitForURL('**/pilot/apply');
        console.log('Navigated to Pilot Application.');
        await page.screenshot({ path: path.resolve(artifactsDir, 'pilot_form.png') });

        // Fill Form
        console.log('Filling Pilot Form...');
        await page.fill('input[name="fullName"]', 'Audit Bot');
        await page.fill('input[name="email"]', auditEmail);
        await page.fill('input[name="companyName"]', 'Noid Labs');
        await page.fill('input[name="role"]', 'Auditor');
        await page.selectOption('select[name="companySize"]', '1-10');
        await page.fill('textarea[name="whyPilot"]', 'Testing the pilot application flow for verification. This needs to be at least 50 chars long so I am typing more.');

        await page.click('button[type="submit"]');
        console.log('Submitted Form.');

        // Wait for Success
        await page.waitForURL('**/pilot/apply/success');
        console.log('Navigated to Success Page.');
        await page.screenshot({ path: path.resolve(artifactsDir, 'pilot_success.png') });

        // Verify Content
        const successText = await page.textContent('h1');
        console.log(`Success Page Title: ${successText}`);
        if (!successText.includes("You're In")) throw new Error('Success page title mismatch');

        // Return to Home
        await page.click('text="Return to Homepage"');
        await page.waitForURL('http://localhost:3000/');
        console.log('Returned to Home.');

        // Test Member Access Link
        console.log('Testing Member Access Link...');
        // Selector: text="// MEMBER ACCESS"
        await page.click('text="// MEMBER ACCESS"');
        await page.waitForURL('**/enter');
        console.log('Navigated to Gatekeeper.');
        await page.screenshot({ path: path.resolve(artifactsDir, 'marketing_to_gatekeeper.png') });

        // Verify Gatekeeper functionality still works (light check)
        await page.waitForSelector('input[placeholder="______"]');
        console.log('Gatekeeper Input Visible.');

    } catch (error) {
        console.error('Error during marketing audit:', error);
        await page.screenshot({ path: path.resolve(artifactsDir, 'error_marketing.png') });
    } finally {
        await browser.close();
        console.log('Browser closed.');
    }
})();
