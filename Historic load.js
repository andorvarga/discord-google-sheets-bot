const { Client, GatewayIntentBits } = require('discord.js');
const { google } = require('googleapis');
const axios = require('axios');  // Import axios for making HTTP requests
const fs = require('fs');

// Load Google Sheets API credentials
const auth = new google.auth.GoogleAuth({
  keyFile: 'discord-bot-integration-438503-4a280d21b268.json', // Path to your downloaded service account JSON file
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Spreadsheet ID and sheet name
const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = '1hFHIMTyzj-js9A57qdRfpNwXq98cX6xVL-lI0HmMIUs';
const sheetName = 'Society Actuals';

const discordToken = 'MTI5NDg1MTI4NjgwMTU4NDE4OQ.Gqx7Oe.iT20YungeUZmVEvnQxunve6seSkaLtN0utbz60'; // Replace with your bot token
const channelId = '1291679142047121499';


// Fetch historic messages from a Discord channel
async function fetchMessages(before = null) {
  const url = `https://discord.com/api/v10/channels/${channelId}/messages?limit=100${before ? `&before=${before}` : ''}`;
  const response = await axios.get(url, {
    headers: {
      Authorization: `Bot ${discordToken}`,
    },
  });

  return response.data;
}

// Log messages to Google Sheets
async function logMessagesToSheets(messages) {
  const values = [];

  for (const message of messages) {
    if (message.embeds.length > 0) {
      const embed = message.embeds[0];
      const description = embed.description || '';
      const dataMap = {};

      // Split the description by new lines and extract data (same as the "live" version)
      const lines = description.split('\n');
      lines.forEach(line => {
        const parts = line.replace(/\*\*/g, '').split(':'); // Remove ** and split by colon
        if (parts.length === 2) {
          let key = parts[0].trim();
          let value = parts[1].trim();
          dataMap[key] = value;
        }
      });

      // Prepare the values array based on the extracted data
      const row = [
        new Date(message.timestamp).toISOString(), // Date
        dataMap['Steam'], // Steam
        dataMap['Character Name'], // Character Name
        dataMap['Job'], // Job
        dataMap['Amount'], // Amount
        // The Identifier can be omitted as per your preference
      ];

      values.push(row); // Add row to the values array
    }
  }

  if (values.length > 0) {
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A1:E1`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values,
        },
      });
      console.log('Messages logged to Google Sheets');
    } catch (err) {
      console.error('Error logging messages to Google Sheets:', err);
    }
  }
}

// Fetch all historic messages and log them
async function fetchAndLogAllMessages() {
  let lastMessageId = null;
  let allMessagesFetched = false;

  while (!allMessagesFetched) {
    const messages = await fetchMessages(lastMessageId);

    if (messages.length > 0) {
      await logMessagesToSheets(messages);
      lastMessageId = messages[messages.length - 1].id; // Get the ID of the last message for pagination
    }

    // Stop if there are no more messages to fetch
    if (messages.length < 100) {
      allMessagesFetched = true;
    }

    console.log(`Fetched ${messages.length} messages`);
  }

  console.log('All historic messages have been fetched and logged.');
}

// Start the process
fetchAndLogAllMessages().catch(err => {
  console.error('Error fetching and logging messages:', err);
});