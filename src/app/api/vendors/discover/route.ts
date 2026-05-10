import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildVendorPrompt } from "@/lib/vendorSystemPrompt";
import type { DiscoveryRequest, Vendor, VendorDiscoveryResult } from "@/lib/vendorTypes";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function repairTruncatedJson(raw: string): string {
  // Strip markdown fences
  let s = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    JSON.parse(s);
    return s; // Already valid
  } catch {
    // Try closing any open arrays/objects by tracking bracket depth
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

    // If we're inside a string, cut back to the last complete key-value pair
    if (inString) {
      const lastComma = s.lastIndexOf(",");
      if (lastComma > 0) s = s.slice(0, lastComma);
    }

    // Close all open brackets in reverse order
    for (let i = opens.length - 1; i >= 0; i--) {
      s += opens[i] === "{" ? "}" : "]";
    }

    return s;
  }
}

function parseVendorResult(raw: string): VendorDiscoveryResult {
  const repaired = repairTruncatedJson(raw);
  const parsed = JSON.parse(repaired);
  return {
    matches: Array.isArray(parsed.matches)
      ? parsed.matches.map((m: Record<string, unknown>) => ({
          ...m,
          vendor: m.vendor ? { ...(m.vendor as Record<string, unknown>), id: crypto.randomUUID() } : m.vendor,
        }))
      : [],
    sourcingRisks: Array.isArray(parsed.sourcingRisks) ? parsed.sourcingRisks : [],
    rfqStrategy: parsed.rfqStrategy ?? "",
    recommendedSuppliersCount: parsed.recommendedSuppliersCount ?? 0,
    prototypeStrategy: parsed.prototypeStrategy ?? "",
    productionStrategy: parsed.productionStrategy ?? "",
    dualVendorRationale: parsed.dualVendorRationale ?? "",
  };
}

interface RequestBody {
  request: DiscoveryRequest;
  importedVendors?: Vendor[];
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    if (!body.request) {
      return NextResponse.json({ error: "No discovery request provided." }, { status: 400 });
    }

    let systemPrompt = buildVendorPrompt(body.request);

    if (body.importedVendors && body.importedVendors.length > 0) {
      systemPrompt += `\n\nADDITIONAL CONTEXT — IMPORTED VENDORS FROM USER DATABASE:\nThe user has ${body.importedVendors.length} vendors in their database. Evaluate each and include the best-matching ones in your results, marking their "source" field as "imported". Here are the imported vendors:\n${JSON.stringify(body.importedVendors, null, 2)}\n\nWhen including imported vendors in matches, use their exact data (name, city, certifications, etc.) but generate appropriate suitabilityScore, matchReasons, riskFlags, and recommendation based on the part requirements.`;
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Find the best Indian manufacturers for my aluminium part. Requirements: ${body.request.manufacturingMethod} method, ${body.request.material} material, ${body.request.toleranceLevel} tolerance, ${body.request.batchQuantity} units batch, ${body.request.complexity} complexity. Return ONLY valid JSON.`,
        },
      ],
    });

    const rawText = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as Anthropic.TextBlock).text)
      .join("");

    const result = parseVendorResult(rawText);
    return NextResponse.json({ result });
  } catch (err) {
    console.error("[/api/vendors/discover]", err);
    const message = err instanceof Error ? err.message : "Vendor discovery failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
