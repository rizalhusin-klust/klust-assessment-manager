import { google } from 'googleapis';

const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;
const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

const privateKey = privateKeyRaw
  ? privateKeyRaw.replace(/\\n/g, '\n')
  : undefined;

export function getSheetsClient() {
  if (!clientEmail || !privateKey) {
    console.warn(
      'Warning: GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY environment variables are missing. Google Sheets operations will run in mockup/simulation mode.'
    );
    return null;
  }

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('Failed to initialize Google Sheets client:', error);
    return null;
  }
}

export { spreadsheetId };
