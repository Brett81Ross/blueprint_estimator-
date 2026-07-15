import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. Initialize with your specific model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ 
  model: 'gemini-3.5-flash',
  generationConfig: { responseMimeType: "application/json" } // Ensures machine-readable takeoff data
});

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB safety limit

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    
    // Validate inputs
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded.' }, { status: 400 });
    }

    // Process files with size checks
    const fileParts = await Promise.all(
      files.map(async (file) => {
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File ${file.name} exceeds the 20MB limit.`);
        }
        
        const bytes = await file.arrayBuffer();
        return {
          inlineData: {
            data: Buffer.from(bytes).toString('base64'),
            mimeType: file.type || 'image/jpeg'
          },
        };
      })
    );

    // Optimized prompt for Gemini 3.5 Flash
    const prompt = `
      You are an expert construction takeoff engine. Analyze these blueprints.
      Return ONLY a JSON object. No markdown, no conversational filler.
      
      Structure:
      {
        "trade": "${formData.get('trade') || 'General'}",
        "takeoff_items": [{"item": "string", "count": number, "unit": "string", "location": "string"}],
        "linear_measurements": {"total_feet": number},
        "area_sq_ft": number,
        "confidence_score": number
      }
    `;

    const result = await model.generateContent([prompt, ...fileParts]);
    const jsonResponse = JSON.parse(result.response.text());

    return NextResponse.json({ data: jsonResponse }, { status: 200 });

  } catch (error: any) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
