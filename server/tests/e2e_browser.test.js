import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FRONTEND_URL = 'http://localhost:5173';

const results = [];
function record(name, success, details) {
  results.push({ name, success, details });
  console.log(`${success ? '✓ BROWSER PASS' : '✗ BROWSER FAIL'}: ${name} ${details ? `(${details})` : ''}`);
}

async function runBrowserTests() {
  console.log('\n======================================================');
  console.log('   STARTING REAL CHROME END-TO-END BROWSER AUTOMATION');
  console.log('======================================================\n');

  let browser;
  const consoleErrors = [];

  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('[Browser Console Error]', msg.text());
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
      console.log('[Browser Uncaught Exception]', err.message);
    });

    // 1. Test Home Page
    console.log('Step 1: Navigating to Home Page...');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
    const titleText = await page.$eval('h1', (el) => el.textContent);
    record(
      'Home Page Load',
      titleText.includes('Every Crime Leaves a Trace'),
      `Hero title verified: "${titleText.replace(/\s+/g, ' ').trim()}"`
    );

    // 2. Click "Open New Case File"
    console.log('Step 2: Clicking CTA to navigate to Create Page...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('a[href="/create"]'),
    ]);
    const createHeader = await page.$eval('h1', (el) => el.textContent);
    record(
      'Navigation to Create Page',
      createHeader.includes('Open a New Investigation'),
      `Page header verified: "${createHeader}"`
    );

    // 3. Fill Create Form for Easy Mystery
    console.log('Step 3: Configuring Easy Mystery and generating...');
    await page.type('#premise', 'The gilded pocket watch vanished during the masquerade ball.');
    await page.click('input[value="easy"]');

    // Click submit and wait for navigation to /case/:id
    await page.click('button[type="submit"]');

    // Wait for the URL to change to /case/
    await page.waitForFunction(() => window.location.pathname.startsWith('/case/'), { timeout: 15000 });
    const caseUrl = page.url();
    const caseId = caseUrl.split('/case/')[1].split('/')[0];
    record(
      'Case Generation & Navigation to /case/:id',
      Boolean(caseId) && caseId.length === 24,
      `Navigated to Case ID: ${caseId}`
    );

    // 4. Verify Investigation Room Content (Suspects)
    console.log('Step 4: Inspecting Suspects in Investigation Room...');
    await page.waitForSelector('h1');
    const caseHeading = await page.$eval('h1', (el) => el.textContent);
    const suspectCards = await page.$$eval('.font-bold.text-slate-100', (els) => els.map((e) => e.textContent));
    record(
      'Investigation Room: Suspect Dossiers Rendered',
      suspectCards.length >= 3,
      `Case title: "${caseHeading}", Suspects found: ${suspectCards.length}`
    );

    // 5. Switch to Evidence Locker tab and discover a clue
    console.log('Step 5: Switching to Evidence tab and discovering clue...');
    await page.click('[data-testid="tab-clues"]');
    await page.waitForSelector('button::-p-text(Examine Clue (+5 pts))');

    // Click the first "Examine Clue (+5 pts)" button
    const examineButton = await page.waitForSelector('button::-p-text(Examine Clue (+5 pts))');
    await examineButton.click();

    // Wait for the evidence counter to update
    await page.waitForFunction(
      () => document.querySelector('[data-testid="evidence-counter"]')?.textContent.includes('1 /'),
      { timeout: 5000 }
    );
    const evidenceFoundText = await page.$eval('[data-testid="evidence-counter"]', (el) => el.textContent);
    record(
      'Clue Discovery (+5 pts) in UI',
      evidenceFoundText.includes('1 /') && evidenceFoundText.includes('+5'),
      `Evidence counter updated: "${evidenceFoundText.trim()}"`
    );

    // 6. Switch to Detective Hints tab and request a hint
    console.log('Step 6: Switching to Hints tab and requesting hint...');
    await page.click('[data-testid="tab-hints"]');

    // Click "Request Hint (-10 pts)"
    const requestHintBtn = await page.waitForSelector('[data-testid="btn-request-hint"]');
    await requestHintBtn.click();

    // Confirmation modal should appear: click "Confirm & Unlock (-10 pts)"
    const confirmHintBtn = await page.waitForSelector('[data-testid="btn-confirm-hint"]');
    await confirmHintBtn.click();

    // Wait for hints counter to update to 1 /
    await page.waitForFunction(
      () => document.querySelector('[data-testid="hints-counter"]')?.textContent.includes('1 /'),
      { timeout: 5000 }
    );
    const hintsCountText = await page.$eval('[data-testid="hints-counter"]', (el) => el.textContent);
    record(
      'Hint Request (-10 pts) & Modal Confirmation',
      hintsCountText.includes('1 /'),
      `Hints counter updated: "${hintsCountText.trim()}"`
    );

    // 7. Click "Convene Tribunal" to open Accusation screen
    console.log('Step 7: Navigating to Accusation Interface...');
    await page.click(`a[href="/case/${caseId}/accuse"]`);
    await page.waitForFunction(() => window.location.pathname.includes('/accuse'), { timeout: 10000 });
    const accusationUrl = page.url();
    record(
      'Navigation to Accusation Page',
      accusationUrl.includes('/accuse'),
      `Current URL: ${accusationUrl}`
    );

    // 8. Select suspect and submit accusation
    console.log('Step 8: Selecting suspect and indicting...');
    const firstRadio = await page.waitForSelector('input[type="radio"]');
    await firstRadio.click();

    // Type optional closing argument
    await page.type('textarea', 'The forensic score on the display case proved access to specialized tools.');

    // Click "Indict Prime Suspect"
    const indictBtn = await page.waitForSelector('button::-p-text(Indict Prime Suspect)');
    await indictBtn.click();

    // Confirmation modal: click "Seal Indictment"
    const sealBtn = await page.waitForSelector('button::-p-text(Seal Indictment)');
    await sealBtn.click();

    // Wait for client-side navigation to /result
    await page.waitForFunction(() => window.location.pathname.includes('/result'), { timeout: 10000 });
    await page.waitForSelector('h1', { timeout: 10000 });

    // 9. Verify Results Page
    console.log('Step 9: Verifying Results & Verdict Page...');
    const resultsUrl = page.url();
    const verdictBanner = await page.$eval('h1', (el) => el.textContent);
    const scoreText = await page.$eval('.text-4xl, .text-5xl', (el) => el.textContent);
    record(
      'Results Page Verdict & Score Reveal',
      resultsUrl.includes('/result') && Boolean(verdictBanner),
      `Banner: "${verdictBanner}", Final Score: ${scoreText} pts`
    );

    // 10. Click "Investigate Another Mystery"
    console.log('Step 10: Testing navigation back to Create Page...');
    await page.click('a[href="/create"]');
    await page.waitForFunction(() => window.location.pathname.includes('/create'), { timeout: 10000 });
    const loopBackUrl = page.url();
    record(
      'Loop Back: Investigate Another Mystery',
      loopBackUrl.includes('/create'),
      `Returned cleanly to: ${loopBackUrl}`
    );

    // 11. Test Medium & Hard generation in browser
    console.log('Step 11: Testing Medium Difficulty Generation in Browser...');
    await page.click('input[value="medium"]');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname.startsWith('/case/'), { timeout: 15000 });
    const medCaseUrl = page.url();
    const medCaseId = medCaseUrl.split('/case/')[1].split('/')[0];
    record(
      'Medium Difficulty Case Generation',
      Boolean(medCaseId) && medCaseId !== caseId,
      `Medium Case ID generated: ${medCaseId}`
    );

    // 12. Test Hard Difficulty Generation in Browser
    console.log('Step 12: Testing Hard Difficulty Generation in Browser...');
    await page.goto(`${FRONTEND_URL}/create`, { waitUntil: 'networkidle0' });
    await page.type('#premise', 'The quantum encryption key vanished from the underground bunker.');
    await page.click('input[value="hard"]');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname.startsWith('/case/'), { timeout: 15000 });
    const hardCaseUrl = page.url();
    const hardCaseId = hardCaseUrl.split('/case/')[1].split('/')[0];
    record(
      'Hard Difficulty Case Generation',
      Boolean(hardCaseId) && hardCaseId !== caseId && hardCaseId !== medCaseId,
      `Hard Case ID generated: ${hardCaseId}`
    );

    // 13. Test Invalid Case ID Handling
    console.log('Step 13: Testing invalid case ID route handling...');
    await page.goto(`${FRONTEND_URL}/case/666666666666666666666666`, { waitUntil: 'networkidle0' });
    const notFoundError = await page.$eval('.text-rose-300', (el) => el.textContent);
    record(
      'Invalid / Non-Existent Case ID Graceful Error',
      notFoundError.includes('Case') || notFoundError.includes('not found') || notFoundError.includes('Unable'),
      `Error displayed cleanly: "${notFoundError}"`
    );

    // 14. Check Console Errors during active gameplay (excluding intentional 404 test)
    const unexpectedErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('Failed to load case')
    );
    record(
      'Zero Unexpected Browser Console Errors',
      unexpectedErrors.length === 0,
      `Unexpected console errors during gameplay: ${unexpectedErrors.length}`
    );
  } catch (err) {
    record('Browser Automation Execution', false, err.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log('\n======================================================');
  console.log(`REAL BROWSER TEST RESULTS: ${results.filter((r) => r.success).length}/${results.length} PASSED`);
  console.log('======================================================\n');

  if (results.some((r) => !r.success)) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runBrowserTests();
