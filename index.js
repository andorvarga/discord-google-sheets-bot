const { Client, GatewayIntentBits } = require('discord.js');
const { google } = require('googleapis');
const fs = require('fs');

// Load Google Sheets API credentials
const auth = new google.auth.GoogleAuth({
  keyFile: 'discord-bot-integration-438503-4a280d21b268.json', // Path to your downloaded service account JSON file
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Spreadsheet ID and sheet name
const spreadsheetId = '1hFHIMTyzj-js9A57qdRfpNwXq98cX6xVL-lI0HmMIUs';
const sheetName = 'Society Actuals';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  // Check if the message has embeds
  if (message.embeds.length > 0) {
    const embed = message.embeds[0]; // Assuming the data is in the first embed
    console.log("Embed detected. Extracting data...");

    const description = embed.description || ""; // Get the description field from the embed
    console.log("Embed description:", description); // Log the description for verification

    // Now let's parse the description to extract key-value pairs
    const dataMap = {};

    // Split the description by new lines and extract data
    const lines = description.split('\n');
    lines.forEach(line => {
      const parts = line.replace(/\*\*/g, '').split(':'); // Remove ** and split by colon
      if (parts.length === 2) {
        let key = parts[0].trim();  // Trim spaces around the key
        let value = parts[1].trim(); // Trim spaces around the value
        dataMap[key] = value;  // Store in the dataMap
        console.log(`Key: '${key}', Value: '${value}'`); // Log each key-value pair
      }
    });

    // Prepare the values array for Google Sheets
    const values = [
      new Date().toISOString(), // Date
      dataMap['Steam'], // Steam
      dataMap['Character Name'], // Character Name
      dataMap['Job'], // Job
      dataMap['Amount'], // Amount
      // Identifier is intentionally omitted
    ];

    console.log("Logged to Sheets:", values); // Log the values array

    try {
      const sheets = google.sheets({ version: 'v4', auth });

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A1:E1`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [values],
        },
      });
    } catch (err) {
      console.error("Error appending data to Google Sheets:", err);
    }
  } else {
    console.log("No embeds found in this message.");
  }
});

// Log into Discord
client.login(process.env.Discord);

