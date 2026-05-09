"use client";

import React, { useState } from "react";
import {
  BarChart3,
  History,
  Loader2,
  Send,
  Zap,
} from "lucide-react";
import { FileUploader } from "@/components/FileUploader";
import { CostingResult } from "@/components/CostingResult";
import { ProjectHistory } from "@/components/ProjectHistory";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectStore } from "@/lib/store";
import type {
  UploadedFile,
  Region,
  ManufacturingMethod,
  CostingResult as CostingResultType,
  ProjectEntry,
} from "@/lib/types";

type Tab = "analyze" | "history";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("analyze");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [region, setRegion] = useState<Region>("India");
  const [batchQty, setBatchQty] = useState<number>(100);
  const [method, setMethod] = useState<ManufacturingMethod>("Auto");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CostingResultType | null>(null);

  const addProject = useProjectStore((s) => s.addProject);

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError("Please upload at least one file before analyzing.");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files,
          region,
          batchQuantity: batchQty,
          preferredMethod: method,
          additionalNotes: notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed.");

      const costResult: CostingResultType = data.result;
      setResult(costResult);

      const entry: ProjectEntry = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        region,
        batchQuantity: batchQty,
        preferredMethod: method,
        files: files.map(({ name, type, size }) => ({ name, type, size })),
        result: costResult,
        notes: notes || undefined,
      };
      addProject(entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (entry: ProjectEntry) => {
    setResult(entry.result);
    setRegion(entry.region);
    setBatchQty(entry.batchQuantity);
    setMethod(entry.preferredMethod);
    setActiveTab("analyze");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white sm:text-base">
                Astra<span className="text-blue-400">Procure</span>
              </h1>
              <p className="hidden text-[10px] text-slate-500 sm:block">
                Aluminium Housing Costing Intelligence
              </p>
            </div>
          </div>

          <nav className="flex gap-1">
            {(["analyze", "history"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors capitalize
                  ${activeTab === tab
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-slate-200"}`}
              >
                {tab === "analyze" ? <BarChart3 className="h-3.5 w-3.5" /> : <History className="h-3.5 w-3.5" />}
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {activeTab === "analyze" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left panel — inputs */}
            <div className="lg:col-span-1 space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Upload Engineering Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUploader files={files} onChange={setFiles} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Analysis Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    label="Manufacturing Region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value as Region)}
                  >
                    <option>India</option>
                    <option>China</option>
                    <option>USA</option>
                    <option>Europe</option>
                    <option>Southeast Asia</option>
                  </Select>

                  <Input
                    label="Batch Quantity (units)"
                    type="number"
                    min={1}
                    value={batchQty}
                    onChange={(e) => setBatchQty(Math.max(1, parseInt(e.target.value) || 1))}
                  />

                  <Select
                    label="Preferred Manufacturing Method"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as ManufacturingMethod)}
                  >
                    <option>Auto</option>
                    <option>CNC Machining</option>
                    <option>Die Casting</option>
                    <option>Extrusion</option>
                    <option>Sheet Metal</option>
                  </Select>

                  <Textarea
                    label="Additional Notes (optional)"
                    placeholder="e.g. tight tolerances on bore, anodize type II required, specific material grade…"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />

                  {error && (
                    <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-md px-3 py-2">
                      {error}
                    </p>
                  )}

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={loading || files.length === 0}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Run Cost Analysis
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right panel — results */}
            <div className="lg:col-span-2">
              {loading && (
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-700 bg-slate-800/30 py-24">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
                  <div className="text-center">
                    <p className="font-medium text-slate-200">Analyzing engineering files…</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Extracting dimensions, tolerances, and material data
                    </p>
                  </div>
                </div>
              )}

              {!loading && !result && (
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-slate-700 py-24">
                  <BarChart3 className="h-12 w-12 text-slate-700" />
                  <div className="text-center">
                    <p className="font-medium text-slate-400">No analysis yet</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Upload engineering drawings and click &quot;Run Cost Analysis&quot;
                    </p>
                  </div>
                </div>
              )}

              {!loading && result && <CostingResult result={result} />}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">Project History</h2>
            <ProjectHistory onSelect={handleSelectHistory} />
          </div>
        )}
      </main>
    </div>
  );
}
