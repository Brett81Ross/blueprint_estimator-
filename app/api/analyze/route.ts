import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    
    // Initialize model without the generationConfig here
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const fileParts = await Promise.all(
      files.map(async (file) => ({
        inlineData: {
          data: Buffer.from(await file.arrayBuffer()).toString('base64'),
          mimeType: file.type || 'image/jpeg'
        },
      }))
    );

    // MOVE generationConfig HERE
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: "Analyze this blueprint and return JSON." }, ...fileParts] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const jsonResponse = JSON.parse(result.response.text());
    return NextResponse.json({ data: jsonResponse }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
