import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { PCB_SYSTEM_PROMPT, buildPCBPrompt } from "@/lib/pcbSystemPrompt";
import type { PCBAnalysisInput, PCBCostingResult } from "@/lib/pcbTypes";

export const maxDuration = 120;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function deepClean<T>(val: T): T {
  if (typeof val === "string")
    return val.replace(/[•‣◦⁃∙–—]+/g, "").trimStart() as unknown as T;
  if (Array.isArray(val)) return val.map(deepClean) as unknown as T;
  if (val !== null && typeof val === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) out[k] = deepClean(v);
    return out as unknown as T;
  }
  return val;
}

function repairTruncatedJson(raw: string): string {
  let s = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try { JSON.parse(s); return s; } catch { /* fall through to repair */ }

  const opens: string[] = [];
  let inString = false, escape = false;
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
  for (let i = opens.length - 1; i >= 0; i--) s += opens[i] === "{" ? "}" : "]";
  return s;
}

function parsePCBResult(raw: string): PCBCostingResult {
  const parsed = deepClean(JSON.parse(repairTruncatedJson(raw)));
  return {
    pcbSummary: parsed.pcbSummary ?? {},
    fabricationCost: Array.isArray(parsed.fabricationCost) ? parsed.fabricationCost : [],
    assemblyCost: Array.isArray(parsed.assemblyCost) ? parsed.assemblyCost : [],
    dfmChecks: Array.isArray(parsed.dfmChecks) ? parsed.dfmChecks : [],
    manufacturingRisks: parsed.manufacturingRisks ?? {},
    processRecommendations: parsed.processRecommendations ?? {},
    dfmRecommendations: Array.isArray(parsed.dfmRecommendations) ? parsed.dfmRecommendations : [],
    costReductionIdeas: Array.isArray(parsed.costReductionIdeas) ? parsed.costReductionIdeas : [],
    recommendedIndianVendors: Array.isArray(parsed.recommendedIndianVendors) ? parsed.recommendedIndianVendors : [],
    panelizationAnalysis: parsed.panelizationAnalysis ?? "",
    confidenceLevel: parsed.confidenceLevel ?? "Low",
    confidenceExplanation: parsed.confidenceExplanation ?? "",
    rawMarkdown: parsed.rawMarkdown ?? "",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: PCBAnalysisInput = await request.json();

    // Build content: text prompt + optional reference images/PDFs
    const content: Anthropic.MessageParam["content"] = [
      { type: "text", text: buildPCBPrompt(body) },
    ];

    for (const file of body.referenceFiles ?? []) {
      if (file.type.startsWith("image/")) {
        const mediaType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
        content.push({
          type: "image",
          source: { type: "base64", media_type: mediaType, data: file.dataUrl.split(",")[1] },
        });
      } else if (file.type === "application/pdf") {
        content.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: file.dataUrl.split(",")[1] },
        } as Anthropic.DocumentBlockParam);
      }
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: PCB_SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });

    const rawText = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as Anthropic.TextBlock).text)
      .join("");

    return NextResponse.json({ result: parsePCBResult(rawText) });
  } catch (err) {
    console.error("[/api/pcb/analyze]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PCB analysis failed." },
      { status: 500 }
    );
  }
}
