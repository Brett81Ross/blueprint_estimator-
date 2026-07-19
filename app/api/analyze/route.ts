import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Overrides Vercel's default 10-second timeout. Allows up to 60 seconds for heavy images.
export const maxDuration = 60; 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[]; 
    
    const trade = formData.get("trade") || "General Contractor";
    const ceilingHeight = formData.get("ceilingHeight") || "Not specified";
    const projectType = formData.get("projectType") || "Not specified";
    const scale = formData.get("scale") || "Not specified";
    const sqft = formData.get("sqft") || "Not specified";
    const laborRate = formData.get("laborRate") || "Not specified";
    const location = formData.get("location") || "Not specified";

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: "No blueprints uploaded." }, { status: 400 });
    }

    // Locked strictly to the 3.5 Pro model for maximum accuracy
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-pro" });

    const parts: any[] = [
      { text: `You are an elite construction estimator. Perform a thorough, professional quantity takeoff for a ${trade} contractor.
      Context: ${projectType} project in ${location}, ${sqft} sqft, ${ceilingHeight} ceilings. 
      Blueprint Scale: ${scale}
      Labor rate: ${laborRate}.
      
      INSTRUCTIONS:
      1. Analyze the uploaded plans in extreme detail using the provided scale (${scale}) to estimate dimensions if none are explicitly written.
      2. If foundation details, slab thickness, rebar schedules, or structural wall sections are NOT visible, you MUST list them under 'Missing Information'.
      3. Break the report into these sections: Project Overview, Material Takeoff, Labor Takeoff, Detailed Cost Breakdown, and Mandatory Missing Information.` }
    ];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Data = buffer.toString("base64");

      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
    });

    const rawText = result.response.text();
    return NextResponse.json({ success: true, data: rawText });

  } catch (error: any) {
    console.error("API Route Error:", error);
    
    const errorMessage = error?.message || "Unknown server error.";

    if (errorMessage.includes('429') || errorMessage.includes('quota')) {
      return NextResponse.json(
        { success: false, error: "Google Rate Limit Exceeded: You uploaded too much data for the free tier. Please wait 60 seconds and try uploading fewer blueprints." }, 
        { status: 429 }
      );
    }

    if (errorMessage.includes('503')) {
      return NextResponse.json(
        { success: false, error: "Service Unavailable: The Gemini 3.5 model is currently experiencing high demand. Please try again in a few moments." }, 
        { status: 503 }
      );
    }

    // This forces the UI to show the EXACT error instead of a generic guess
    return NextResponse.json(
      { success: false, error: `Backend Error: ${errorMessage}` }, 
      { status: 500 }
    );
  }
}
