import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/downloaded_briefs/
    const uploadDir = path.join(process.cwd(), 'public', 'downloaded_briefs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filePath = path.join(uploadDir, safeFileName);
    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/downloaded_briefs/${safeFileName}`;
    console.log(`Saved brief attachment to: ${filePath}`);

    return NextResponse.json({
      success: true,
      message: 'Brief document uploaded and saved locally.',
      url: relativeUrl,
      fileName: file.name
    });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Failed to upload document.', details: error.message }, { status: 500 });
  }
}
