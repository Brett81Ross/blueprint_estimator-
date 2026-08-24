import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const parts: any[] = [
      { text: `You are the Rapid Matrix Engine™, the proprietary construction-document analysis system inside Rapid Takeoff™.

Perform an evidence-backed professional takeoff for a ${trade} contractor.

PROJECT CONTEXT
Project type: ${projectType}
Location: ${location}
Area: ${sqft} sqft
Ceiling height: ${ceilingHeight}
Declared blueprint scale: ${scale}
Labor rate: ${laborRate}

RAPID MATRIX ENGINE™ ANALYSIS PROTOCOL
Run the project through these passes before producing the final report:

PASS 1 — DOCUMENT & SHEET INTELLIGENCE
Identify every uploaded sheet/document you can distinguish. Determine sheet number/title when visible, discipline, drawing type, schedules, legends, details, notes, revisions and scale information. Never silently assume two sheets represent the same scope.

PASS 2 — SCALE & DIMENSION VERIFICATION
Check the declared scale against visible dimensions and scale notes when possible. Flag conflicting, unreadable or missing scale information. Do not fabricate measurements when scale cannot be established reliably.

PASS 3 — TRADE MATRIX™ QUANTITY EXTRACTION
Analyze specifically for the ${trade} trade. Extract countable items, measured lengths, areas, volumes, assemblies, equipment, fixtures and other relevant quantities. Reconcile plan views against schedules, legends, details and notes when those sources are available.

PASS 4 — SHEETLINK™ CROSS-SHEET RECONCILIATION
Cross-check quantities and requirements across uploaded sheets. Detect duplicated scope, schedule/plan disagreements, conflicting notes, missing referenced details, inconsistent dimensions and potential omissions.

PASS 5 — PROOFTRACE™ EVIDENCE MAPPING
For EVERY material/takeoff quantity, provide its source evidence. Cite the most specific visible source possible using sheet number/title plus grid, room, detail, schedule, keynote, plan region or other locator. If the exact source cannot be established, explicitly write "Source not verified" rather than inventing evidence.

PASS 6 — CONFIDENCE MATRIX™
Assign every important quantity one confidence level:
• VERIFIED — directly supported by clearly visible plan/schedule/dimension evidence.
• PROBABLE — strongly supported but requires a minor assumption or incomplete cross-check.
• NEEDS REVIEW — scale, visibility, missing sheets, conflicting information or assumptions prevent reliable verification.
Include a short reason for the confidence rating.

PASS 7 — CONFLICT RADAR™
List discrepancies, contradictions, likely omissions, missing referenced sheets/details, scope ambiguity and potential RFI/change-order risks. Separate actual observed conflicts from possible risks. Never claim a conflict you cannot support from the uploaded documents.

PASS 8 — COST & LABOR VALIDATION
Calculate labor and material estimates only from quantities you can reasonably support. Clearly identify allowances, assumed unit prices and assumed productivity rates. Never present guessed pricing as a verified project fact.

FINAL REPORT — use these exact sections:

# Rapid Matrix Summary
Give project/trade overview, sheets analyzed, overall takeoff confidence, and the most important review warnings.

# Material Takeoff + ProofTrace™
Use a table where practical with: Item | Quantity | Unit | ProofTrace Source | Confidence | Confidence Reason.

# Labor Takeoff
Show labor assumptions, hours and costs. Identify what is calculated versus assumed.

# Detailed Cost Breakdown
Separate material, labor, allowances and total estimated cost. State all pricing assumptions.

# SheetLink™ Cross-Checks
Show reconciliations between plans, schedules, legends, details and notes.

# Conflict Radar™
List verified conflicts first, then possible RFI/change-order risks.

# Confidence Matrix™ Review Queue
Put every NEEDS REVIEW item here, followed by important PROBABLE items. Tell the contractor exactly what must be verified.

# Mandatory Missing Information
List missing information that prevents a complete takeoff. If foundation details, slab thickness, rebar schedules, structural wall sections, required schedules or referenced details are not visible when relevant to this trade, list them here.

# Rapid Takeoff Verification Notes
State which conclusions are directly evidenced versus inferred. Never fabricate sheet numbers, dimensions, quantities, symbols, prices, codes or plan references.

ACCURACY RULES
Accuracy is more important than completeness. If evidence is weak, lower confidence instead of guessing. Preserve separate quantities when documents conflict. Do not double-count repeated information across sheets. Treat schedules and details as cross-checks, not automatically as additional quantities. Every major number should be traceable to uploaded evidence or explicitly labeled as an assumption.` }
    ];

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Data = buffer.toString("base64");

      parts.push({ text: `UPLOAD ${index + 1}: ${file.name || `Document ${index + 1}`}` });
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
    return NextResponse.json({
      success: true,
      data: rawText,
      engine: "Rapid Matrix Engine™",
      verification: "ProofTrace™ + Confidence Matrix™ + SheetLink™ + Conflict Radar™",
    });

  } catch (error: any) {
    console.error("API Route Error:", error);

    const errorMessage = error?.message || "Unknown server error.";

    if (errorMessage.includes("429") || errorMessage.includes("quota")) {
      return NextResponse.json(
        { success: false, error: "Google Rate Limit Exceeded: You uploaded too much data for the free tier. Please wait 60 seconds and try uploading fewer blueprints." },
        { status: 429 }
      );
    }

    if (errorMessage.includes("503")) {
      return NextResponse.json(
        { success: false, error: "Service Unavailable: The Gemini model is currently experiencing high demand. Please try again in a few moments." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, error: `Backend Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
