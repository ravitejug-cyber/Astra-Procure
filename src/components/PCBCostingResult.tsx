"use client";

import React, { useRef, useState } from "react";
import {
  AlertTriangle, CheckCircle2, XCircle, ChevronRight, Download,
  Info, Lightbulb, TrendingDown, ShieldAlert, Cpu, Factory,
  Wrench, BarChart2, Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PCBCostingResult, DFMCheck, PCBAnalysisInput } from "@/lib/pcbTypes";

interface Props {
  result: PCBCostingResult;
  input: PCBAnalysisInput;
}

type Tab = "cost" | "dfm" | "process" | "risk" | "ideas";

const complexityColor = (level: string): "success" | "warning" | "destructive" | "secondary" => {
  const m: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
    Low: "success", Medium: "warning", High: "destructive", "Very High": "destructive",
  };
  return m[level] ?? "secondary";
};

const confidenceColor = (l: string): "success" | "warning" | "destructive" =>
  ({ High: "success", Medium: "warning", Low: "destructive" } as Record<string, "success" | "warning" | "destructive">)[l] ?? "warning";

function DFMRow({ check }: { check: DFMCheck }) {
  const icon =
    check.status === "pass" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> :
    check.status === "warning" ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> :
    <XCircle className="h-3.5 w-3.5 text-red-500" />;
  const bg =
    check.status === "pass" ? "bg-emerald-50 border-emerald-100" :
    check.status === "warning" ? "bg-amber-50 border-amber-100" :
    "bg-red-50 border-red-100";
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 ${bg}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-800">{check.check}</p>
        <p className="text-xs text-slate-600 mt-0.5">{check.detail}</p>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: string }) {
  const num = parseInt(value) || 0;
  const color = num < 30 ? "bg-emerald-500" : num < 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-xs font-bold text-slate-700">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100">
        <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${Math.min(num, 100)}%` }} />
      </div>
    </div>
  );
}

function CostTable({ rows, title }: { rows: PCBCostingResult["fabricationCost"]; title: string }) {
  const total = rows.find((r) => r.item.toLowerCase().includes("total"));
  const lines = rows.filter((r) => !r.item.toLowerCase().includes("total"));
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{title}</p>
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Item</th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Cost</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden sm:table-cell">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-2 text-slate-700">{row.item}</td>
                <td className="px-4 py-2 text-right font-mono font-medium text-slate-800 whitespace-nowrap">{row.estimatedCost}</td>
                <td className="px-4 py-2 text-xs text-slate-400 hidden sm:table-cell">{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total && (
        <div className="flex items-center justify-between rounded-xl bg-violet-600 px-4 py-2.5">
          <span className="text-sm font-semibold text-violet-100">{total.item}</span>
          <span className="text-lg font-bold text-white font-mono">{total.estimatedCost}</span>
        </div>
      )}
    </div>
  );
}

export function PCBCostingResultView({ result, input }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("cost");

  const handleExport = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, { scale: 1.5, useCORS: true, backgroundColor: "#ffffff" });
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width / 1.5, canvas.height / 1.5] });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width / 1.5, canvas.height / 1.5);
    pdf.save(`pcb-analysis-${input.layers}L-${input.boardWidth}x${input.boardHeight}.pdf`);
  };

  const { pcbSummary: ps, dfmChecks } = result;
  const passCount = dfmChecks.filter((c) => c.status === "pass").length;
  const warnCount = dfmChecks.filter((c) => c.status === "warning").length;
  const failCount = dfmChecks.filter((c) => c.status === "fail").length;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "cost", label: "Cost", icon: <TrendingDown className="h-3.5 w-3.5" /> },
    { key: "dfm", label: `DFM ${failCount > 0 ? `(${failCount})` : ""}`, icon: <BarChart2 className="h-3.5 w-3.5" /> },
    { key: "process", label: "Process", icon: <Wrench className="h-3.5 w-3.5" /> },
    { key: "risk", label: "Risk", icon: <ShieldAlert className="h-3.5 w-3.5" /> },
    { key: "ideas", label: "DFM Tips", icon: <Lightbulb className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-3" ref={printRef}>
      {/* Hero card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-50">
              <Cpu className="h-4 w-4 text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 text-sm leading-tight">{ps.boardType}</p>
              <p className="text-xs text-slate-500 truncate">{ps.layers} layers - {ps.dimensions} - {ps.material}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={complexityColor(ps.complexityLevel)} className="text-xs">{ps.complexityLevel}</Badge>
            <Badge variant={confidenceColor(result.confidenceLevel)} className="gap-1 text-xs">
              {result.confidenceLevel === "High" ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              {result.confidenceLevel}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleExport} className="text-xs h-7 px-2.5">
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Score bars + metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-5 py-3 border-b border-slate-100">
          <div className="space-y-2.5">
            <ScoreBar label="Overall Complexity" value={ps.complexityScore} />
            <ScoreBar label="Fabrication Score" value={ps.fabricationScore} />
            <ScoreBar label="Assembly Score" value={ps.assemblyScore} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-xs text-slate-400">Board Area</p>
              <p className="text-sm font-semibold text-slate-800">{ps.boardArea}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-xs text-slate-400">Est. Yield</p>
              <p className="text-sm font-semibold text-slate-800">{ps.estimatedYield}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-xs text-slate-400">Category</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{ps.manufacturingCategory}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-xs text-slate-400">Lead Time</p>
              <p className="text-sm font-semibold text-slate-800">{result.processRecommendations.leadTimeStandard}</p>
            </div>
          </div>
        </div>

        {/* DFM quick summary */}
        <div className="flex items-center gap-4 px-5 py-2.5">
          <span className="text-xs text-slate-500 font-medium">DFM Checks:</span>
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />{passCount} pass</span>
          {warnCount > 0 && <span className="flex items-center gap-1 text-xs font-semibold text-amber-600"><AlertTriangle className="h-3.5 w-3.5" />{warnCount} warning</span>}
          {failCount > 0 && <span className="flex items-center gap-1 text-xs font-semibold text-red-600"><XCircle className="h-3.5 w-3.5" />{failCount} fail</span>}
        </div>

        {result.confidenceExplanation && (
          <div className="px-5 py-2 flex items-start gap-2 bg-slate-50 border-t border-slate-100">
            <Info className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500">{result.confidenceExplanation}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex gap-0 border-b border-slate-100 bg-slate-50/70">
          {tabs.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all border-b-2 ${
                activeTab === key
                  ? "border-violet-600 text-violet-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          {/* Cost Tab */}
          {activeTab === "cost" && (
            <>
              <CostTable rows={result.fabricationCost} title="Fabrication Cost" />
              <CostTable rows={result.assemblyCost} title="Assembly Cost (estimate)" />
              {result.panelizationAnalysis && (
                <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3.5">
                  <p className="text-xs font-semibold uppercase text-violet-700 mb-1.5 tracking-wide flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" /> Panelization Analysis
                  </p>
                  <p className="text-sm text-slate-700">{result.panelizationAnalysis}</p>
                </div>
              )}
              {result.recommendedIndianVendors?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                    <Factory className="h-3.5 w-3.5" /> Recommended Indian Vendors
                  </p>
                  {result.recommendedIndianVendors.map((v, i) => (
                    <div key={i} className="flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-600">{i + 1}</span>
                      <p className="text-sm text-slate-700">{v}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* DFM Tab */}
          {activeTab === "dfm" && (
            <div className="space-y-2">
              {dfmChecks.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">No DFM checks available.</p>
              )}
              {["fail", "warning", "pass"].map((status) =>
                dfmChecks
                  .filter((c) => c.status === status)
                  .map((c, i) => <DFMRow key={`${status}-${i}`} check={c} />)
              )}
            </div>
          )}

          {/* Process Tab */}
          {activeTab === "process" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {([
                  ["SMT Process Type", result.processRecommendations.smtProcessType],
                  ["Reflow Profile", result.processRecommendations.reflowProfile],
                  ["Wave Solder", result.processRecommendations.waveSolderCompatibility],
                  ["AOI Required", result.processRecommendations.aoiRequired],
                  ["X-Ray Required", result.processRecommendations.xrayRequired],
                  ["Selective Solder", result.processRecommendations.selectiveSolderRequired],
                  ["Testing Method", result.processRecommendations.testingMethod],
                  ["Lead Time (Express)", result.processRecommendations.leadTimeExpress],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-800">{value || "-"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Tab */}
          {activeTab === "risk" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {([
                ["Impedance Risks", result.manufacturingRisks.impedanceRisks],
                ["Drill Risks", result.manufacturingRisks.drillRisks],
                ["Lamination Risks", result.manufacturingRisks.laminationRisks],
                ["Surface Finish Risks", result.manufacturingRisks.finishRisks],
                ["Yield Risks", result.manufacturingRisks.yieldRisks],
                ["Warpage Risks", result.manufacturingRisks.warpageRisks],
                ["Solder Mask Risks", result.manufacturingRisks.solderMaskRisks],
                ["Via Risks", result.manufacturingRisks.viaRisks],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-sm text-slate-700">{value || "No significant risks identified."}</p>
                </div>
              ))}
            </div>
          )}

          {/* DFM Tips / Cost Reduction */}
          {activeTab === "ideas" && (
            <div className="space-y-3">
              {result.dfmRecommendations?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">DFM Recommendations</p>
                  <ol className="space-y-2">
                    {result.dfmRecommendations.map((idea, i) => (
                      <li key={i} className="flex gap-3 text-sm items-start rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 px-3.5 py-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-400 text-xs font-bold text-white">{i + 1}</span>
                        <span className="text-slate-700">{idea}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {result.costReductionIdeas?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Cost Reduction Ideas</p>
                  <ol className="space-y-2">
                    {result.costReductionIdeas.map((idea, i) => (
                      <li key={i} className="flex gap-3 text-sm items-start rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-100 px-3.5 py-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-white">{i + 1}</span>
                        <span className="text-slate-700">{idea}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {(!result.dfmRecommendations?.length && !result.costReductionIdeas?.length) && (
                <p className="text-sm text-slate-400 text-center py-8">No recommendations available.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
