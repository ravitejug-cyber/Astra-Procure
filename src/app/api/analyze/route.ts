import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Messages } from "@anthropic-ai/sdk/resources";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import type { AnalyzeRequest, CostingResult } from "@/lib/types";

const DEMO_MODE = !process.env.ANTHROPIC_API_KEY;
const client = DEMO_MODE ? null : new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DEMO_RESULT: CostingResult = {
  partSummary: {
    partName: "Aluminium Housing (Demo)",
    material: "Al 6061-T6",
    manufacturingMethod: "CNC Machining",
    complexityLevel: "Medium",
    estimatedWeight: "1.24 kg",
    machiningTimeHours: "1.8 hrs",
    helicoilCost: "₹120/unit",
    manpowerCostPerUnit: "₹380/unit",
    rawMaterialMarketPrice: "₹310/kg",
    suggestedBatchSize: "100 units",
    estimatedAnnualVolume: "1,200 units/year",
  },
  costBreakdown: [
    { item: "Raw Material (Al 6061-T6)", estimatedCost: "₹310/unit", notes: "@ ₹250/kg, 1.24 kg stock" },
    { item: "CNC Machining (3-axis)", estimatedCost: "₹420/unit", notes: "1.8 hrs @ ₹230/hr" },
    { item: "Surface Finish (Anodize Type II)", estimatedCost: "₹85/unit", notes: "Batch anodising" },
    { item: "Tooling (amortised)", estimatedCost: "₹60/unit", notes: "Over 100 units" },
    { item: "Overhead & Profit (15%)", estimatedCost: "₹90/unit", notes: "Standard margin" },
  ],
  processAnalysis: {
    recommendedProcess: "CNC Machining",
    alternativeProcess: "Die Casting (>500 units)",
    keyMachiningChallenges: ["Thin 2mm wall sections", "Deep internal pockets", "Thread inserts (M4 Helicoil)"],
    estimatedCycleTime: "1.8 hrs/part",
    suggestedToleranceCapability: "±0.02mm on critical bores",
    fixtureComplexity: "Medium — custom soft jaw recommended",
    recommendedMachineType: "VMC 3-axis (BT40 spindle)",
  },
  designRiskAnalysis: {
    thinWallRisks: "2mm sections near boss features may cause chatter — reduce feed rate",
    toolAccessibility: "All features accessible from 3 setups",
    warpageRisks: "Low — symmetric geometry minimises residual stress",
    tightToleranceRisks: "H7 bore tolerance achievable with reaming",
    surfaceFinishRisks: "Ra 1.6 achievable with finish pass",
    threadingRisks: "M4 threads — specify Helicoil inserts for durability",
    deepPocketRisks: "Pocket depth-to-width ratio within limits",
    dieCastingPorosityRisks: "N/A — CNC machined from billet",
  },
  costReductionIdeas: [
    "Switch to Die Casting at 500+ units — saves ~35% on per-unit cost (tooling ~₹1.5L)",
    "Simplify internal pocket geometry — saves ~12% machining time (20 min/part)",
    "Combine anodise batches with other parts — saves ~8% on finishing cost",
  ],
  confidenceLevel: "Medium",
  confidenceExplanation: "Demo mode — add ANTHROPIC_API_KEY for real AI-powered analysis of your actual drawings.",
  rawMarkdown: "",
};

function buildUserMessage(req: AnalyzeRequest): Anthropic.MessageParam {
  const textBlock: Messages.TextBlockParam = {
    type: "text",
    text: `Please analyze the uploaded engineering documents and provide a detailed manufacturing cost estimate.

Region: ${req.region}
Batch Quantity: ${req.batchQuantity.toLocaleString()} units
Preferred Manufacturing Method: ${req.preferredMethod}
${req.material ? `RAW MATERIAL (USER SPECIFIED — YOU MUST USE THIS EXACTLY): ${req.material}` : ""}
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

function repairTruncatedJson(raw: string): string {
  let s = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    JSON.parse(s);
    return s;
  } catch {
    const opens: string[] = [];
    let inString = false;
    let escape = false;

    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (escape) { escape = false; continue; }
      if (ch === "\\" && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{" || ch === "[") opens.push(ch);
      else if (ch === "}" || ch === "]") opens.pop();
    }

    if (inString) {
      const lastComma = s.lastIndexOf(",");
      if (lastComma > 0) s = s.slice(0, lastComma);
    }

    for (let i = opens.length - 1; i >= 0; i--) {
      s += opens[i] === "{" ? "}" : "]";
    }

    return s;
  }
}

function parseCostingResult(raw: string): CostingResult {
  const repaired = repairTruncatedJson(raw);
  const parsed = JSON.parse(repaired);
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
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 1500));
      return NextResponse.json({ result: DEMO_RESULT });
    }
    const message = await client!.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
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
