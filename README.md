# Energy Dashboard Prototype

This project is a simple prototype of an energy monitoring platform. It simulates energy production and consumption data, generates random weather information and exposes a REST API along with a lightweight dashboard.

## Features

- **REST API**
  - `/energy-summary` – total production, total consumption, net balance, current weather data and correlation metrics.
  - `/historical-data` – time series data for the last 24 hours.
  - `/health` – basic service status.
- **Data Processing**
  - Stores the last 24 hours of minute–level data in memory.
  - Calculates Pearson correlation between solar irradiance and solar production and between temperature and consumption.
- **Frontend**
  - Simple dashboard implemented in HTML and JavaScript using Chart.js from a CDN.
  - Displays live totals and line charts for net balance, solar irradiance vs production, and temperature vs consumption.

## Running

This project uses only built‑in Node.js modules so no external dependencies are required. Start the server with:

```bash
node server.js
```

Then open `http://localhost:3000` in your browser.

## Notes

Actual API integrations and persistent storage are outside the scope of this prototype. The data here is randomly generated every minute.
