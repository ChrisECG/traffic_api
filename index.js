const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');

  res.header('X-Powered-By', 'Christian Elías');
  res.header('Content-Type', 'application/json');

  next();
});

async function getColor(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForSelector('.fontHeadlineSmall');

  const item = await page.$('.fontHeadlineSmall');
  const color = await item.evaluate((node) =>
    window.getComputedStyle(node).getPropertyValue('color')
  );

  await browser.close();
  return color;
}

app.get('/', (req, res) => {
  res.json({
    name: 'Traffic API',
    version: '1.0.0',
    description: 'Get traffic status based on the location',
    endpoints: {
      '/traffic': 'Get traffic status based on the location',
      '/docs': 'Get the documentation of the API',
      '/health': 'Check the health of the API',
    },
    provided_by: 'Christian Elías <contacto@christianecg.com>',
    github: 'https://github.com/ChristianECG/traffic_api',
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/traffic', async (req, res) => {
  const initial_lat = parseFloat(req.query.lat) || 0;
  const initial_lon = parseFloat(req.query.lon) || 0;

  const final_lat = initial_lat + 0.001;
  const final_lon = initial_lon + 0.0;

  const intermediate_lat = (initial_lat + final_lat) / 2;
  const intermediate_lon = (initial_lon + final_lon) / 2;

  const domain = 'https://www.google.com/maps/dir/';
  const initial = `${initial_lat},${initial_lon}`;
  const intermediate = `${intermediate_lat},${intermediate_lon}`;
  const final = `${final_lat},${final_lon}`;
  const complementary = `data=!3m1!4b1!4m2!4m1!3e0?entry=ttu`;
  const url = `${domain}${initial}/${intermediate}/@${final}/${complementary}`;

  try {
    const color = await getColor(url);
    if (color == 'rgb(176, 91, 0)') res.json({ status: 'medium' });
    else if (color == 'rgb(217, 48, 37)') res.json({ status: 'high' });
    else res.json({ status: 'low' });
  } catch (error) {
    res.json({ status: 'error' });
  }
});

app.get('/docs', (req, res) => {
  const parameters = {
    lat: 'Latitude of the location',
    lon: 'Longitude of the location',
  };

  const values = {
    low: 'Traffic is low',
    medium: 'Traffic is medium',
    high: 'Traffic is high',
    error: 'An error occurred while fetching the data',
  };

  const status = { description: 'Traffic status', values };
  const response = { status };

  res.json({
    description: 'Get traffic status based on the location',
    parameters,
    response,
  });
});

app.get('*', (req, res) => res.redirect('/'));

app.listen(process.env.PORT || 3000);
