"use client";

import React, { useRef } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Download,
  Info,
  Lightbulb,
  Settings2,
  ShieldAlert,
  TrendingDown,
  Wrench,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CostingResult as CostingResultType } from "@/lib/types";

interface Props {
  result: CostingResultType;
}

const complexityColor = (level: string) => {
  const map: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
    Low: "success", Medium: "warning", High: "destructive", "Very High": "destructive",
  };
  return map[level] ?? "secondary";
};

const confidenceColor = (level: string) => {
  const map: Record<string, "success" | "warning" | "destructive"> = {
    High: "success", Medium: "warning", Low: "destructive",
  };
  return map[level] ?? "secondary" as "success";
};

export function CostingResult({ result }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExportPDF}>
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      <div ref={printRef} className="space-y-4">
        {/* Part Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                  <Settings2 className="h-4 w-4 text-blue-600" />
                </div>
                Part Summary
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Badge variant={complexityColor(ps.complexityLevel)}>{ps.complexityLevel} Complexity</Badge>
                <Badge variant={confidenceColor(confidenceLevel)} className="gap-1">
                  {confidenceLevel === "High" ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {confidenceLevel} Confidence
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {[
                ["Part Name", ps.partName],
                ["Manufacturing Method", ps.manufacturingMethod],
                ["Material", ps.material],
                ["Estimated Weight", ps.estimatedWeight],
                ["Suggested Batch Size", ps.suggestedBatchSize],
                ["Est. Annual Volume", ps.estimatedAnnualVolume],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd>
                </div>
              ))}
            </dl>
            {confidenceExplanation && (
              <p className="mt-4 text-xs text-slate-500 border-t border-slate-100 pt-3 flex gap-2">
                <Info className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                {confidenceExplanation}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                <TrendingDown className="h-4 w-4 text-emerald-600" />
              </div>
              Cost Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Item</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Est. Cost</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden sm:table-cell">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineItems.map((row) => (
                    <tr key={row.item} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-slate-700">{row.item}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-800 whitespace-nowrap">{row.estimatedCost}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 hidden sm:table-cell">{row.notes}</td>
                    </tr>
                  ))}
                  {totalRow && (
                    <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <td className="px-4 py-3.5 font-bold text-blue-700">{totalRow.item}</td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-blue-700 text-base whitespace-nowrap">{totalRow.estimatedCost}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-400 hidden sm:table-cell">{totalRow.notes}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Process Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
                <Wrench className="h-4 w-4 text-amber-600" />
              </div>
              Process Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ["Recommended Process", pa.recommendedProcess],
                ["Alternative Process", pa.alternativeProcess],
                ["Estimated Cycle Time", pa.estimatedCycleTime],
                ["Tolerance Capability", pa.suggestedToleranceCapability],
                ["Fixture Complexity", pa.fixtureComplexity],
                ["Recommended Machine", pa.recommendedMachineType],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
                </div>
              ))}
            </div>
            {pa.keyMachiningChallenges?.length > 0 && (
              <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                <p className="text-xs font-semibold uppercase text-amber-700 mb-2.5 tracking-wide">Key Machining Challenges</p>
                <ul className="space-y-1.5">
                  {pa.keyMachiningChallenges.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <ChevronRight className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Design Risk Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50">
                <ShieldAlert className="h-4 w-4 text-red-500" />
              </div>
              Design Risk Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-sm text-slate-700">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cost Reduction Ideas */}
        {costReductionIdeas?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-50">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                </div>
                Cost Reduction Ideas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2.5">
                {costReductionIdeas.map((idea, i) => (
                  <li key={i} className="flex gap-3 text-sm items-start rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-100 p-3.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="text-slate-700">{idea}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {result.rawMarkdown && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500 font-medium">Full Engineering Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-xs text-slate-500 font-mono leading-relaxed max-h-96 overflow-y-auto">
                {result.rawMarkdown}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
