const { Client, GatewayIntentBits } = require('discord.js');
const { google } = require('googleapis');
const fs = require('fs');

// Load Google Sheets API credentials
const auth = new google.auth.GoogleAuth({
  keyFile: 'google-svc.json', // Path to your service account JSON
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const path = 'discord-bot-integration-438503-4a280d21b268.json';

try {
  const rawKeyFile = fs.readFileSync(path, 'utf8');
  console.log('[DEBUG] Raw JSON Key File Content:', rawKeyFile.substring(0, 200), '...'); // first 200 chars only
  const parsed = JSON.parse(rawKeyFile);
  console.log('[DEBUG] Parsed service account email:', parsed.client_email);
} catch (err) {
  console.error('[ERROR] Failed to read or parse the service account JSON file:', err);
}

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
  // Only proceed if the message contains embeds
  if (message.embeds.length > 0) {
    const embed = message.embeds[0];
    const description = embed.description || '';

    console.log("[DEBUG] Embed description:", description);

    const values = [
      new Date().toISOString(), // Timestamp
      description               // Full embed description
    ];

    try {
      const sheets = google.sheets({ version: 'v4', auth });
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:B1`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [values],
        },
      });
      console.log("[INFO] Logged to Google Sheets:", values);
    } catch (err) {
      console.error("[ERROR] Failed to write to Sheets:", err);
    }
  }
});
client.login(process.env.Discord);

