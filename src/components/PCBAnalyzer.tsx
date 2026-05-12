"use client";

import React, { useState } from "react";
import {
  Loader2, Send, Cpu, ChevronDown, ChevronUp, Upload, X, FileText, Image as ImageIcon, File,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PCBCostingResultView } from "@/components/PCBCostingResult";
import { usePCBStore } from "@/lib/pcbStore";
import { extractPCBFileText, detectPCBFileType } from "@/lib/gerberParser";
import type {
  PCBAnalysisInput, PCBCostingResult, PCBLayer, PCBMaterial, PCBThickness,
  CopperWeight, TraceSpace, ViaType, MinDrill, HoleCount, SurfaceFinish,
  SolderMaskColor, SolderMaskCoverage, SilkscreenColor, SilkscreenCoverage,
  IPCClass, PCBTesting, PCBRegion,
} from "@/lib/pcbTypes";

const DEFAULTS: PCBAnalysisInput = {
  layers: 2,
  boardWidth: 100,
  boardHeight: 80,
  thickness: "1.6",
  material: "FR4 Standard",
  quantity: 100,
  outerCopperWeight: "1oz",
  innerCopperWeight: "0.5oz",
  minTraceSpace: "5/5 mil",
  viaType: "Through-hole only",
  minDrill: "0.30mm",
  holeCount: "500-1000",
  surfaceFinish: "HASL Lead-Free",
  solderMaskColor: "Green",
  solderMaskCoverage: "Both Sides",
  silkscreenColor: "White",
  silkscreenCoverage: "Both Sides",
  ipcClass: "Class 2",
  testing: "Flying Probe (E-Test)",
  specialFeatures: {
    controlledImpedance: false, goldFingers: false, viaInPad: false,
    castellatedHoles: false, backDrilling: false, pressFitHoles: false,
    countersinkHoles: false, carbonInk: false, peelableSolderMask: false,
  },
  region: "India",
  additionalNotes: "",
  referenceFiles: [],
};

const SPECIAL_LABELS: Record<keyof PCBAnalysisInput["specialFeatures"], string> = {
  controlledImpedance: "Controlled Impedance",
  goldFingers: "Gold Fingers / Edge Connectors",
  viaInPad: "Via-in-Pad",
  castellatedHoles: "Castellated Holes",
  backDrilling: "Back Drilling",
  pressFitHoles: "Press-Fit Holes",
  countersinkHoles: "Countersink Holes",
  carbonInk: "Carbon Ink",
  peelableSolderMask: "Peelable Solder Mask",
};

const FILE_ACCEPT = [
  ".gbr",".ger",".gtl",".gbl",".gts",".gbs",".gto",".gbo",".gko",
  ".drl",".xln",".exc",
  ".csv",".xlsx",
  "image/*",".pdf",
].join(",");

