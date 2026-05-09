"use client";

import React, { useState } from "react";
import { Clock, Trash2, ChevronDown, ChevronRight, FolderOpen } from "lucide-react";
import { useProjectStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProjectEntry } from "@/lib/types";

interface Props { onSelect: (entry: ProjectEntry) => void; }

export function ProjectHistory({ onSelect }: Props) {
  const { projects, removeProject, clearAll } = useProjectStore();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <FolderOpen className="h-7 w-7 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-600">No saved analyses yet</p>
        <p className="text-xs text-slate-400">Submit a costing request to build history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase text-slate-400 tracking-wide">{projects.length} saved analyses</p>
        <Button variant="ghost" size="sm" className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={clearAll}>Clear all</Button>
      </div>
      <ul className="space-y-2">
        {projects.map((p) => {
          const isOpen = expanded === p.id;
          const totalRow = p.result.costBreakdown.find((r) => r.item === "Total Estimated Cost");
          const date = new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
          return (
            <li key={p.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <button className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 transition-colors" onClick={() => setExpanded(isOpen ? null : p.id)}>
                {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{p.result.partSummary.partName}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" />{date}</p>
                </div>
                {totalRow && <span className="text-sm font-mono font-bold text-emerald-600 shrink-0">{totalRow.estimatedCost}</span>}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3 bg-slate-50/50">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{p.region}</Badge>
                    <Badge variant="outline">Qty: {p.batchQuantity.toLocaleString()}</Badge>
                    <Badge variant="info">{p.result.partSummary.manufacturingMethod}</Badge>
                    <Badge variant={p.result.confidenceLevel === "High" ? "success" : p.result.confidenceLevel === "Medium" ? "warning" : "destructive"}>{p.result.confidenceLevel} Confidence</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[["Material", p.result.partSummary.material], ["Weight", p.result.partSummary.estimatedWeight]].map(([k, v]) => (
                      <div key={k} className="rounded-xl bg-white border border-slate-100 p-2.5">
                        <p className="text-xs text-slate-400">{k}</p>
                        <p className="text-sm font-medium text-slate-700">{v}</p>
                      </div>
                    ))}
                  </div>
                  {p.files.length > 0 && <p className="text-xs text-slate-400 truncate">Files: {p.files.map((f) => f.name).join(", ")}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" variant="default" className="flex-1 text-xs" onClick={() => onSelect(p)}>View Analysis</Button>
                    <Button size="sm" variant="destructive" onClick={() => removeProject(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
