"use client";

// Parses Gerber RS-274X and Excellon drill files to extract PCB metadata.
// Returns a human-readable text summary for Claude to reason over.

// ── Gerber RS-274X parser ─────────────────────────────────────────────────────
export function parseGerber(text: string, filename: string): string {
  const lines = text.split(/\r?\n/);
  const apertures: Record<string, { shape: string; size: number }> = {};
  const layerHints: string[] = [];
  const comments: string[] = [];
  const toolSizes: number[] = [];
  let boardWidth = 0, boardHeight = 0;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let hasNegativePolarity = false;
  let scaleFactor = 1; // inches to mm; Gerber unit

  // Detect layer from filename convention
  const fn = filename.toLowerCase();
  if (/\.gtl|f\.cu|top.*cop|cmp/i.test(fn)) layerHints.push("Top Copper");
  else if (/\.gbl|b\.cu|bot.*cop|sol/i.test(fn)) layerHints.push("Bottom Copper");
  else if (/\.gts|f\.mask/i.test(fn)) layerHints.push("Top Solder Mask");
  else if (/\.gbs|b\.mask/i.test(fn)) layerHints.push("Bottom Solder Mask");
  else if (/\.gto|f\.silks|tss/i.test(fn)) layerHints.push("Top Silkscreen");
  else if (/\.gbo|b\.silks|bss/i.test(fn)) layerHints.push("Bottom Silkscreen");
  else if (/\.gko|edge\.cuts|\.gmb|\.bor/i.test(fn)) layerHints.push("Board Outline");
  else if (/in(\d+)\.cu|\.g(\d+)/i.test(fn)) layerHints.push("Inner Layer");
  else if (/\.gbr|\.ger/i.test(fn)) layerHints.push("Gerber Layer");

  for (const raw of lines) {
    const line = raw.trim();

    // Comments
    if (line.startsWith("G04") || line.startsWith("G4")) {
      const c = line.replace(/^G0?4\s*/, "").replace(/\*$/, "").trim();
      if (c.length > 2 && c.length < 120) comments.push(c);
    }

    // Units
    if (/MOIN|%MOIN/.test(line)) scaleFactor = 25.4;
    if (/MOMM|%MOMM/.test(line)) scaleFactor = 1;

    // Aperture definitions: %ADD10C,0.127*%
    const apDef = line.match(/^%ADD(\d+)([A-Z]+),([^*]+)\*%/);
    if (apDef) {
      const sizes = apDef[3].split("X").map(Number).filter(Boolean);
      const size = sizes[0] ?? 0;
      apertures[apDef[1]] = { shape: apDef[2], size: size * scaleFactor };
      if (size > 0) toolSizes.push(size * scaleFactor);
    }

    // Negative polarity
    if (/LPC/.test(line)) hasNegativePolarity = true;

    // Coordinate parsing (simplified: extract X/Y for bounding box)
    const coord = line.match(/X([-+]?\d+)Y([-+]?\d+)/);
    if (coord) {
      const x = parseInt(coord[1]);
      const y = parseInt(coord[2]);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  // Estimate dimensions from coordinate range (assume 4 decimal places = 0.0001 inch)
  if (isFinite(maxX) && isFinite(maxY) && minX !== maxX) {
    const divisor = scaleFactor === 25.4 ? 10000 : 1000;
    boardWidth = Math.round(((maxX - minX) / divisor) * scaleFactor * 10) / 10;
    boardHeight = Math.round(((maxY - minY) / divisor) * scaleFactor * 10) / 10;
  }

  const minTrace = toolSizes.length
    ? `${Math.min(...toolSizes).toFixed(3)}mm`
    : "unknown";
  const maxTrace = toolSizes.length
    ? `${Math.max(...toolSizes).toFixed(3)}mm`
    : "unknown";

  const sections: string[] = [`=== GERBER FILE: ${filename} ===`];
  if (layerHints.length) sections.push(`Layer: ${layerHints.join(", ")}`);
  if (boardWidth > 0) sections.push(`Estimated dimensions: ${boardWidth}mm x ${boardHeight}mm`);
  if (toolSizes.length)
    sections.push(`Aperture sizes: min ${minTrace}, max ${maxTrace} (${toolSizes.length} unique apertures)`);
  if (hasNegativePolarity) sections.push("Has negative polarity (cutouts/copper pours)");
  if (comments.length)
    sections.push(`File comments:\n${comments.slice(0, 10).join("\n")}`);

  return sections.join("\n");
}

// ── Excellon drill file parser ────────────────────────────────────────────────
export function parseExcellon(text: string, filename: string): string {
  const lines = text.split(/\r?\n/);
  const tools: Record<string, number> = {}; // tool num → diameter mm
  const holesByTool: Record<string, number> = {};
  let currentTool = "";
  let isMetric = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith(";")) continue;

    if (/METRIC/.test(line) || line === "M71") isMetric = true;
    if (/INCH/.test(line) || line === "M72") isMetric = false;

    // Tool definition: T01C0.3 or T01F0.3
    const toolDef = line.match(/^T(\d+)[CF]([\d.]+)/);
    if (toolDef) {
      const dia = parseFloat(toolDef[2]);
      tools[toolDef[1]] = isMetric ? dia : dia * 25.4;
    }

    // Tool select: T01
    const toolSel = line.match(/^T(\d+)$/);
    if (toolSel) currentTool = toolSel[1];

    // Drill hit: X...Y...
    if (/^X-?\d/.test(line) && currentTool) {
      holesByTool[currentTool] = (holesByTool[currentTool] ?? 0) + 1;
    }
  }

  const totalHoles = Object.values(holesByTool).reduce((a, b) => a + b, 0);
  const diameters = Object.values(tools);
  const minDia = diameters.length ? Math.min(...diameters) : 0;
  const maxDia = diameters.length ? Math.max(...diameters) : 0;

  const toolList = Object.entries(tools)
    .map(([t, d]) => `T${t}: ${d.toFixed(3)}mm (${holesByTool[t] ?? 0} holes)`)
    .join(", ");

  const sections = [
    `=== DRILL FILE: ${filename} ===`,
    `Total holes: ${totalHoles}`,
    `Unique drill sizes: ${diameters.length}`,
    `Min drill diameter: ${minDia.toFixed(3)}mm`,
    `Max drill diameter: ${maxDia.toFixed(3)}mm`,
  ];
  if (toolList) sections.push(`Tool breakdown: ${toolList}`);

  return sections.join("\n");
}

