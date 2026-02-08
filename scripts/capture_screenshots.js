
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = path.resolve('public/screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function capture() {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // 1. Login
    await page.goto('http://localhost:3000');

    // Check if we need to password setup or unlock
    // Since we seeded and set password in previous session, it might be persistent depending on how indexedDB is stored.
    // Puppeteer uses a fresh profile, so IndexedDB will be EMPTY!
    // We need to SEED AGAIN in this session!

    console.log("Seeding data for Puppeteer session...");
    await page.evaluate(async () => {
        const DB_NAME = "i8e10DB";
        const DB_VERSION = 2; // Matches database.ts

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onsuccess = (event) => {
                const db = event.target.result;
                const generateId = () => crypto.randomUUID();
                const tx = db.transaction(["transactionItems", "debts", "investments"], "readwrite");

                const tStore = tx.objectStore("transactionItems");
                tStore.put({ id: generateId(), amount: 85000, type: "income", category: "Salary", date: new Date(Date.now() - 86400000 * 2).toISOString(), notes: "October Salary", wallet: "Savings" });
                tStore.put({ id: generateId(), amount: 15000, type: "expense", category: "Rent", date: new Date(Date.now() - 86400000 * 5).toISOString(), notes: "Monthly Rent", wallet: "Savings" });

                const dStore = tx.objectStore("debts");
                dStore.put({ id: generateId(), amount: 5000, type: "lent", person: "Ravi", date: new Date(Date.now() - 86400000 * 20).toISOString(), status: "outstanding", notes: "Lunch money loan" });

                const iStore = tx.objectStore("investments");
                iStore.put({ id: generateId(), name: "Nifty 50 ETF", amount: 50000, currentValue: 55000, type: "mutual_fund", status: "active", startDate: new Date(Date.now() - 86400000 * 100).toISOString() });

                tx.oncomplete = () => resolve("seeded");
                tx.onerror = (e) => reject(e);
            };
        });
    });

    console.log("Data seeded. Reloading...");
    await page.reload();

    // Now handle "Welcome" / "Setup"
    // Click "I Understand" if present
    try {
        await page.waitForSelector('button', { timeout: 2000 });
        const buttons = await page.$$('button');
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes("Understand")) {
                await btn.click();
                break;
            }
        }
    } catch (e) { }

    // Set Password
    try {
        await page.waitForSelector('input[name="new-password"]', { timeout: 2000 });
        await page.type('input[name="new-password"]', 'password123');
        await page.type('input[name="confirm-password"]', 'password123');
        // Click submit
        const buttons = await page.$$('button');
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes("Set Password")) {
                await btn.click();
                break;
            }
        }
    } catch (e) { }

    // Handle "Recovery Phrase" - Click "Finish"
    try {
        await page.waitForSelector('input[type="checkbox"]', { timeout: 2000 });
        await page.click('input[type="checkbox"]'); // "I have written down..."
        const buttons = await page.$$('button');
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes("Finish")) {
                await btn.click();
                break;
            }
        }
    } catch (e) { }

    // Handle Tracking Consent Banner - Click "Decline" to dismiss it
    try {
        // Wait briefly for banner to appear
        await page.waitForSelector('button', { timeout: 3000 });
        const buttons = await page.$$('button');
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes("Decline")) {
                console.log("Dismissing consent banner...");
                await btn.click();
                await new Promise(r => setTimeout(r, 500)); // wait for animation
                break;
            }
        }
    } catch (e) {
        console.log("Consent banner not found or already dismissed.");
    }

    // Wait for main app
    await page.waitForSelector('main', { timeout: 5000 });

    // --- Mobile Screenshots (360x800) ---
    await page.setViewport({ width: 360, height: 800 });

    // 1. Transactions (Narrow)
    // Ensure we are on transactions tab (default)
    await page.waitForSelector('button', { timeout: 1000 });
    // Click "Transactions" tab to be sure
    await clickTab(page, "Transactions");
    await new Promise(r => setTimeout(r, 1000)); // wait for animation
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'pwa-screenshot-narrow-transaction.png') });
    console.log("Captured transaction view");

    // 2. Debts (Narrow)
    await clickTab(page, "Debts");
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'pwa-screenshot-narrow-debt.png') });
    console.log("Captured debt view");

    // 3. Investments (Narrow)
    await clickTab(page, "Investments");
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'pwa-screenshot-narrow-investment.png') });
    console.log("Captured investment view");

    // 4. Health (Narrow) - NEW
    await clickTab(page, "Health");
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'pwa-screenshot-narrow-health.png') });
    console.log("Captured health view");

    // --- Desktop Screenshot (2560x1600) ---
    await page.setViewport({ width: 2560, height: 1600 });

    // 5. Hero View (Wide) - Go to Transactions
    await clickTab(page, "Transactions");

    // Wait for data to load
    try {
        await page.waitForFunction(
            () => document.body.innerText.includes("Salary") && document.body.innerText.includes("85,000"),
            { timeout: 10000 }
        );
    } catch (e) {
        console.warn("Warning: Timeout waiting for data in Desktop view.");
    }

    await new Promise(r => setTimeout(r, 1000)); // Extra buffer for layout

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'pwa-screenshot-wide-hero-view.png') });
    console.log("Captured hero view");

    await browser.close();
}

async function clickTab(page, label) {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text === label) {
            await btn.click();
            return;
        }
    }
}

capture().catch(console.error);
