import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildVendorPrompt } from "@/lib/vendorSystemPrompt";
import type { DiscoveryRequest, Vendor, VendorDiscoveryResult } from "@/lib/vendorTypes";

const DEMO_MODE = !process.env.ANTHROPIC_API_KEY;
const client = DEMO_MODE ? null : new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function makeVendor(id: string, name: string, city: string, state: string, caps: string[], certs: string[], moq: number, lead: number): Vendor {
  return { id, name, city, state, processCapabilities: caps as Vendor["processCapabilities"], machines: [], materialExpertise: ["Al 6061-T6", "Al 7075"], certifications: certs, moq, leadTimeDays: lead, contact: "", website: "", notes: "", source: "discovered", industries: ["Automotive", "Industrial"], monthlyCapacity: "500 units" };
}

const DEMO_VENDORS: VendorDiscoveryResult = {
  matches: [
    { vendor: makeVendor("d1", "Precision Parts India Pvt Ltd", "Pune", "Maharashtra", ["CNC Machining", "Anodizing"], ["ISO 9001:2015", "IATF 16949"], 50, 12), suitabilityScore: 92, technicalScore: 90, qualityScore: 95, commercialScore: 88, matchReasons: ["Specialises in Al 6061-T6", "Strong automotive pedigree", "In-house anodising"], riskFlags: [], recommendation: "top" },
    { vendor: makeVendor("d2", "Apex Machining Solutions", "Bengaluru", "Karnataka", ["CNC Machining", "5-Axis CNC"], ["ISO 9001:2015", "AS9100D"], 25, 10), suitabilityScore: 87, technicalScore: 94, qualityScore: 92, commercialScore: 76, matchReasons: ["Tight tolerance ±0.01mm", "Aerospace grade quality", "Fast turnaround"], riskFlags: ["Slightly higher price"], recommendation: "top" },
    { vendor: makeVendor("d3", "Coimbatore Die Cast Works", "Coimbatore", "Tamil Nadu", ["Die Casting", "Pressure Die Casting"], ["ISO 9001:2015"], 500, 21), suitabilityScore: 74, technicalScore: 78, qualityScore: 72, commercialScore: 95, matchReasons: ["Very competitive pricing at volume", "Large capacity"], riskFlags: ["High MOQ — not for prototypes", "Longer lead time"], recommendation: "not-recommended" },
    { vendor: makeVendor("d4", "Rajkot Engineering Hub", "Rajkot", "Gujarat", ["CNC Machining", "VMC"], ["ISO 9001:2015"], 100, 14), suitabilityScore: 81, technicalScore: 80, qualityScore: 82, commercialScore: 85, matchReasons: ["Strong machining cluster", "Cost-effective", "Good delivery record"], riskFlags: ["Limited anodising in-house"], recommendation: "backup" },
    { vendor: makeVendor("d5", "Navi Mumbai Precision Works", "Navi Mumbai", "Maharashtra", ["CNC Machining", "Anodizing", "Surface Finishing"], ["ISO 9001:2015", "ISO 14001"], 50, 10), suitabilityScore: 83, technicalScore: 82, qualityScore: 85, commercialScore: 83, matchReasons: ["Mumbai proximity for logistics", "In-house Type II anodise", "Quick communication"], riskFlags: [], recommendation: "backup" },
  ],
  sourcingRisks: ["Single-source dependency risk — shortlist at least 2 vendors", "Aluminium prices volatile — lock in rates for bulk orders"],
  rfqStrategy: "Send RFQ to top 3 vendors simultaneously. Request DFM feedback, sample parts, and per-unit pricing at 100, 500, and 1000 unit quantities.",
  recommendedSuppliersCount: 2,
  prototypeStrategy: "Use Precision Parts India or Apex Machining for 5–10 prototype units to validate fit and finish before committing to volume.",
  productionStrategy: "Dual-source between Precision Parts India (primary) and Rajkot Engineering Hub (backup) for production runs.",
  dualVendorRationale: "Dual sourcing reduces lead-time risk and provides pricing leverage during annual contract negotiations.",
};

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

const BULLET_RE = /^[•‣◦⁃∙]\s*/;

function cleanStr(s: unknown): string {
  if (typeof s !== "string") return String(s ?? "");
  return s.replace(BULLET_RE, "").trim();
}

function deepClean<T>(val: T): T {
  if (typeof val === "string") return cleanStr(val) as unknown as T;
  if (Array.isArray(val)) return val.map(deepClean) as unknown as T;
  if (val !== null && typeof val === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      out[k] = deepClean(v);
    }
    return out as unknown as T;
  }
  return val;
}

function parseVendorResult(raw: string): VendorDiscoveryResult {
  const repaired = repairTruncatedJson(raw);
  const parsed = deepClean(JSON.parse(repaired));
  const matches = Array.isArray(parsed.matches)
    ? parsed.matches.map((m: Record<string, unknown>) => ({
        ...m,
        vendor: m.vendor ? { ...(m.vendor as Record<string, unknown>), id: crypto.randomUUID() } : m.vendor,
      }))
    : [];
  return {
    matches,
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

    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 1200));
      return NextResponse.json({ result: DEMO_VENDORS });
    }

    const message = await client!.messages.create({
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
