import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Messages } from "@anthropic-ai/sdk/resources";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import type { AnalyzeRequest, CostingResult } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildUserMessage(req: AnalyzeRequest): Anthropic.MessageParam {
  const textBlock: Messages.TextBlockParam = {
    type: "text",
    text: `Please analyze the uploaded engineering documents and provide a detailed manufacturing cost estimate.

Region: ${req.region}
Batch Quantity: ${req.batchQuantity.toLocaleString()} units
Preferred Manufacturing Method: ${req.preferredMethod}
${req.material ? `RAW MATERIAL (USER SPECIFIED - YOU MUST USE THIS EXACTLY): ${req.material}` : ""}
${req.additionalNotes ? `Additional Notes: ${req.additionalNotes}` : ""}

Files uploaded: ${req.files.map((f) => f.name).join(", ")}

${req.material ? `IMPORTANT: The user has explicitly specified the raw material as "${req.material}". Use this exact material for ALL cost calculations including material rate, machinability factor, machining time, surface finish, and tooling. Do NOT override this with any material you see in the drawing.` : "Identify the raw material from the drawing and use it for all calculations."}

Respond ONLY with raw JSON matching the specified format. No markdown fences, no extra text.`,
  };

  const imageBlocks: Messages.ImageBlockParam[] = [];
  const documentBlocks: Messages.DocumentBlockParam[] = [];

  for (const file of req.files) {
    if (file.type.startsWith("image/")) {
      const mediaType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
      const base64 = file.dataUrl.split(",")[1];
      imageBlocks.push({
        type: "image",
        source: { type: "base64", media_type: mediaType, data: base64 },
      });
    } else if (file.type === "application/pdf") {
      const base64 = file.dataUrl.split(",")[1];
      documentBlocks.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: base64 },
      } as Messages.DocumentBlockParam);
    }
  }

  const content: Messages.ContentBlockParam[] = [
    textBlock,
    ...imageBlocks,
    ...(documentBlocks as unknown as Messages.ContentBlockParam[]),
  ];

  return { role: "user", content };
}

function deepClean<T>(val: T): T {
  if (typeof val === "string") return val.replace(/[\u2022\u2023\u25e6\u2043\u2219\u2013\u2014]+/g, "").trimStart() as unknown as T;
  if (Array.isArray(val)) return val.map(deepClean) as unknown as T;
  if (val !== null && typeof val === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) out[k] = deepClean(v);
    return out as unknown as T;
  }
  return val;
}

function parseCostingResult(raw: string): CostingResult {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = deepClean(JSON.parse(cleaned));
  return {
    partSummary: parsed.partSummary ?? {},
    costBreakdown: Array.isArray(parsed.costBreakdown) ? parsed.costBreakdown : [],
    processAnalysis: parsed.processAnalysis ?? {},
    designRiskAnalysis: parsed.designRiskAnalysis ?? {},
    costReductionIdeas: Array.isArray(parsed.costReductionIdeas) ? parsed.costReductionIdeas : [],
    confidenceLevel: parsed.confidenceLevel ?? "Low",
    confidenceExplanation: parsed.confidenceExplanation ?? "",
    rawMarkdown: parsed.rawMarkdown ?? "",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    if (!body.files || body.files.length === 0) {
      return NextResponse.json({ error: "No files provided." }, { status: 400 });
    }
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [buildUserMessage(body)],
    });
    const rawText = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as Anthropic.TextBlock).text)
      .join("");
    const result = parseCostingResult(rawText);
    return NextResponse.json({ result });
  } catch (err) {
    console.error("[/api/analyze]", err);
    const message = err instanceof Error ? err.message : "Analysis failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
