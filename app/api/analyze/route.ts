import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { validateContentLength, validateFiles, validateFileSignatures, validateUploadContentType, safeDocumentLabel, safePromptField } from "../../../lib/upload-guard";
import { configuredPolicyLimits, privacyHash, requestIp, truncateUserAgent } from "../../../lib/analysis-policy";
import { configuredPolicyStore } from "../../../lib/configured-policy-store";
import { SUBJECT_COOKIE, createSubjectToken, subjectCookieOptions, verifySubjectToken } from "../../../lib/analysis-identity";
import { PRO_COOKIE, verifyProAccessToken } from "../../../lib/pro-access";
import { buildAnalysisPrompt } from "../../../lib/analysis-prompt";
import { withTransientProviderRetry } from "../../../lib/provider-retry";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let activePolicyStore: ReturnType<typeof configuredPolicyStore> | undefined;
  let activeReservationId: string | undefined;
  let providerStarted = false;
  let outcomeRecorded = false;
  let pendingSubjectToken: string | undefined;

  const respond = (body: object, status = 200) => {
    const response = NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
    if (pendingSubjectToken) response.cookies.set(SUBJECT_COOKIE, pendingSubjectToken, subjectCookieOptions());
    return response;
  };

  const recordOutcome = async (outcome: "success" | "provider_error" | "server_error" | "client_rejected") => {
    if (!activePolicyStore || !activeReservationId || outcomeRecorded) return;
    await activePolicyStore.recordResult({ reservationId: activeReservationId, outcome });
    outcomeRecorded = true;
  };

  try {
    // Stage 1 runs before multipart parsing. Missing identity, limits, secrets,
    // database configuration, or durable-store availability fails closed.
    const cookieHeader = req.headers.get("cookie") || "";
    const subjectToken = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${SUBJECT_COOKIE}=`))
      ?.slice(SUBJECT_COOKIE.length + 1);
    let subjectId = verifySubjectToken(subjectToken ? decodeURIComponent(subjectToken) : undefined);
    if (!subjectId) {
      pendingSubjectToken = createSubjectToken();
      subjectId = verifySubjectToken(pendingSubjectToken);
    }
    if (!subjectId) throw new Error("Rapid Takeoff subject identity could not be established");

    const proToken = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${PRO_COOKIE}=`))
      ?.slice(PRO_COOKIE.length + 1);
    const plan = verifyProAccessToken(proToken ? decodeURIComponent(proToken) : undefined) ? "pro" as const : "free" as const;

    const identity = {
      plan,
      subjectHash: privacyHash(subjectId),
      ipHash: privacyHash(requestIp(req.headers)),
      now: new Date(),
    };
    const policyStore = configuredPolicyStore();
    activePolicyStore = policyStore;
    const policyLimits = configuredPolicyLimits();

    const logPolicyRejection = async (reason: string) => {
      try {
        await policyStore.logRejection({
          reason,
          ipHash: identity.ipHash,
          subjectHash: identity.subjectHash,
          userAgent: truncateUserAgent(req.headers.get("user-agent")),
          contentLength: (() => {
            const raw = req.headers.get("content-length");
            if (!raw || !/^\\d+$/.test(raw)) return undefined;
            const value = Number(raw);
            return Number.isSafeInteger(value) ? value : undefined;
          })(),
        });
      } catch {
        // Policy denial remains authoritative even if telemetry storage fails.
      }
    };
    const admission = await policyStore.reserveAdmission(identity, policyLimits);
    if (!admission.allowed) {
      await logPolicyRejection(admission.reason);
      return respond(
        { success: false, error: admission.status === 429 ? "Analysis limit reached. Please try again later." : "Analysis is temporarily unavailable." },
        admission.status
      );
    }
    const reservationId = admission.reservationId;
    activeReservationId = reservationId;

    const logClientRejection = async (reason: string) => {
      try {
        await policyStore.logRejection({
        reason,
        ipHash: identity.ipHash,
        subjectHash: identity.subjectHash,
        userAgent: truncateUserAgent(req.headers.get("user-agent")),
        contentLength: (() => {
          const raw = req.headers.get("content-length");
          if (!raw || !/^\d+$/.test(raw)) return undefined;
          const value = Number(raw);
          return Number.isSafeInteger(value) ? value : undefined;
        })(),
        });
      } catch {
        // Security telemetry must never replace the intended client rejection response.
      }
    };

    const lengthCheck = validateContentLength(req.headers.get("content-length"));
    if (!lengthCheck.ok) {
      await recordOutcome("client_rejected");
      await logClientRejection("content_length_rejected");
      return respond({ success: false, error: lengthCheck.error }, 413);
    }

    const contentTypeCheck = validateUploadContentType(req.headers.get("content-type"));
    if (!contentTypeCheck.ok) {
      await recordOutcome("client_rejected");
      await logClientRejection("content_type_rejected");
      return respond({ success: false, error: "Invalid upload request. Please upload blueprints using the Rapid Takeoff form." }, 400);
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      await recordOutcome("client_rejected");
      await logClientRejection("multipart_parse_rejected");
      return respond({ success: false, error: "Invalid upload request. Please check the blueprint files and try again." }, 400);
    }
    const files = formData.getAll("files") as File[];

    const trade = safePromptField(formData.get("trade"), "General Contractor");
    const ceilingHeight = safePromptField(formData.get("ceilingHeight"), "Not specified");
    const projectType = safePromptField(formData.get("projectType"), "Not specified");
    const scale = safePromptField(formData.get("scale"), "Not specified");
    const sqft = safePromptField(formData.get("sqft"), "Not specified");
    const floors = safePromptField(formData.get("floors"), "Not specified");
    const laborRate = safePromptField(formData.get("laborRate"), "Not specified");
    const costBasis = safePromptField(formData.get("costBasis"), "Not specified");
    const location = safePromptField(formData.get("location"), "Not specified");

    const fileCheck = validateFiles(files);
    if (!fileCheck.ok) {
      await recordOutcome("client_rejected");
      await logClientRejection("file_policy_rejected");
      return respond({ success: false, error: fileCheck.error }, 400);
    }

    const signatureCheck = await validateFileSignatures(files);
    if (!signatureCheck.ok) {
      await recordOutcome("client_rejected");
      await logClientRejection("file_signature_rejected");
      return respond({ success: false, error: signatureCheck.error }, 400);
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      await recordOutcome("server_error");
      return respond({ success: false, error: "Analysis is temporarily unavailable." }, 503);
    }

    const providerUsage = await policyStore.reserveProviderUsage(
      reservationId,
      { ...identity, now: new Date() },
      policyLimits
    );
    if (!providerUsage.allowed) {
      await logPolicyRejection(providerUsage.reason);
      return respond(
        { success: false, error: providerUsage.status === 429 ? "Analysis limit reached. Please try again later." : "Analysis is temporarily unavailable." },
        providerUsage.status
      );
    }

    providerStarted = true;

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const parts: any[] = [
      {
        text: buildAnalysisPrompt({
          trade,
          projectType,
          location,
          sqft,
          floors,
          ceilingHeight,
          scale,
          laborRate,
          costBasis,
        }),
      },
    ];

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Data = buffer.toString("base64");

      parts.push({ text: `UPLOAD ${index + 1}: ${safeDocumentLabel(file.name, index)}` });
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    }

    const result = await withTransientProviderRetry(
      () => model.generateContent({
        contents: [{ role: "user", parts }],
      }),
      {
        maxAttempts: 3,
        delaysMs: [1_000, 2_500],
        onRetry: ({ attempt, nextAttempt, status }) => {
          console.warn("Rapid Takeoff transient provider retry", { attempt, nextAttempt, status });
        },
      }
    );

    const rawText = result.response.text();
    await recordOutcome("success");
    return respond({
      success: true,
      data: rawText,
      engine: "Rapid Matrix Engine™",
      verification: "ProofTrace™ + Confidence Matrix™ + SheetLink™ + Conflict Radar™",
    });

  } catch (error: any) {
    try {
      await recordOutcome(providerStarted ? "provider_error" : "server_error");
    } catch {
      // Preserve the original request failure; ledger recording must not mask it.
    }

    console.error("Rapid Takeoff analysis request failed", {
      name: error?.name || "Error",
      status: error?.status || error?.statusCode,
    });

    const errorMessage = error?.message || "";

    if (errorMessage.includes("429") || errorMessage.includes("quota")) {
      return respond({ success: false, error: "Analysis capacity is temporarily limited. Please wait and try again." }, 429);
    }

    if (errorMessage.includes("503")) {
      return respond({ success: false, error: "Analysis is temporarily unavailable. Please try again shortly." }, 503);
    }

    return respond({ success: false, error: "Analysis failed. Please try again later." }, 500);
  }
}
