import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      return NextResponse.json({ 
        error: 'Configuration Error: Server environment variable "GEMINI_API_KEY" is missing. Please check your Vercel project settings.' 
      }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    
    const trade = formData.get('trade') || 'General';
    const ceilingHeight = formData.get('ceilingHeight') || 'Unknown';
    const projectType = formData.get('projectType') || 'Unknown';
    const location = formData.get('location') || 'Unknown';
    const sqft = formData.get('sqft') || 'Unknown';
    const floors = formData.get('floors') || 'Unknown';
    const laborRate = formData.get('laborRate') || 'Standard';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Validation Error: No blueprint files were uploaded.' }, { status: 400 });
    }

    // Process file arrays into clean base64 chunks
    const fileParts = await Promise.all(
      files.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        let mimeType = file.type;
        const nameLower = file.name.toLowerCase();

        if (nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg')) {
          mimeType = 'image/jpeg';
        } else if (nameLower.endsWith('.png')) {
          mimeType = 'image/png';
        } else if (nameLower.endsWith('.webp')) {
          mimeType = 'image/webp';
        } else if (nameLower.endsWith('.pdf')) {
          mimeType = 'application/pdf';
        } else if (!mimeType) {
          mimeType = 'image/jpeg';
        }

        return {
          inlineData: {
            data: buffer.toString('base64'),
            mimeType: mimeType
          },
        };
      })
    );

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const prompt = `
      You are an expert construction estimator. Analyze these blueprints/documents and generate a highly structured takeoff report.
      
      Project Parameters:
      - Trade Focus: ${trade}
      - Ceiling Height: ${ceilingHeight}
      - Project Type: ${projectType}
      - Location/Region: ${location}
      - Square Footage: ${sqft}
      - Number of Floors: ${floors}
      - Labor Rate Assumption: ${laborRate}

      Format your response EXACTLY with these markdown sections and tables:

      ### Project Overview
      Trade: ${trade}
      Project Type: ${projectType}
      Estimated Scope: (Briefly describe what is visible across all documents)
      Confidence Score: (Rate 1-100% based on drawing clarity)

      ### Material Takeoff
      (Create a markdown table with columns: Item | Quantity | Unit)

      ### Labor Takeoff
      (Create a markdown table with columns: Task | Hours)

      ### Cost Breakdown
      Materials: $...
      Labor: $...
      Equipment: $...
      Waste Factor: ...%
      Estimated Total: $...

      ### Timeline
      Crew Size: ...
      Estimated Days: ...
      Milestones: (List key phases)

      ### Missing Information
      (List any critical details missing from the blueprints needed for 100% accuracy)
    `;

    const result = await model.generateContent([prompt, ...fileParts]);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ result: text }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ 
      error: `Server Error: ${error?.message || 'An unexpected error occurred.'}` 
    }, { status: 500 });
  }
}
