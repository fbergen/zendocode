const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3000;

let productionData = [];
let consumptionData = [];
let weatherData = [];
let correlationHistory = [];

const MAX_POINTS = 24 * 60; // store last 24h of minute-level data

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

function pearsonCorrelation(x, y) {
  if (x.length !== y.length || x.length === 0) return 0;
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

function updateData() {
  const timestamp = Date.now();
  const solarIrradiance = getRandom(0, 1000); // W/m2
  const temperature = getRandom(0, 35); // C
  const solarProduction = solarIrradiance * 0.001 + getRandom(0, 5); // kWh
  const windProduction = getRandom(0, 10); // kWh
  const totalProduction = solarProduction + windProduction;
  const consumption = getRandom(5, 15); // kWh

  productionData.push({ timestamp, solarProduction, windProduction, totalProduction });
  consumptionData.push({ timestamp, consumption });
  weatherData.push({ timestamp, solarIrradiance, temperature });

  if (productionData.length > MAX_POINTS) productionData.shift();
  if (consumptionData.length > MAX_POINTS) consumptionData.shift();
  if (weatherData.length > MAX_POINTS) weatherData.shift();

  // correlations
  const solarProd = productionData.map(p => p.solarProduction);
  const irr = weatherData.map(w => w.solarIrradiance);
  const temp = weatherData.map(w => w.temperature);
  const cons = consumptionData.map(c => c.consumption);
  const corr1 = pearsonCorrelation(irr, solarProd);
  const corr2 = pearsonCorrelation(temp, cons);

  const corrEntry = {
    timestamp,
    solar_irradiance_vs_production_correlation: corr1,
    temperature_vs_consumption_correlation: corr2
  };
  correlationHistory.push(corrEntry);
  if (correlationHistory.length > MAX_POINTS) correlationHistory.shift();
}

// initial data fill
for (let i = 0; i < 60; i++) {
  updateData();
}

setInterval(updateData, 60 * 1000); // update every minute

function handleEnergySummary(res) {
  const totalProduction = productionData.reduce((sum, p) => sum + p.totalProduction, 0);
  const totalConsumption = consumptionData.reduce((sum, c) => sum + c.consumption, 0);
  const netBalance = totalProduction - totalConsumption;
  const currentWeather = weatherData[weatherData.length - 1] || {};
  const currentCorrelation = correlationHistory[correlationHistory.length - 1] || {};
  const data = {
    totalProduction,
    totalConsumption,
    netBalance,
    currentWeather,
    correlation: currentCorrelation
  };
  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function handleHistoricalData(res) {
  const data = {
    production: productionData,
    consumption: consumptionData,
    weather: weatherData,
    correlations: correlationHistory
  };
  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function handleHealth(res) {
  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({ status: 'ok' }));
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  if (parsed.pathname === '/energy-summary') {
    handleEnergySummary(res);
  } else if (parsed.pathname === '/historical-data') {
    handleHistoricalData(res);
  } else if (parsed.pathname === '/health') {
    handleHealth(res);
  } else if (parsed.pathname === '/') {
    res.writeHead(301, { Location: '/index.html' });
    res.end();
  } else {
    // serve static files
    if (parsed.pathname.startsWith('/')) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, 'public', parsed.pathname);
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
        } else {
          let contentType = 'text/plain';
          if (filePath.endsWith('.html')) contentType = 'text/html';
          else if (filePath.endsWith('.js')) contentType = 'application/javascript';
          else if (filePath.endsWith('.css')) contentType = 'text/css';
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(data);
        }
      });
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