// ── BOM CSV/text parser ───────────────────────────────────────────────────────
export function parseBOM(text: string, filename: string): string {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return `=== BOM: ${filename} ===\nEmpty or unreadable.`;

  // Detect CSV delimiter
  const delim = lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0].split(delim).map((h) => h.replace(/"/g, "").trim().toLowerCase());

  // Find relevant column indices
  const idx = {
    ref: headers.findIndex((h) => /ref|designator|refdes/i.test(h)),
    qty: headers.findIndex((h) => /qty|quantity|count/i.test(h)),
    value: headers.findIndex((h) => /value|part|component/i.test(h)),
    package: headers.findIndex((h) => /package|footprint|case/i.test(h)),
    mfr: headers.findIndex((h) => /manufacturer|mfr|brand/i.test(h)),
    mpn: headers.findIndex((h) => /mpn|mfr.*part|part.*num/i.test(h)),
  };

  let totalComponents = 0;
  const packages = new Set<string>();
  const uniqueParts: string[] = [];
  let hasBGA = false;
  let hasFinePitch = false;
  let hasTHT = false;
  let hasSMT = false;

  for (const line of lines.slice(1, 201)) {
    const cols = line.split(delim).map((c) => c.replace(/"/g, "").trim());
    const qty = idx.qty >= 0 ? parseInt(cols[idx.qty]) || 1 : 1;
    totalComponents += qty;

    const pkg = idx.package >= 0 ? cols[idx.package] : "";
    if (pkg) {
      packages.add(pkg);
      if (/BGA|CSP/i.test(pkg)) hasBGA = true;
      if (/0201|0402|0.4mm|0.5mm pitch/i.test(pkg)) hasFinePitch = true;
      if (/DIP|TO-\d|SIP|AXIAL|RADIAL/i.test(pkg)) hasTHT = true;
      else if (pkg.length > 0) hasSMT = true;
    }

    const partName = [
      idx.value >= 0 ? cols[idx.value] : "",
      idx.mpn >= 0 ? cols[idx.mpn] : "",
    ].filter(Boolean).join(" / ");
    if (partName && uniqueParts.length < 20) uniqueParts.push(partName);
  }

  const lineCount = lines.length - 1;
  const sections = [
    `=== BOM: ${filename} ===`,
    `Total line items: ${lineCount}`,
    `Total component count: ${totalComponents}`,
    `Unique packages: ${packages.size} (${[...packages].slice(0, 15).join(", ")})`,
    `BGA / CSP components: ${hasBGA ? "Yes" : "No"}`,
    `Fine-pitch (0201/0402): ${hasFinePitch ? "Yes" : "No"}`,
    `THT components: ${hasTHT ? "Yes" : "No"}`,
    `SMT components: ${hasSMT ? "Yes" : "No"}`,
  ];
  if (uniqueParts.length) sections.push(`Sample parts: ${uniqueParts.slice(0, 10).join("; ")}`);

  return sections.join("\n");
}

// ── Main entry point ──────────────────────────────────────────────────────────
export type PCBFileType = "gerber" | "drill" | "bom" | "image" | "pdf" | "other";

export function detectPCBFileType(filename: string, mimeType: string): PCBFileType {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const fn = filename.toLowerCase();

  if (["gbr","ger","gtl","gbl","gts","gbs","gto","gbo","gko","gtp","gbp","gm1","gm2","g1","g2","g3","g4","g5","g6"].includes(ext)) return "gerber";
  if (["drl","xln","exc","excellon","ncd","drl"].includes(ext) || /drill|\.drl/.test(fn)) return "drill";
  if (["csv","xlsx","xls","tsv"].includes(ext) || /bom|bill.of.material/.test(fn)) return "bom";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  // Gerber files often have no standard extension — check content pattern in caller
  return "other";
}

export async function extractPCBFileText(file: File): Promise<string | null> {
  const type = detectPCBFileType(file.name, file.type);

  if (type === "image" || type === "pdf") return null; // handled as binary blocks

  if (type === "gerber" || type === "other") {
    const text = await file.text().catch(() => null);
    if (!text) return null;
    // Confirm it looks like Gerber (has % parameters or G04 comments)
    if (/%MO|%FS|%AD|G04|G36|D01\*|D02\*|D03\*/.test(text)) {
      return parseGerber(text, file.name);
    }
    // Could be Excellon
    if (/T\d+[CF]|METRIC|INCH|M30/.test(text)) {
      return parseExcellon(text, file.name);
    }
    return null;
  }

  if (type === "drill") {
    const text = await file.text().catch(() => null);
    if (!text) return null;
    return parseExcellon(text, file.name);
  }

  if (type === "bom") {
    const text = await file.text().catch(() => null);
    if (!text) return null;
    return parseBOM(text, file.name);
  }

  return null;
}
