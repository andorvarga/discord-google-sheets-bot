const { Client, GatewayIntentBits } = require('discord.js');
const { google } = require('googleapis');
const fs = require('fs');

// Load Google Sheets API credentials
const auth = new google.auth.GoogleAuth({
  keyFile: 'discord-bot-integration-438503-4a280d21b268.json', // Path to your service account JSON
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Spreadsheet ID and sheet name
const SPREADSHEET_ID = '1RkQTTAAizRMHTsn7hnClowbob5rYE0zM6riGguTK0Bs';
const SHEET_NAME = 'Logs';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return; // Skip messages from bots

  const timestamp = new Date().toISOString();
  const content = message.content;

  const values = [[timestamp, content]];
  console.log("Logging to sheet:", values);

  try {
    const sheets = google.sheets({ version: 'v4', auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:B`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values,
      },
    });

    console.log('Message logged successfully.');
  } catch (err) {
    console.error('Error appending to Google Sheets:', err);
  }
});

// Log into Discord
client.login(process.env.Discord);
client.on('messageCreate', async (message) => {
  console.log(`[DEBUG] Message received: ${message.content}`);

  // Ignore messages from bots (including itself)
  if (message.author.bot) return;

  // Rest of your code...
});
