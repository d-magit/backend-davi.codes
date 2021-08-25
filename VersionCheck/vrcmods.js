const express = require('express');
const fs = require('fs');
const nitroHttpClient = require('nitro-http-client');
require('dotenv').config();

// Initialize
const app = express();
const httpClient = new nitroHttpClient.NitroHttpClient();
app.set('x-powered-by', false);

// Compute version
function parseVersion(clientVersion, serverVersion) { // Versions' digits go from 0 to 9. 
  const client = parseInt(clientVersion.split('.').join(''));
  const server = parseInt(serverVersion.split('.').join(''));

  if (server === client) return 'UPDATED';
  if (server > client) return 'OUTDATED';
  return 'Welcome, HR.';
}

// Receives and parse data
app.use((req, res, next) => {
  let data = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => data += chunk);
  req.on('end', () => {
    req.rawBody = data;
    try { req.body = JSON.parse(data); } catch (e) {}
    next();
  });
});

// Passes to POST then returns to finish with webhook
app.use(async (req, res, next) => {
  next();
  console.log(`[${new Date().toUTCString()}] Request on endpoint ${req.originalUrl} with body: ${req.rawBody}`);
  await httpClient.request('https://davi.codes/vrchat/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: `\`[${new Date().toUTCString()}]\` Request on endpoint \`${req.originalUrl}\` with body: \`${req.rawBody}\``
    })
  });
});

// Analyzes and returns response of POST
app.post('/vrchat/api', async (req, res) => {
  if (!req.body.name || !req.body.version) return res.status(400).json({ 'error': 'Invalid body' });

  const mod = JSON.parse(fs.readFileSync('../html/vrchat/mods.json', 'utf8')).find((element) => element.name === req.body.name);

  if (!mod) return res.status(500).json({ 'error': 'Mod not found' });

  res.json({ 'result': parseVersion(req.body.version, mod.version), 'latest': mod.version });
});

process.on('uncaughtException', error => console.error(`Uncaught Exception: ${error}`));

const port = process.env.PORT;
app.listen(port, () => console.info(`[VRCMods] Started on port ${port}.`));