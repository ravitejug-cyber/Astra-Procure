"use client";

import React, { useState } from "react";
import { Clock, Trash2, ChevronDown, ChevronRight, FolderOpen } from "lucide-react";
import { useProjectStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProjectEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  onSelect: (entry: ProjectEntry) => void;
}

export function ProjectHistory({ onSelect }: Props) {
  const { projects, removeProject, clearAll } = useProjectStore();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <FolderOpen className="h-10 w-10 text-slate-600" />
        <p className="text-sm text-slate-500">No saved analyses yet.</p>
        <p className="text-xs text-slate-600">Submit a costing request to build history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase text-slate-500 tracking-wide">{projects.length} saved analyses</p>
        <Button variant="ghost" size="sm" className="text-xs text-red-400 hover:text-red-300" onClick={clearAll}>
          Clear all
        </Button>
      </div>

      <ul className="space-y-2">
        {projects.map((p) => {
          const isOpen = expanded === p.id;
          const totalRow = p.result.costBreakdown.find((r) => r.item === "Total Estimated Cost");
          const date = new Date(p.createdAt).toLocaleDateString("en-US", {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
          });

          return (
            <li key={p.id} className="rounded-lg border border-slate-700 bg-slate-800/40 overflow-hidden">
              <button
                className="w-full flex items-start gap-3 p-3 text-left hover:bg-slate-700/30 transition-colors"
                onClick={() => setExpanded(isOpen ? null : p.id)}
              >
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {p.result.partSummary.partName}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />
                    {date}
                  </p>
                </div>
                {totalRow && (
                  <span className="text-sm font-mono font-semibold text-emerald-400 shrink-0">
                    {totalRow.estimatedCost}
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="px-3 pb-3 space-y-3 border-t border-slate-700/60 pt-3">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary">{p.region}</Badge>
                    <Badge variant="outline">Qty: {p.batchQuantity.toLocaleString()}</Badge>
                    <Badge variant="info">{p.result.partSummary.manufacturingMethod}</Badge>
                    <Badge variant={
                      p.result.confidenceLevel === "High" ? "success" :
                      p.result.confidenceLevel === "Medium" ? "warning" : "destructive"
                    }>
                      {p.result.confidenceLevel} Confidence
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-500">Material</p>
                      <p className="text-slate-300">{p.result.partSummary.material}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Weight</p>
                      <p className="text-slate-300">{p.result.partSummary.estimatedWeight}</p>
                    </div>
                  </div>

                  {p.files.length > 0 && (
                    <p className="text-xs text-slate-500">
                      Files: {p.files.map((f) => f.name).join(", ")}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" className="flex-1 text-xs" onClick={() => onSelect(p)}>
                      View Analysis
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => removeProject(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
