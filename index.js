const puppeteer = require('puppeteer-extra');
const userAgent = require('user-agents');

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const chromeOptions = {
  headless: true,
  defaultViewport: null,
  args: [
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-setuid-sandbox",
    "--no-sandbox",
  ]
};
(async function main() {
  const browser = await puppeteer.launch(chromeOptions);
  const page = await browser.newPage();
  await page.setUserAgent(userAgent.toString())
  await page.setJavaScriptEnabled(true);
  await page.setDefaultNavigationTimeout(0);
  // Skip images/styles/fonts loading for performance
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.evaluateOnNewDocument(() => {
    // Pass webdriver check
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
  });

  await page.evaluateOnNewDocument(() => {
    // Pass chrome check
    window.chrome = {
      runtime: {},
      // etc.
    };
  });

  await page.evaluateOnNewDocument(() => {
    //Pass notifications check
    const originalQuery = window.navigator.permissions.query;
    return window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
  });

  await page.goto('https://popcat.click/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(10000)
  await page.$eval('#app', () => {
    setInterval(() => {
      document.dispatchEvent(new Event('keydown'))
      document.dispatchEvent(new Event('keyup'))
    }, 38)
  })
  // await page.waitForTimeout(10000)
  // await page.screenshot({ path: 'testresult.png', fullPage: true })
})()
