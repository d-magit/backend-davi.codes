const express = require('express');
const nitroHttpClient = require('nitro-http-client');
require('dotenv').config();

// Initialize
const app = express();
const httpClient = new nitroHttpClient.NitroHttpClient();
app.set('x-powered-by', false)

// Processes and sends webhook. Set to listen for Ko-fi for now
app.get('/wwwformhook', async (req, res) => {
  const donation = JSON.parse(req.query.data);
  const webhook = `https://davi.codes/finances/${donation.is_public ? 'publichook':'privatehook'}`
  const response = await httpClient.request(webhook, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: "@everyone",
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