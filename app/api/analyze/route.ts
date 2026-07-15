import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    // 1. Grab the form data sent from your frontend
    const formData = await req.formData();
    
    // NOTE: "files" is the assumed key. This needs to match what your frontend appends to FormData!
    const files = formData.getAll("files") as File[]; 

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: "No blueprints uploaded." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 2. Start building the prompt payload
    const parts: any[] = [
      { text: "Analyze these blueprints and return the takeoff data. Extract wall lengths, fixture counts, and dimensions where visible." }
    ];

    // 3. Convert each uploaded image to Base64 and attach it
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

    // 4. Send it all to Gemini
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      // @ts-ignore
      generationConfig: { responseMimeType: "application/json" }
    });

    const rawText = result.response.text();
    const jsonResponse = JSON.parse(rawText);

    return NextResponse.json({ success: true, data: jsonResponse });

  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process blueprint analysis." }, 
      { status: 500 }
    );
  }
}
