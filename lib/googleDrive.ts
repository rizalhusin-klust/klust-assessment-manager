import { google } from 'googleapis';

const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;

const privateKey = privateKeyRaw
  ? privateKeyRaw.replace(/\\n/g, '\n')
  : undefined;

export function getDriveClient() {
  if (!clientEmail || !privateKey) {
    console.warn(
      'Warning: GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY environment variables are missing. Google Drive operations will run in mockup/simulation mode.'
    );
    return null;
  }

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    return google.drive({ version: 'v3', auth });
  } catch (error) {
    console.error('Failed to initialize Google Drive client:', error);
    return null;
  }
}

/**
 * Creates folders dynamically in Google Drive (real API or simulation fallback)
 */
export async function provisionDriveFolders(courseCode: string, components: string[], shareEmail?: string) {
  const drive = getDriveClient();
  const folderLinks: Record<string, string> = {};

  if (!drive) {
    // Mock simulation links
    const mockParentId = Math.random().toString(36).substring(2, 10);
    folderLinks['Parent Course Folder'] = `https://drive.google.com/drive/folders/mock_${mockParentId}`;
    components.forEach((comp) => {
      const compId = Math.random().toString(36).substring(2, 10);
      folderLinks[comp] = `https://drive.google.com/drive/folders/mock_${compId}`;
    });
    return { simulated: true, folderLinks };
  }

  try {
    // 1. Create Course Root Folder
    const parentResponse = await drive.files.create({
      requestBody: {
        name: `CourseArchitect - ${courseCode}`,
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id,webViewLink',
    });

    const parentId = parentResponse.data.id;
    const parentLink = parentResponse.data.webViewLink || '';
    folderLinks['Parent Course Folder'] = parentLink;

    // Share folder with specified user email if provided
    if (shareEmail && shareEmail.trim() && parentId) {
      try {
        await drive.permissions.create({
          fileId: parentId,
          requestBody: {
            role: 'writer',
            type: 'user',
            emailAddress: shareEmail.trim()
          }
        });
      } catch (shareError) {
        console.error(`Failed to create permission for ${shareEmail}:`, shareError);
      }
    }

    // 2. Create Component Subfolders
    for (const comp of components) {
      if (!comp.trim()) continue;
      const subFolderResponse = await drive.files.create({
        requestBody: {
          name: comp,
          mimeType: 'application/vnd.google-apps.folder',
          parents: parentId ? [parentId] : [],
        },
        fields: 'webViewLink',
      });
      folderLinks[comp] = subFolderResponse.data.webViewLink || '';
    }

    return { simulated: false, folderLinks };
  } catch (error: any) {
    console.error('Google Drive API Error during provisioning:', error);
    throw error;
  }
}
