import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[]; 
    
    // Grab the details you typed into the frontend form
    const trade = formData.get("trade") || "General Contractor";
    const ceilingHeight = formData.get("ceilingHeight") || "Not specified";
    const projectType = formData.get("projectType") || "Not specified";
    const sqft = formData.get("sqft") || "Not specified";
    const laborRate = formData.get("laborRate") || "Not specified";

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: "No blueprints uploaded." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    // Build a prompt that actually uses your form data
    const parts: any[] = [
      { text: `You are an expert construction estimator. Analyze these blueprints and generate a takeoff report for a ${trade} contractor. 
      Context: ${projectType} project, ${sqft} sqft, ${ceilingHeight} ceilings. Labor rate: ${laborRate}.
      Break the report down into these exact sections: Project Overview, Material Takeoff, Labor Takeoff, Cost Breakdown, and Missing Information.` }
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

    // Extract the text and send it directly back to the frontend without forcing JSON
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
