"use client";

// DWG version map (first 6 bytes of file)
const DWG_VERSIONS: Record<string, string> = {
  AC1015: "AutoCAD 2000",
  AC1018: "AutoCAD 2004",
  AC1021: "AutoCAD 2007",
  AC1024: "AutoCAD 2010",
  AC1027: "AutoCAD 2013",
  AC1032: "AutoCAD 2018",
};

// ── DXF parser ────────────────────────────────────────────────────────────────
// DXF is a plain-text format: alternating group-code line / value line pairs.

export function parseDxf(text: string): string {
  const lines = text.split(/\r?\n/);
  const sections: string[] = [];

  const layers = new Set<string>();
  const texts: string[] = [];
  const dimensions: string[] = [];
  const blocks: string[] = [];

  let i = 0;
  let currentEntity = "";
  let currentLayer = "";
  // per-entity accumulators
  let dimText = "";
  let mTextContent = "";
  let textContent = "";

  const flush = () => {
    if (currentEntity === "TEXT" || currentEntity === "ATTDEF" || currentEntity === "ATTRIB") {
      if (textContent.trim()) texts.push(textContent.trim());
    }
    if (currentEntity === "MTEXT") {
      const cleaned = mTextContent.replace(/\\[A-Za-z][^;]*;/g, "").replace(/[{}]/g, "").trim();
      if (cleaned) texts.push(cleaned);
    }
    if (currentEntity === "DIMENSION") {
      if (dimText.trim()) dimensions.push(dimText.trim());
    }
    currentEntity = "";
    currentLayer = "";
    dimText = "";
    mTextContent = "";
    textContent = "";
  };

  while (i < lines.length - 1) {
    const code = lines[i].trim();
    const val = lines[i + 1].trim();
    i += 2;

    const groupCode = parseInt(code, 10);

    // Entity/object start
    if (groupCode === 0) {
      flush();
      currentEntity = val.toUpperCase();
      if (val === "BLOCK") {
        // next group 2 will be block name
      }
    }

    // Layer name for entity
    if (groupCode === 8 && currentEntity) {
      currentLayer = val;
      if (val && val !== "0") layers.add(val);
    }

    // All layer table entries
    if (groupCode === 2 && currentEntity === "LAYER") layers.add(val);

    // Block names from BLOCK entities
    if (groupCode === 2 && currentEntity === "BLOCK" && val && !val.startsWith("*")) {
      blocks.push(val);
    }

    // Text content (group 1 = primary text)
    if (groupCode === 1) {
      if (currentEntity === "TEXT" || currentEntity === "ATTDEF" || currentEntity === "ATTRIB") {
        textContent = val;
      }
      if (currentEntity === "MTEXT") mTextContent += val;
      if (currentEntity === "DIMENSION") dimText = val;
    }
    // MTEXT continuation (group 3)
    if (groupCode === 3 && currentEntity === "MTEXT") mTextContent += val;

    // Dimension measurement value (group 42)
    if (groupCode === 42 && currentEntity === "DIMENSION" && !dimText) {
      dimText = val;
    }
  }
  flush();

  if (layers.size) sections.push(`Layers (${layers.size}): ${[...layers].join(", ")}`);
  if (blocks.length) sections.push(`Blocks/Components: ${[...new Set(blocks)].join(", ")}`);

  // Deduplicate and filter text labels
  const allText = [...new Set(texts)]
    .filter((t) => t.length > 1 && t !== "0")
    .slice(0, 120);
  if (allText.length) sections.push(`Text labels / notes:\n${allText.join("\n")}`);

  const allDims = [...new Set(dimensions)].filter((d) => d.length > 0).slice(0, 60);
  if (allDims.length) sections.push(`Dimension values: ${allDims.join(", ")}`);

  return sections.length
    ? sections.join("\n\n")
    : "DXF file parsed but no readable entities found.";
}

// ── DWG binary string extractor ───────────────────────────────────────────────
// DWG is proprietary binary. We extract the file version from the header,
// then pull all printable ASCII runs (>=5 chars) that look like engineering
// data: layer names, material callouts, dimension strings, title-block text.

export function extractDwgText(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  // Read version string from first 6 bytes
  const verStr = String.fromCharCode(...bytes.slice(0, 6));
  const version = DWG_VERSIONS[verStr] ?? `DWG version ${verStr}`;

  // Collect printable ASCII runs ≥5 chars
  const strings: string[] = [];
  let run = "";

  for (let i = 6; i < bytes.length; i++) {
    const c = bytes[i];
    // Printable ASCII: 0x20–0x7E, plus tab
    if ((c >= 0x20 && c <= 0x7e) || c === 0x09) {
      run += String.fromCharCode(c);
    } else {
      if (run.length >= 5) strings.push(run.trim());
      run = "";
    }
  }
  if (run.length >= 5) strings.push(run.trim());

  // Filter: keep strings that contain at least one letter or digit-unit pattern
  const useful = strings
    .filter((s) => /[A-Za-z]/.test(s) && s.length >= 5)
    .filter((s) => !/^[\s!@#$%^&*()_+=[\]{}|\\<>?/`~]+$/.test(s))
    .slice(0, 200);

  // Heuristics: likely engineering content
  const layerLike = useful.filter((s) =>
    /layer|dim|anno|text|center|hidden|section|title|border|material|note|spec|bom|part|assy/i.test(s)
  );
  const materialLike = useful.filter((s) =>
    /SS|AL|EN\d|IS\d|Ti|Cu|MS|HR|CR|GR|316|304|6061|7075|ADC|LM6|Inconel|Brass|Bronze|HDPE|ABS|POM/i.test(s)
  );
  const dimLike = useful.filter((s) =>
    /\d+(\.\d+)?\s*(mm|cm|m|in|inch|"|kg|g|°|deg|tol|\+\-|±)/.test(s)
  );

  const sections: string[] = [`File format: ${version}`];
  if (layerLike.length) sections.push(`Layer / annotation strings:\n${[...new Set(layerLike)].join("\n")}`);
  if (materialLike.length) sections.push(`Material / grade references:\n${[...new Set(materialLike)].join("\n")}`);
  if (dimLike.length) sections.push(`Dimension strings:\n${[...new Set(dimLike)].join("\n")}`);

  // Add a sample of the rest for context
  const rest = useful
    .filter((s) => !layerLike.includes(s) && !materialLike.includes(s) && !dimLike.includes(s))
    .slice(0, 40);
  if (rest.length) sections.push(`Other readable text:\n${rest.join("\n")}`);

  return sections.length > 1
    ? sections.join("\n\n")
    : `${version} — no readable text strings extracted from this DWG file.`;
}

// ── Public entry point ────────────────────────────────────────────────────────

export type CadFileType = "dxf" | "dwg" | "other";

export function detectCadType(filename: string, mimeType: string): CadFileType {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "dxf" || mimeType === "application/dxf" || mimeType === "image/vnd.dxf") return "dxf";
  if (ext === "dwg" || mimeType === "image/vnd.dwg" || mimeType === "application/acad") return "dwg";
  return "other";
}

export async function extractCadText(file: File): Promise<string | null> {
  const cadType = detectCadType(file.name, file.type);
  if (cadType === "other") return null;

  if (cadType === "dxf") {
    const text = await file.text();
    return `=== DXF FILE: ${file.name} ===\n${parseDxf(text)}`;
  }

  if (cadType === "dwg") {
    const buffer = await file.arrayBuffer();
    return `=== DWG FILE: ${file.name} ===\n${extractDwgText(buffer)}`;
  }

  return null;
}
