const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

function getVoiceForRequirement(req) {
    if (req.includes('Quiet')) return 'Premium';
    if (req.includes('Direct')) return 'Direct';
    if (req.includes('Playful')) return 'Playful';
    if (req.includes('Minimal')) return 'Direct'; // Best match
    return 'Direct';
}

function getPlatformForRequirement(req) {
    if (req.includes('LinkedIn')) return 'LinkedIn';
    if (req.includes('Google Ads')) return 'Google Ads';
    if (req.includes('TikTok')) return 'TikTok';
    return '';
}

(async () => {
    console.log('Starting Generation Tests...');
    // Launch headed if possible to see? No, headless for speed/stability in this env
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    const artifactsDir = path.resolve(__dirname, 'audit_artifacts');
    if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir);

    try {
        // 1. Enter Studio
        console.log('Navigating and entering Studio...');
        await page.goto('http://localhost:3000', { waitUntil: 'load' });
        await page.waitForSelector('input[placeholder="______"]');
        await page.fill('input[placeholder="______"]', 'SYNQRA');
        await page.click('button:has-text("Enter")');
        await page.waitForURL('**/studio', { timeout: 15000 });
        console.log('Entered Studio.');

        // Test Cases
        const tests = [
            {
                name: 'A_Quiet_Luxury',
                goal: 'Announce a discreet off-market Toronto listing',
                platform: 'LinkedIn',
                voice: 'Premium'
            },
            {
                name: 'B_Direct_Executive',
                goal: 'Explain why most premium listings never hit public MLS',
                platform: 'LinkedIn',
                voice: 'Direct'
            },
            {
                name: 'C_Playful',
                goal: 'Share a light insight about behind-the-scenes real estate work',
                platform: 'LinkedIn',
                voice: 'Playful'
            },
            {
                name: 'D_Tactical_Ads',
                goal: 'Write Google ad copy for a $4M Toronto estate',
                platform: 'Google Ads',
                voice: 'Direct' // Mapped from Minimal
            }
        ];

        for (const test of tests) {
            console.log(`Running Test ${test.name}...`);

            // Wait for form
            await page.waitForSelector('textarea', { state: 'visible' });

            // Fill Form
            await page.fill('textarea', test.goal);

            // Select Platform
            // We need to find select by label or order. 
            // Platform is first select? Check layout.
            // Label "Platform" is associated with a select.
            // Using logic: select near "Platform" text.
            // But selectors are easier: 
            // The structure in code: 
            // Label "Platform" -> Select.
            // There are 2 selects. 1st is Platform, 2nd is Voice.

            const selects = page.locator('select');
            await selects.nth(0).selectOption(test.platform);
            await selects.nth(1).selectOption(test.voice);

            console.log(`Inputs filled: Goal="${test.goal}", Platform="${test.platform}", Voice="${test.voice}"`);


            // Click Create
            // Select button by text. Could be "CREATE", "COMPLETE", "ADJUST"
            const createButton = page.locator('button', { hasText: /CREATE|COMPLETE|ADJUST/ });
            await createButton.click();
            console.log('Clicked CREATE. Waiting for generation...');

            // Wait for Result or Error
            try {
                // Race condition: specific text for success OR error indicator
                // Success: "Your output is ready."
                // Error: "Let's adjust this."
                await Promise.race([
                    page.waitForSelector('text="Your output is ready."', { timeout: 60000 }),
                    page.waitForSelector('text="Let\'s adjust this."', { timeout: 60000 })
                ]);

                // Check which one appeared
                const errorVisible = await page.isVisible('text="Let\'s adjust this."');
                if (errorVisible) {
                    console.error(`Error reported by UI for test ${test.name}`);
                    await page.screenshot({ path: path.resolve(artifactsDir, `error_ui_${test.name}.png`) });
                    throw new Error('UI reported generation error');
                }
            } catch (e) {
                console.error(`Timeout or error waiting for generation in test ${test.name}: ${e.message}`);
                await page.screenshot({ path: path.resolve(artifactsDir, `timeout_${test.name}.png`) });
                throw e;
            }


            console.log('Generation complete.');

            // Capture Screenshot
            const screenshotPath = path.resolve(artifactsDir, `result_${test.name}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`Screenshot saved: ${screenshotPath}`);

            // Capture Text Content
            // The content is in a div following the header?
            // "font-mono text-sm leading-relaxed text-white/90"
            const contentLocator = page.locator('div.text-white\\/90');
            const content = await contentLocator.innerText();
            console.log(`Output Content (First 100 chars): ${content.substring(0, 100)}...`);

            fs.writeFileSync(path.resolve(artifactsDir, `output_${test.name}.txt`), content);

            // Validation logic (simple checks)
            const validations = [];
            if (content.includes('!')) validations.push('FAIL: Exclamation mark detected');
            if (content.match(/[\u{1F600}-\u{1F64F}]/u)) validations.push('FAIL: Emoji detected');
            if (test.name === 'A_Quiet_Luxury' && (content.includes('Hurry') || content.includes('Act now'))) validations.push('FAIL: Urgency detected in Quiet Luxury');

            if (validations.length > 0) {
                console.log(`Validation Issues for ${test.name}:`, validations);
            } else {
                console.log(`Validation PASSED for ${test.name}`);
            }

            // Reset
            await page.click('button:has-text("Create another ->")');
            console.log('Resetting for next test...');
            await page.waitForTimeout(1000); // UI transition
        }

    } catch (error) {
        console.error('Error during generation tests:', error);
    } finally {
        await browser.close();
        console.log('Browser closed.');
    }
})();
