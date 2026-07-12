import { NextResponse } from 'next/server';
import { getSheetsClient, spreadsheetId } from '@/lib/googleSheets';
import { provisionDriveFolders } from '@/lib/googleDrive';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || 'SAVE_DESIGN';
    const timestamp = new Date().toISOString();

    const sheets = getSheetsClient();

    // ==========================================
    // ACTION: SAVE_DESIGN (or legacy fallback)
    // ==========================================
    if (action === 'SAVE_DESIGN') {
      const { courseName, components, cloPloMapping } = body;

      // Validation
      if (!courseName || typeof courseName !== 'string' || courseName.trim() === '') {
        return NextResponse.json({ error: 'Course name is required.' }, { status: 400 });
      }
      if (!components || !Array.isArray(components) || components.length === 0) {
        return NextResponse.json({ error: 'At least one assessment component is required.' }, { status: 400 });
      }

      // Verify weight sum is exactly 100%
      const totalWeight = components.reduce((sum: number, comp: any) => sum + (comp.weight || 0), 0);
      if (Math.abs(totalWeight - 100) > 0.01) {
        return NextResponse.json({ error: `Total weightage must be exactly 100%. Currently it is ${totalWeight}%.` }, { status: 400 });
      }

      const componentsJson = JSON.stringify(components);
      const mappingJson = JSON.stringify(cloPloMapping || {});

      if (sheets && spreadsheetId) {
        try {
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Designs!A:D',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [[timestamp, courseName, componentsJson, mappingJson]],
            },
          });
          return NextResponse.json({
            success: true,
            message: 'Coursework design saved to Google Sheets successfully.',
            data: { timestamp, courseName, components, cloPloMapping },
          });
        } catch (sheetsError: any) {
          console.error('Google Sheets API Error:', sheetsError);
          return NextResponse.json({ error: 'Failed to write to Google Sheets.', details: sheetsError?.message || String(sheetsError) }, { status: 500 });
        }
      } else {
        console.log('--- GOOGLE SHEETS SIMULATION: SAVE_DESIGN ---');
        console.log('Course Name:', courseName);
        console.log('Components:', componentsJson);
        console.log('CLO/PLO Mapping:', mappingJson);
        return NextResponse.json({
          success: true,
          simulated: true,
          message: 'Saved design successfully in simulation mode.',
          data: { timestamp, courseName, components, cloPloMapping },
        });
      }
    }

    // ==========================================
    // ACTION: SAVE_RUBRIC
    // ==========================================
    if (action === 'SAVE_RUBRIC') {
      const { courseName, componentId, componentName, rubrics } = body;
      if (!courseName || !componentId || !rubrics) {
        return NextResponse.json({ error: 'Missing parameters for saving rubric.' }, { status: 400 });
      }

      const rubricsJson = JSON.stringify(rubrics);

      if (sheets && spreadsheetId) {
        try {
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Rubrics!A:D',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [[timestamp, courseName, componentName, rubricsJson]],
            },
          });
          return NextResponse.json({
            success: true,
            message: 'Rubric criteria saved to Google Sheets successfully.',
            data: { timestamp, courseName, componentName, rubrics },
          });
        } catch (sheetsError: any) {
          return NextResponse.json({ error: 'Failed to write rubric to Google Sheets.', details: sheetsError?.message || String(sheetsError) }, { status: 500 });
        }
      } else {
        console.log('--- GOOGLE SHEETS SIMULATION: SAVE_RUBRIC ---');
        console.log('Course Name:', courseName);
        console.log('Component Name:', componentName);
        console.log('Rubric Specs:', rubricsJson);
        return NextResponse.json({
          success: true,
          simulated: true,
          message: 'Saved rubrics successfully in simulation mode.',
          data: { timestamp, courseName, componentName, rubrics },
        });
      }
    }

    // ==========================================
    // ACTION: SAVE_GRADES
    // ==========================================
    if (action === 'SAVE_GRADES') {
      const { courseName, grades } = body; // grades: array of { studentId, studentName, componentGrades: { compId: score } }
      if (!courseName || !grades || !Array.isArray(grades)) {
        return NextResponse.json({ error: 'Missing parameters for saving grades.' }, { status: 400 });
      }

      const gradesJson = JSON.stringify(grades);

      if (sheets && spreadsheetId) {
        try {
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Grades!A:C',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [[timestamp, courseName, gradesJson]],
            },
          });
          return NextResponse.json({
            success: true,
            message: 'Student grades synced to Google Sheets successfully.',
            data: { timestamp, courseName, count: grades.length },
          });
        } catch (sheetsError: any) {
          return NextResponse.json({ error: 'Failed to write grades to Google Sheets.', details: sheetsError?.message || String(sheetsError) }, { status: 500 });
        }
      } else {
        console.log('--- GOOGLE SHEETS SIMULATION: SAVE_GRADES ---');
        console.log('Course Name:', courseName);
        console.log('Synced Student Grades Count:', grades.length);
        console.log('Grades Data:', gradesJson);
        return NextResponse.json({
          success: true,
          simulated: true,
          message: 'Student grades synced successfully in simulation mode.',
          data: { timestamp, courseName, count: grades.length },
        });
      }
    }

    // ==========================================
    // ACTION: PROVISION_DRIVE
    // ==========================================
    if (action === 'PROVISION_DRIVE') {
      const { courseCode, components } = body;
      if (!courseCode || !components || !Array.isArray(components)) {
        return NextResponse.json({ error: 'Missing parameters for provisioning drive.' }, { status: 400 });
      }

      try {
        const result = await provisionDriveFolders(courseCode, components);
        return NextResponse.json({
          success: true,
          message: result.simulated
            ? 'Folders provisioned in Google Drive simulator successfully.'
            : 'Google Drive folders created successfully.',
          simulated: result.simulated,
          folderLinks: result.folderLinks,
        });
      } catch (driveError: any) {
        return NextResponse.json({ error: 'Failed to provision Drive folders.', details: driveError?.message || String(driveError) }, { status: 500 });
      }
    }

    // ==========================================
    // ACTION: EXPORT_SAMPLING
    // ==========================================
    if (action === 'EXPORT_SAMPLING') {
      const { courseName, samplingRule, sampledStudentIds, samples } = body;
      if (!courseName || !samplingRule || !sampledStudentIds) {
        return NextResponse.json({ error: 'Missing parameters for export sampling.' }, { status: 400 });
      }

      const samplingJson = JSON.stringify(samples);

      if (sheets && spreadsheetId) {
        try {
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Sampling!A:D',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [[timestamp, courseName, samplingRule, samplingJson]],
            },
          });
          return NextResponse.json({
            success: true,
            message: 'Moderator pack sampling list exported and logged to Google Sheets successfully.',
            data: { timestamp, courseName, samplingRule, count: sampledStudentIds.length },
          });
        } catch (sheetsError: any) {
          return NextResponse.json({ error: 'Failed to log sampling list to Google Sheets.', details: sheetsError?.message || String(sheetsError) }, { status: 500 });
        }
      } else {
        console.log('--- GOOGLE SHEETS SIMULATION: EXPORT_SAMPLING ---');
        console.log('Course Name:', courseName);
        console.log('Sampling Rule:', samplingRule);
        console.log('Sampled Students:', sampledStudentIds);
        return NextResponse.json({
          success: true,
          simulated: true,
          message: 'Moderator pack compiled and logged in simulation mode.',
          data: { timestamp, courseName, samplingRule, count: sampledStudentIds.length },
        });
      }
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error.', details: error?.message || String(error) }, { status: 500 });
  }
}