function SectionHeader({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className="flex w-full items-center justify-between py-2 text-xs font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors">
      {title}
      {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
    </button>
  );
}

function fileTypeIcon(name: string, mime: string) {
  const t = detectPCBFileType(name, mime);
  if (t === "image") return <ImageIcon className="h-3.5 w-3.5 text-blue-400" />;
  if (t === "pdf") return <FileText className="h-3.5 w-3.5 text-red-400" />;
  if (t === "gerber") return <File className="h-3.5 w-3.5 text-violet-500" />;
  if (t === "drill") return <File className="h-3.5 w-3.5 text-orange-400" />;
  if (t === "bom") return <File className="h-3.5 w-3.5 text-emerald-500" />;
  return <File className="h-3.5 w-3.5 text-slate-400" />;
}

function fileTypeLabel(name: string, mime: string) {
  const t = detectPCBFileType(name, mime);
  return { gerber: "Gerber", drill: "Drill", bom: "BOM", image: "Image", pdf: "PDF", other: "File" }[t];
}

export function PCBAnalyzer() {
  const [form, setForm] = useState<PCBAnalysisInput>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PCBCostingResult | null>(null);
  const [openSections, setOpenSections] = useState({
    board: true, copper: true, vias: true, finish: true, quality: true, special: false,
  });
  const addProject = usePCBStore((s) => s.addProject);

  const setField = <K extends keyof PCBAnalysisInput>(k: K, v: PCBAnalysisInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleSection = (k: keyof typeof openSections) =>
    setOpenSections((s) => ({ ...s, [k]: !s[k] }));

  const toggleFeature = (k: keyof PCBAnalysisInput["specialFeatures"]) =>
    setForm((f) => ({ ...f, specialFeatures: { ...f.specialFeatures, [k]: !f.specialFeatures[k] } }));

  const handleFiles = async (raw: FileList | null) => {
    if (!raw) return;
    const files = Array.from(raw);
    const converted = await Promise.all(files.map(async (f) => {
      const mimeType = f.type || "application/octet-stream";
      const [dataUrl, extractedText] = await Promise.all([
        new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.onerror = rej;
          r.readAsDataURL(f);
        }),
        extractPCBFileText(f),
      ]);
      return { name: f.name, type: mimeType, dataUrl, ...(extractedText ? { extractedText } : {}) };
    }));
    setForm((f) => ({ ...f, referenceFiles: [...(f.referenceFiles ?? []), ...converted] }));
  };

  const removeFile = (idx: number) =>
    setForm((f) => ({ ...f, referenceFiles: f.referenceFiles?.filter((_, i) => i !== idx) }));

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/pcb/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "PCB analysis failed.");
      setResult(data.result);
      const { referenceFiles: _rf, ...inputForStore } = form;
      addProject({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), input: inputForStore, result: data.result });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* ── Form ── */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-700 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-violet-500" /> PCB Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">

            {/* Board */}
            <div>
              <SectionHeader title="Board" open={openSections.board} onToggle={() => toggleSection("board")} />
              {openSections.board && (
                <div className="space-y-3 pt-1">
                  <Select label="Layer Count" value={String(form.layers)} onChange={(e) => setField("layers", Number(e.target.value) as PCBLayer)}>
                    {[1, 2, 4, 6, 8, 10, 12].map((l) => <option key={l}>{l}</option>)}
                  </Select>
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Width (mm)" type="number" min={1} value={form.boardWidth} onChange={(e) => setField("boardWidth", Number(e.target.value))} />
                    <Input label="Height (mm)" type="number" min={1} value={form.boardHeight} onChange={(e) => setField("boardHeight", Number(e.target.value))} />
                  </div>
                  <Select label="Thickness (mm)" value={form.thickness} onChange={(e) => setField("thickness", e.target.value as PCBThickness)}>
                    {["0.4","0.6","0.8","1.0","1.2","1.6","2.0","2.4"].map((t) => <option key={t}>{t}</option>)}
                  </Select>
                  <Select label="Base Material" value={form.material} onChange={(e) => setField("material", e.target.value as PCBMaterial)}>
                    {["FR4 Standard","FR4 High-Tg 170","FR4 High-Tg 180","Rogers 4003C","Rogers 4350B","Polyimide / Flex","Aluminum"].map((m) => <option key={m}>{m}</option>)}
                  </Select>
                  <Input label="Quantity (boards)" type="number" min={1} value={form.quantity} onChange={(e) => setField("quantity", Math.max(1, Number(e.target.value)))} />
                  <Select label="Region" value={form.region} onChange={(e) => setField("region", e.target.value as PCBRegion)}>
                    {["India","China","USA","Europe","Southeast Asia"].map((r) => <option key={r}>{r}</option>)}
                  </Select>
                </div>
              )}
            </div>
            <div className="border-t border-slate-100" />

            {/* Copper */}
            <div>
              <SectionHeader title="Copper & Traces" open={openSections.copper} onToggle={() => toggleSection("copper")} />
              {openSections.copper && (
                <div className="space-y-3 pt-1">
                  <Select label="Outer Copper Weight" value={form.outerCopperWeight} onChange={(e) => setField("outerCopperWeight", e.target.value as CopperWeight)}>
                    {["0.5oz","1oz","2oz","3oz"].map((c) => <option key={c}>{c}</option>)}
                  </Select>
                  {form.layers >= 4 && (
                    <Select label="Inner Copper Weight" value={form.innerCopperWeight} onChange={(e) => setField("innerCopperWeight", e.target.value as CopperWeight)}>
                      {["0.5oz","1oz"].map((c) => <option key={c}>{c}</option>)}
                    </Select>
                  )}
                  <Select label="Min Trace / Space" value={form.minTraceSpace} onChange={(e) => setField("minTraceSpace", e.target.value as TraceSpace)}>
                    {["3/3 mil","4/4 mil","5/5 mil","6/6 mil","8/8 mil"].map((t) => <option key={t}>{t}</option>)}
                  </Select>
                </div>
              )}
            </div>
            <div className="border-t border-slate-100" />

            {/* Vias */}
            <div>
              <SectionHeader title="Vias & Drilling" open={openSections.vias} onToggle={() => toggleSection("vias")} />
              {openSections.vias && (
                <div className="space-y-3 pt-1">
                  <Select label="Via Type" value={form.viaType} onChange={(e) => setField("viaType", e.target.value as ViaType)}>
                    {["Through-hole only","Blind Vias","Buried Vias","HDI / Microvias"].map((v) => <option key={v}>{v}</option>)}
                  </Select>
                  <Select label="Min Drill Size" value={form.minDrill} onChange={(e) => setField("minDrill", e.target.value as MinDrill)}>
                    {["0.10mm","0.15mm","0.20mm","0.25mm","0.30mm"].map((d) => <option key={d}>{d}</option>)}
                  </Select>
                  <Select label="Approx. Hole Count" value={form.holeCount} onChange={(e) => setField("holeCount", e.target.value as HoleCount)}>
                    {["<500","500-1000","1000-2000","2000-5000",">5000"].map((h) => <option key={h}>{h}</option>)}
                  </Select>
                </div>
              )}
            </div>
            <div className="border-t border-slate-100" />

            {/* Finish */}
            <div>
              <SectionHeader title="Surface Finish & Marking" open={openSections.finish} onToggle={() => toggleSection("finish")} />
              {openSections.finish && (
                <div className="space-y-3 pt-1">
                  <Select label="Surface Finish" value={form.surfaceFinish} onChange={(e) => setField("surfaceFinish", e.target.value as SurfaceFinish)}>
                    {["HASL (Leaded)","HASL Lead-Free","ENIG","ENEPIG","Immersion Silver","Immersion Tin","OSP","Hard Gold"].map((s) => <option key={s}>{s}</option>)}
                  </Select>
                  <div className="grid grid-cols-2 gap-2">
                    <Select label="Solder Mask" value={form.solderMaskColor} onChange={(e) => setField("solderMaskColor", e.target.value as SolderMaskColor)}>
                      {["Green","Red","Blue","Black","White","Yellow","Purple","Matte Black","Matte Green"].map((c) => <option key={c}>{c}</option>)}
                    </Select>
                    <Select label="Coverage" value={form.solderMaskCoverage} onChange={(e) => setField("solderMaskCoverage", e.target.value as SolderMaskCoverage)}>
                      {["Both Sides","Top Only","Bottom Only","None"].map((c) => <option key={c}>{c}</option>)}
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select label="Silkscreen" value={form.silkscreenColor} onChange={(e) => setField("silkscreenColor", e.target.value as SilkscreenColor)}>
                      {["White","Black","Yellow"].map((c) => <option key={c}>{c}</option>)}
                    </Select>
                    <Select label="Coverage" value={form.silkscreenCoverage} onChange={(e) => setField("silkscreenCoverage", e.target.value as SilkscreenCoverage)}>
                      {["Both Sides","Top Only","None"].map((c) => <option key={c}>{c}</option>)}
                    </Select>
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-slate-100" />

            {/* Quality */}
            <div>
              <SectionHeader title="Quality & Testing" open={openSections.quality} onToggle={() => toggleSection("quality")} />
              {openSections.quality && (
                <div className="space-y-3 pt-1">
                  <Select label="IPC Class" value={form.ipcClass} onChange={(e) => setField("ipcClass", e.target.value as IPCClass)}>
                    {["Class 1","Class 2","Class 3"].map((c) => <option key={c}>{c}</option>)}
                  </Select>
                  <Select label="Electrical Testing" value={form.testing} onChange={(e) => setField("testing", e.target.value as PCBTesting)}>
                    {["No Testing","Flying Probe (E-Test)","Flying Probe + AOI","ICT"].map((t) => <option key={t}>{t}</option>)}
                  </Select>
                </div>
              )}
            </div>
            <div className="border-t border-slate-100" />

            {/* Special Features */}
            <div>
              <SectionHeader title="Special Features" open={openSections.special} onToggle={() => toggleSection("special")} />
              {openSections.special && (
                <div className="pt-1 space-y-1">
                  {(Object.keys(SPECIAL_LABELS) as (keyof PCBAnalysisInput["specialFeatures"])[]).map((k) => (
                    <label key={k} className="flex items-center gap-2.5 cursor-pointer select-none rounded-lg px-2 py-1.5 hover:bg-slate-50 transition-colors">
                      <input type="checkbox" checked={form.specialFeatures[k]} onChange={() => toggleFeature(k)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                      <span className="text-xs text-slate-700">{SPECIAL_LABELS[k]}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-slate-100" />

            {/* File Upload */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Upload Files <span className="normal-case font-normal text-slate-400">(Gerber, Drill, BOM, PDF, Image)</span>
              </p>
              <label className="flex items-center gap-2 cursor-pointer rounded-xl border border-dashed border-slate-200 px-3 py-3 text-xs text-slate-500 hover:border-violet-300 hover:text-violet-600 transition-colors">
                <Upload className="h-4 w-4" />
                <span>Drag files here or click to browse</span>
                <input type="file" accept={FILE_ACCEPT} multiple className="hidden"
                  onChange={(e) => handleFiles(e.target.files).then(() => { e.target.value = ""; })} />
              </label>
              <p className="text-[10px] text-slate-400">Gerber (.gbr/.gtl/.gbl…), Excellon (.drl/.xln), BOM (.csv), PDF, images</p>
              {(form.referenceFiles ?? []).length > 0 && (
                <ul className="space-y-1.5">
                  {(form.referenceFiles ?? []).map((f, i) => (
                    <li key={i} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5">
                      {fileTypeIcon(f.name, f.type)}
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs text-slate-700">{f.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {fileTypeLabel(f.name, f.type)}
                          {f.extractedText ? " - parsed" : ""}
                        </p>
                      </div>
                      <button type="button" onClick={() => removeFile(i)} className="text-slate-300 hover:text-red-400 transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Textarea label="Additional Notes (optional)"
              placeholder="e.g. 50 ohm impedance on layer 1, RoHS required, IPC-A-600 Class B..."
              rows={2} value={form.additionalNotes ?? ""}
              onChange={(e) => setField("additionalNotes", e.target.value)} />

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <Button className="w-full bg-violet-600 hover:bg-violet-700" size="lg" onClick={handleSubmit} disabled={loading}>
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" />Analyzing...</>
                : <><Send className="h-4 w-4" />Run PCB Cost Analysis</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── Result ── */}
      <div className="lg:col-span-2">
        {loading && (
          <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-slate-200 bg-white py-24 shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-800">Analyzing PCB specification...</p>
              <p className="text-sm text-slate-400 mt-1">Computing DFM checks, cost breakdown, and process recommendations</p>
            </div>
          </div>
        )}
        {!loading && !result && (
          <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 py-24">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Cpu className="h-8 w-8 text-slate-300" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-500">No PCB analysis yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Fill in your PCB specs, optionally upload Gerber/BOM files, then click &quot;Run PCB Cost Analysis&quot;
              </p>
            </div>
          </div>
        )}
        {!loading && result && <PCBCostingResultView result={result} input={form} />}
      </div>
    </div>
  );
}
