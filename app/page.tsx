import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

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

  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process blueprint analysis." }, 
      { status: 500 }
    );
  }
}
