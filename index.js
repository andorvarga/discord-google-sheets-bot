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
  console.log(`[DEBUG] Message received: ${message.content}`);
  console.log('Content:', message.content);
  console.log('Embeds:', message.embeds);
  // Ignore bot messages
  if (message.author.bot) return;

  const sheets = google.sheets({ version: 'v4', auth });

  const values = [
    [new Date().toISOString(), message.content]
  ];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:B`,
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });

    console.log("[INFO] Message logged to Google Sheets");
  } catch (err) {
    console.error("[ERROR] Failed to log to Sheets:", err);
  }
});


