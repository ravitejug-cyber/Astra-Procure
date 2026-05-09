"use client";

import React, { useRef } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Download,
  Lightbulb,
  Settings2,
  ShieldAlert,
  TrendingDown,
  Wrench,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CostingResult as CostingResultType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  result: CostingResultType;
}

const complexityColor = (level: string) => {
  const map: Record<string, string> = {
    Low: "success",
    Medium: "warning",
    High: "destructive",
    "Very High": "destructive",
  };
  return (map[level] ?? "secondary") as "success" | "warning" | "destructive" | "secondary";
};

const confidenceColor = (level: string) => {
  const map: Record<string, string> = { High: "success", Medium: "warning", Low: "destructive" };
  return (map[level] ?? "secondary") as "success" | "warning" | "destructive" | "secondary";
};

export function CostingResult({ result }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, { scale: 1.5, useCORS: true, backgroundColor: "#0f172a" });
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width / 1.5, canvas.height / 1.5] });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width / 1.5, canvas.height / 1.5);
    pdf.save(`astra-procure-${result.partSummary.partName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  const { partSummary: ps, costBreakdown, processAnalysis: pa, designRiskAnalysis: dr, costReductionIdeas, confidenceLevel, confidenceExplanation } = result;

  const totalRow = costBreakdown.find((r) => r.item === "Total Estimated Cost");
  const lineItems = costBreakdown.filter((r) => r.item !== "Total Estimated Cost");

  return (
    <div className="space-y-5">
      {/* Export button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExportPDF}>
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      <div ref={printRef} className="space-y-5">
        {/* Part Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-blue-400" />
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
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {[
                ["Part Name", ps.partName],
                ["Manufacturing Method", ps.manufacturingMethod],
                ["Material", ps.material],
                ["Estimated Weight", ps.estimatedWeight],
                ["Suggested Batch Size", ps.suggestedBatchSize],
                ["Est. Annual Volume", ps.estimatedAnnualVolume],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-slate-500 uppercase tracking-wide">{label}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-slate-200">{value}</dd>
                </div>
              ))}
            </dl>
            {confidenceExplanation && (
              <p className="mt-4 text-xs text-slate-400 border-t border-slate-700 pt-3 flex gap-2">
                <Info className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
                {confidenceExplanation}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-emerald-400" />
              Cost Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="pb-2 text-left text-xs font-medium uppercase text-slate-500">Item</th>
                    <th className="pb-2 text-right text-xs font-medium uppercase text-slate-500">Est. Cost</th>
                    <th className="pb-2 pl-4 text-left text-xs font-medium uppercase text-slate-500 hidden sm:table-cell">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {lineItems.map((row) => (
                    <tr key={row.item} className="hover:bg-slate-700/20 transition-colors">
                      <td className="py-2.5 text-slate-300">{row.item}</td>
                      <td className="py-2.5 text-right font-mono text-slate-200 whitespace-nowrap">{row.estimatedCost}</td>
                      <td className="py-2.5 pl-4 text-xs text-slate-500 hidden sm:table-cell">{row.notes}</td>
                    </tr>
                  ))}
                  {totalRow && (
                    <tr className="bg-blue-600/10 border-t-2 border-blue-600/40">
                      <td className="py-3 font-semibold text-blue-300">{totalRow.item}</td>
                      <td className="py-3 text-right font-mono font-bold text-blue-300 text-base whitespace-nowrap">
                        {totalRow.estimatedCost}
                      </td>
                      <td className="py-3 pl-4 text-xs text-slate-500 hidden sm:table-cell">{totalRow.notes}</td>
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
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-amber-400" />
              Process Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ["Recommended Process", pa.recommendedProcess],
                ["Alternative Process", pa.alternativeProcess],
                ["Estimated Cycle Time", pa.estimatedCycleTime],
                ["Tolerance Capability", pa.suggestedToleranceCapability],
                ["Fixture Complexity", pa.fixtureComplexity],
                ["Recommended Machine", pa.recommendedMachineType],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-900/60 p-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
                  <p className="mt-1 text-sm text-slate-200">{value}</p>
                </div>
              ))}
            </div>
            {pa.keyMachiningChallenges?.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase text-slate-500 mb-2">Key Machining Challenges</p>
                <ul className="space-y-1">
                  {pa.keyMachiningChallenges.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <ChevronRight className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
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
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-400" />
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
                <div key={label} className="rounded-lg border border-slate-700/60 p-3">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-sm text-slate-300">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cost Reduction Ideas */}
        {costReductionIdeas?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-400" />
                Cost Reduction Ideas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {costReductionIdeas.map((idea, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-xs font-bold text-yellow-400">
                      {i + 1}
                    </span>
                    <span className="text-slate-300">{idea}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Full Markdown Analysis */}
        {result.rawMarkdown && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-400">Full Engineering Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-xs text-slate-400 font-mono leading-relaxed max-h-96 overflow-y-auto">
                {result.rawMarkdown}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
