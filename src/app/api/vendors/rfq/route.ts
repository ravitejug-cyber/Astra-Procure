import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Vendor, DiscoveryRequest, RFQTemplate } from "@/lib/vendorTypes";
import type { CostingResult } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface RFQRequestBody {
  vendor: Vendor;
  partDetails: CostingResult;
  request: DiscoveryRequest;
}

function deepClean<T>(val: T): T {
  if (typeof val === "string") return val.replace(/[•‣◦⁃∙–—]+/g, "").trimStart() as unknown as T;
  if (Array.isArray(val)) return val.map(deepClean) as unknown as T;
  if (val !== null && typeof val === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) out[k] = deepClean(v);
    return out as unknown as T;
  }
  return val;
}

function parseRFQTemplate(raw: string): RFQTemplate {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = deepClean(JSON.parse(cleaned));
  return {
    vendorName: parsed.vendorName ?? "",
    subject: parsed.subject ?? "",
    emailBody: parsed.emailBody ?? "",
    technicalSummary: parsed.technicalSummary ?? "",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: RFQRequestBody = await req.json();
    if (!body.vendor || !body.request) {
      return NextResponse.json({ error: "Missing vendor or request data." }, { status: 400 });
    }

    const { vendor, partDetails, request } = body;

    const systemPrompt = `You are a senior procurement manager at an Indian manufacturing company. Your task is to generate a professional, detailed Request for Quotation (RFQ) email to an Indian aluminium part manufacturer.

Generate a complete RFQ package that is professional, specific, and actionable. The email should:
- Follow formal Indian business email conventions
- Include all technical specifications clearly
- Request specific deliverables (price per unit, tooling cost, lead time, DFM feedback)
- Mention quality requirements and certifications expected
- Include commercial terms requirements (payment terms, warranty, packaging)
- Be warm but professional in tone

RESPOND ONLY WITH VALID JSON - NO MARKDOWN FENCES, NO EXTRA TEXT.

JSON schema:
{
  "vendorName": "string",
  "subject": "string (concise professional subject line)",
  "emailBody": "string (full professional email body, use \\n for line breaks)",
  "technicalSummary": "string (detailed technical specification document text, use \\n for line breaks)"
}`;

    const userMessage = `Generate a professional RFQ email for the following:

VENDOR:
- Name: ${vendor.name}
- Location: ${vendor.city}, ${vendor.state}
- Capabilities: ${vendor.processCapabilities.join(", ")}
- Certifications: ${vendor.certifications.join(", ")}

PART REQUIREMENTS:
- Part Description: ${request.partDescription}
- Manufacturing Method: ${request.manufacturingMethod}
- Material: ${request.material}
- Tolerance Level: ${request.toleranceLevel}
- Surface Finish: ${request.surfaceFinish}
- Complexity: ${request.complexity}
- Batch Quantity: ${request.batchQuantity.toLocaleString()} units

${partDetails ? `COST ANALYSIS DATA:
- Part Name: ${partDetails.partSummary?.partName ?? "Aluminium Housing"}
- Manufacturing Method: ${partDetails.partSummary?.manufacturingMethod ?? request.manufacturingMethod}
- Estimated Weight: ${partDetails.partSummary?.estimatedWeight ?? "TBD"}
- Complexity Level: ${partDetails.partSummary?.complexityLevel ?? request.complexity}
- Suggested Batch Size: ${partDetails.partSummary?.suggestedBatchSize ?? request.batchQuantity}
- Recommended Process: ${partDetails.processAnalysis?.recommendedProcess ?? request.manufacturingMethod}
- Tolerance Capability: ${partDetails.processAnalysis?.suggestedToleranceCapability ?? request.toleranceLevel}` : ""}

Return ONLY valid JSON.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const rawText = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as Anthropic.TextBlock).text)
      .join("");

    const result = parseRFQTemplate(rawText);
    return NextResponse.json({ result });
  } catch (err) {
    console.error("[/api/vendors/rfq]", err);
    const message = err instanceof Error ? err.message : "RFQ generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
