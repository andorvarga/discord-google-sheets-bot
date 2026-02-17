const { Client, GatewayIntentBits } = require('discord.js');
const { google } = require('googleapis');

let credentials;
try {
  const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf8');
  credentials = JSON.parse(decoded);
} catch (err) {
  console.error('[ERROR] Failed to decode GOOGLE_CREDENTIALS:', err);
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = '1RkQTTAAizRMHTsn7hnClowbob5rYE0zM6riGguTK0Bs';
const sheetName = 'Logs';

const discordToken = process.env.Discord1?.trim();
console.log('[DEBUG] Token length:', discordToken?.length, 'ends with:', JSON.stringify(discordToken?.slice(-5)));
const channelId = '943188854003892275';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  const values = [];

  if (message.embeds.length > 0) {
    const embed = message.embeds[0];
    const description = embed.description || '';
    const lines = description.split('\n');

    let player = '';
    let vehicle = '';
    let mechanic = '';
    let inTuningList = false;
    const isTuningBill = embed.title && embed.title.includes('Tuning Bill');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('Player')) {
        const playerMatch = line.match(/Player\s+([^\[]+)/);
        const vehicleMatch = line.match(/vehicle\s+(.+?\(.*?\))/i);

        if (playerMatch) player = playerMatch[1].replace(/\*/g, '').trim();
        if (vehicleMatch) vehicle = vehicleMatch[1].replace(/\*/g, '').trim();

        if (!isTuningBill) {
          mechanic = player;
        }
      }

      if (isTuningBill) {
        const mechMatch = line.match(/Mechanic\s+([^\[]+)/);
        if (mechMatch) mechanic = mechMatch[1].replace(/\*/g, '').trim();
      }

      if (line.includes('Tuning List:')) {
        inTuningList = true;
        continue;
      }

      if (inTuningList && (line.startsWith('Discount') || /^\d+:/.test(line))) {
        break;
      }

      if (inTuningList && /\$\d+/.test(line)) {
        const itemMatch = line.match(/^(.*?)\s*\$([\d,]+)/);
        if (itemMatch) {
          const service = itemMatch[1].replace(/\*/g, '').replace(/^[\s\-–—]+/, '').trim();
          const price = itemMatch[2].replace(/,/g, '');

          values.push([
            new Date(message.createdTimestamp).toISOString(),
            player,
            vehicle,
            service,
            price,
            mechanic,
          ]);
        }
      }
    }
  }

  if (values.length > 0) {
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A1:F1`,
        valueInputOption: 'USER_ENTERED',
        resource: { values },
      });
      console.log('Message logged from live listener.');
    } catch (err) {
      console.error('Error logging to Google Sheets:', err);
    }
  }
});

client.login(discordToken);
