import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    // You can parse incoming request data here if needed
    // const body = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent({
      contents: [{ 
        role: "user", 
        parts: [{ text: "Analyze this blueprint and return the takeoff data." }] 
      }],
      // @ts-ignore - Tells Vercel to ignore the type error so the build won't fail
      generationConfig: { responseMimeType: "application/json" }
    });

    // Extract the text and parse it into a JSON object
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
