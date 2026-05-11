"use client";

import React, { useState } from "react";
import { BarChart3, History, Loader2, Send, Zap, Factory } from "lucide-react";
import { FileUploader } from "@/components/FileUploader";
import { CostingResult } from "@/components/CostingResult";
import { ProjectHistory } from "@/components/ProjectHistory";
import { VendorDashboard } from "@/components/VendorDashboard";
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
import type { DiscoveryRequest } from "@/lib/vendorTypes";

type Tab = "analyze" | "history" | "vendors";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("analyze");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [region, setRegion] = useState<Region>("India");
  const [batchQty, setBatchQty] = useState<number>(100);
  const [method, setMethod] = useState<ManufacturingMethod>("Auto");
  const [material, setMaterial] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CostingResultType | null>(null);
  const [discoverTrigger, setDiscoverTrigger] = useState(0);

  const addProject = useProjectStore((s) => s.addProject);

  const handleFindVendors = (entry?: ProjectEntry) => {
    if (entry) {
      setResult(entry.result);
      setRegion(entry.region);
      setBatchQty(entry.batchQuantity);
      setMethod(entry.preferredMethod);
    }
    setDiscoverTrigger((t) => t + 1);
    setActiveTab("vendors");
  };

  const buildDiscoveryRequest = (): DiscoveryRequest => ({
    manufacturingMethod: result?.partSummary?.manufacturingMethod ?? (method === "Auto" ? "CNC Machining" : method),
    material: material.trim() || result?.partSummary?.material || "Unknown",
    toleranceLevel: "+/-0.05mm",
    batchQuantity: batchQty,
    surfaceFinish: "As per drawing",
    complexity: result?.partSummary?.complexityLevel ?? "Medium",
    partDescription: result?.partSummary?.partName ?? files[0]?.name ?? "Engineering component",
    region,
  });

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
        body: JSON.stringify({ files, region, batchQuantity: batchQty, preferredMethod: method, material: material.trim() || undefined, additionalNotes: notes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed.");

      const costResult: CostingResultType = data.result;
      setResult(costResult);
      addProject({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        region, batchQuantity: batchQty, preferredMethod: method,
        files: files.map(({ name, type, size }) => ({ name, type, size })),
        result: costResult,
        notes: notes || undefined,
      });
      setActiveTab("vendors");
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

  const tabConfig: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "analyze", label: "analyze", icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { key: "history", label: "history", icon: <History className="h-3.5 w-3.5" /> },
    { key: "vendors", label: "vendors", icon: <Factory className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-200">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 sm:text-base">
                Astra<span className="text-blue-600">Procure</span>
              </h1>
              <p className="hidden text-[10px] text-slate-400 sm:block">
                Aluminium Housing Costing Intelligence
              </p>
            </div>
          </div>

          <nav className="flex gap-1">
            {tabConfig.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all capitalize
                  ${activeTab === key
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
              >
                {icon}
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {activeTab === "analyze" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-slate-700">Upload Engineering Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUploader files={files} onChange={setFiles} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-slate-700">Analysis Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select label="Manufacturing Region" value={region} onChange={(e) => setRegion(e.target.value as Region)}>
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

                  <Input
                    label="Raw Material"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="e.g. Al 6061-T6, SS316L, EN8, Brass C360"
                  />

                  <Select label="Preferred Manufacturing Method" value={method} onChange={(e) => setMethod(e.target.value as ManufacturingMethod)}>
                    <option>Auto</option>
                    <option>CNC Machining</option>
                    <option>Die Casting</option>
                    <option>Extrusion</option>
                    <option>Sheet Metal</option>
                  </Select>

                  <Textarea
                    label="Additional Notes (optional)"
                    placeholder="e.g. tight tolerances on bore, anodize type II required..."
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />

                  {error && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                      <p className="text-xs text-red-600">{error}</p>
                    </div>
                  )}

                  <Button className="w-full" size="lg" onClick={handleSubmit} disabled={loading || files.length === 0}>
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />Analyzing...</>
                    ) : (
                      <><Send className="h-4 w-4" />Run Cost Analysis</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {loading && (
                <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-slate-200 bg-white py-24 shadow-sm">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 shadow-inner">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-slate-800">Analyzing engineering files...</p>
                    <p className="text-sm text-slate-400 mt-1">Extracting dimensions, tolerances, and material data</p>
                  </div>
                </div>
              )}

              {!loading && !result && (
                <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 py-24">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                    <BarChart3 className="h-8 w-8 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-slate-500">No analysis yet</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Upload engineering drawings and click &quot;Run Cost Analysis&quot;
                    </p>
                  </div>
                </div>
              )}

              {!loading && result && (
                <div className="space-y-3">
                  <CostingResult result={result} />
                  <button
                    onClick={() => handleFindVendors()}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 text-sm transition-all shadow-md shadow-blue-200 hover:shadow-blue-300"
                  >
                    <Factory className="h-4 w-4" />
                    Find Vendors for This Part
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Project History</h2>
            <ProjectHistory onSelect={handleSelectHistory} onFindVendors={handleFindVendors} />
          </div>
        )}

        {activeTab === "vendors" && (
          <VendorDashboard
            costingResult={result}
            discoveryRequest={buildDiscoveryRequest()}
            discoverTrigger={discoverTrigger}
          />
        )}
      </main>
    </div>
  );
}
