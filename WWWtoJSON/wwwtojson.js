const express = require('express');
const qs = require('querystring');
const nitroHttpClient = require('nitro-http-client');
require('dotenv').config();

// Initialize
const app = express();
const httpClient = new nitroHttpClient.NitroHttpClient();
app.set('x-powered-by', false)

// Receives and parse data
app.use((req, res, next) => {
  let data = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => data += chunk);
  req.on('end', () => {
    try { 
      req.rawBody = qs.parse(data);
      req.body =  JSON.parse(req.rawBody.data); 
    } catch (e) {}
    next();
  });
});

// Processes and sends webhook. Set to listen for Ko-fi for now.
app.post('/finances/wwwformhook', async (req, res) => {
  var isinvalid = false;

  var donation = null;
  try { donation = req.body; } 
  catch (e)  { isinvalid = true; }

  var keys = [];
  for(var key in donation) keys.push(key);
  if ( JSON.stringify(keys) != 
  JSON.stringify(['message_id','timestamp','type','is_public','from_name','message','amount','url','email','currency','is_subscription_payment','is_first_subscription_payment','kofi_transaction_id'])) 
  { isinvalid = true; }

  if (isinvalid) {
    await httpClient.request('https://davi.codes/finances/privatehook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: `\`[${new Date().toUTCString()}]\` <@!227477384356429824>, getting invalid request on endpoint \`${req.path}\`! \nBody: \`${JSON.stringify(req.rawBody)}\``
      })
    });
    return res.status(400).json({ 'error': 'Invalid body' });
  }

  const webhook = `https://davi.codes/finances/${donation.is_public ? 'publichook':'privatehook'}`
  const response = await httpClient.request(webhook, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: "<@!227477384356429824>",
      embeds: [
        {
          color: 16711756,
          description: `**Full name:** ${donation.from_name} \n**Email:** ${donation.email}\n\n**Event:** \`${donation.is_public ? "Public":"Private"} ${donation.type}\` \n**Amount:** \`${donation.amount} ${donation.currency}\`\n\nThis is ${donation.is_subscription_payment ? "":"not"} a subscription payment. ${donation.is_first_subscription_payment ? "**They have subscribed for the first time!**":""}\n\n**Message ID:** \`${donation.message_id}\`\n**Ko-fi Transaction ID:** \`${donation.kofi_transaction_id}\`\n\n[Click here for more details.](${donation.url})`,
          timestamp: donation.timestamp,
          author: {
            name: "Ko-fi",
            icon_url: "https://davi.codes/giticons/ko-fi.png"
          },
          thumbnail: {
            url: "https://davi.codes/giticons/ko-fi.png"
          },
          footer: {
            text: "Ko-fi",
            icon_url: "https://davi.codes/giticons/ko-fi.png"
          }
        }
      ]
    })
  });
  res.send(response.body);
});

process.on('uncaughtException', error => console.error(`Uncaught Exception: ${error}`));

const port = process.env.PORT;
app.listen(port, () => console.info(`[WWWtoJSON] Started on port ${port}.`));