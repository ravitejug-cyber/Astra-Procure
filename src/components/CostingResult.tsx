"use client";

import React, { useRef, useState } from "react";
import {
  AlertTriangle, CheckCircle2, ChevronRight, Clock, Download,
  Info, Lightbulb, Scale, Settings2, ShieldAlert, TrendingDown,
  Wrench, Users, PackageSearch,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CostingResult as CostingResultType } from "@/lib/types";

interface Props { result: CostingResultType; }

type Tab = "cost" | "process" | "risk" | "ideas";

const complexityColor = (level: string): "success" | "warning" | "destructive" | "secondary" => {
  const map: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
    Low: "success", Medium: "warning", High: "destructive", "Very High": "destructive",
  };
  return map[level] ?? "secondary";
};

const confidenceColor = (level: string): "success" | "warning" | "destructive" => {
  const map: Record<string, "success" | "warning" | "destructive"> = {
    High: "success", Medium: "warning", Low: "destructive",
  };
  return map[level] ?? "warning";
};

export function CostingResult({ result }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("cost");

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, { scale: 1.5, useCORS: true, backgroundColor: "#ffffff" });
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width / 1.5, canvas.height / 1.5] });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width / 1.5, canvas.height / 1.5);
    pdf.save(`astra-procure-${result.partSummary.partName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  const { partSummary: ps, costBreakdown, processAnalysis: pa, designRiskAnalysis: dr, costReductionIdeas, confidenceLevel, confidenceExplanation } = result;
  const totalRow = costBreakdown.find((r) => r.item === "Total Estimated Cost");
  const lineItems = costBreakdown.filter((r) => r.item !== "Total Estimated Cost");

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "cost", label: "Cost", icon: <TrendingDown className="h-3.5 w-3.5" /> },
    { key: "process", label: "Process", icon: <Wrench className="h-3.5 w-3.5" /> },
    { key: "risk", label: "Risk", icon: <ShieldAlert className="h-3.5 w-3.5" /> },
    { key: "ideas", label: "DFM Ideas", icon: <Lightbulb className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-3" ref={printRef}>
      {/* Hero Summary Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Top bar */}
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <Settings2 className="h-4 w-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 text-sm leading-tight truncate">{ps.partName}</p>
              <p className="text-xs text-slate-500 truncate">{ps.manufacturingMethod} . {ps.material}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={complexityColor(ps.complexityLevel)} className="text-xs">{ps.complexityLevel}</Badge>
            <Badge variant={confidenceColor(confidenceLevel)} className="gap-1 text-xs">
              {confidenceLevel === "High" ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              {confidenceLevel}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="text-xs h-7 px-2.5">
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-slate-100">
          <div className="px-4 py-3 flex items-center gap-2">
            <Scale className="h-4 w-4 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Weight</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{ps.estimatedWeight}</p>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Machining Time</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{ps.machiningTimeHours ?? "-"}</p>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Manpower Cost</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{ps.manpowerCostPerUnit ?? "-"}</p>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center gap-2">
            <PackageSearch className="h-4 w-4 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Raw Material Rate</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{ps.rawMaterialMarketPrice ?? "-"}</p>
            </div>
          </div>
        </div>

        {/* Total cost banner */}
        {totalRow && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-blue-100">Total Estimated Cost</span>
            <span className="text-xl font-bold text-white font-mono">{totalRow.estimatedCost}</span>
          </div>
        )}

        {/* Confidence note */}
        {confidenceExplanation && (
          <div className="px-5 py-2.5 flex items-start gap-2 bg-slate-50 border-t border-slate-100">
            <Info className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500 leading-relaxed">{confidenceExplanation}</p>
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
                  ? "border-blue-600 text-blue-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* Cost Tab */}
          {activeTab === "cost" && (
            <div className="space-y-3">
              {ps.helicoilCost && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-2.5 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700">Helicoil / Threaded Inserts</p>
                    <p className="text-xs text-amber-700">{ps.helicoilCost}</p>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Item</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Est. Cost</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden sm:table-cell">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lineItems.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-2.5 text-slate-700">{row.item}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-medium text-slate-800 whitespace-nowrap">{row.estimatedCost}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-400 hidden sm:table-cell">{row.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                  <p className="font-medium text-slate-400 uppercase tracking-wide mb-0.5">Batch Size</p>
                  <p className="font-semibold text-slate-700">{ps.suggestedBatchSize}</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                  <p className="font-medium text-slate-400 uppercase tracking-wide mb-0.5">Annual Volume</p>
                  <p className="font-semibold text-slate-700">{ps.estimatedAnnualVolume}</p>
                </div>
              </div>
            </div>
          )}

          {/* Process Tab */}
          {activeTab === "process" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  ["Recommended Process", pa.recommendedProcess],
                  ["Alternative Process", pa.alternativeProcess],
                  ["Estimated Cycle Time", pa.estimatedCycleTime],
                  ["Tolerance Capability", pa.suggestedToleranceCapability],
                  ["Fixture Complexity", pa.fixtureComplexity],
                  ["Recommended Machine", pa.recommendedMachineType],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
              {pa.keyMachiningChallenges?.length > 0 && (
                <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3.5">
                  <p className="text-xs font-semibold uppercase text-amber-700 mb-2 tracking-wide">Key Machining Challenges</p>
                  <ul className="space-y-1.5">
                    {pa.keyMachiningChallenges.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <ChevronRight className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />{c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Risk Tab */}
          {activeTab === "risk" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                ["Thin Wall Risks", dr.thinWallRisks],
                ["Tool Accessibility", dr.toolAccessibility],
                ["Warpage Risks", dr.warpageRisks],
                ["Tight Tolerance Risks", dr.tightToleranceRisks],
                ["Surface Finish Risks", dr.surfaceFinishRisks],
                ["Threading Risks", dr.threadingRisks],
                ["Deep Pocket Risks", dr.deepPocketRisks],
                ["Die Casting Porosity", dr.dieCastingPorosityRisks],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-sm text-slate-700">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Ideas Tab */}
          {activeTab === "ideas" && (
            <ol className="space-y-2">
              {costReductionIdeas?.map((idea, i) => (
                <li key={i} className="flex gap-3 text-sm items-start rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-100 px-3.5 py-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-white">{i + 1}</span>
                  <span className="text-slate-700">{idea}</span>
                </li>
              ))}
              {(!costReductionIdeas || costReductionIdeas.length === 0) && (
                <p className="text-sm text-slate-400 text-center py-8">No cost reduction ideas available.</p>
              )}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
