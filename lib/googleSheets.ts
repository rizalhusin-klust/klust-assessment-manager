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

/**
 * Verifies if required tabs exist in the Google Spreadsheet, and creates them if missing.
 */
export async function ensureSheetsExist(sheets: any, spreadsheetId: string) {
  try {
    const response = await sheets.spreadsheets.get({ spreadsheetId });
    const existingTitles = response.data.sheets?.map((s: any) => s.properties?.title) || [];
    
    const requiredSheets = ['Designs', 'Rubrics', 'Grades', 'Sampling'];
    const missingSheets = requiredSheets.filter(title => !existingTitles.includes(title));
    
    if (missingSheets.length > 0) {
      const requests = missingSheets.map(title => ({
        addSheet: {
          properties: {
            title
          }
        }
      }));
      
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests
        }
      });
      console.log(`Successfully created missing spreadsheet tabs: ${missingSheets.join(', ')}`);
    }
  } catch (error) {
    console.error('Failed to verify or create missing spreadsheet tabs:', error);
  }
}

export { spreadsheetId };
