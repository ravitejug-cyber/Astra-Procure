"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Users,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Factory,
  Star,
} from "lucide-react";
import { VendorCard } from "@/components/VendorCard";
import { VendorImporter } from "@/components/VendorImporter";
import { RFQModal } from "@/components/RFQModal";
import { useVendorStore } from "@/lib/vendorStore";
import type { CostingResult } from "@/lib/types";
import type { DiscoveryRequest, Vendor, VendorDiscoveryResult } from "@/lib/vendorTypes";

type SubTab = "discovery" | "vendors" | "rfq-tracker";

interface Props {
  costingResult: CostingResult | null;
  discoveryRequest: DiscoveryRequest | null;
  discoverTrigger?: number;
}

export function VendorDashboard({ costingResult, discoveryRequest, discoverTrigger }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("discovery");
  const [loading, setLoading] = useState(false);
  const [discoveryResult, setDiscoveryResult] = useState<VendorDiscoveryResult | null>(null);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [strategyExpanded, setStrategyExpanded] = useState(false);
  const [rfqVendor, setRfqVendor] = useState<Vendor | null>(null);

  const { vendors } = useVendorStore();
  const prevTrigger = useRef(0);

  const handleDiscover = async () => {
    if (!discoveryRequest) return;
    setLoading(true);
    setDiscoveryError(null);
    setDiscoveryResult(null);

    try {
      const res = await fetch("/api/vendors/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: discoveryRequest,
          importedVendors: vendors.length > 0 ? vendors : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Vendor discovery failed.");
      setDiscoveryResult(data.result);
    } catch (err) {
      setDiscoveryError(err instanceof Error ? err.message : "Discovery failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (discoverTrigger && discoverTrigger !== prevTrigger.current && costingResult && discoveryRequest) {
      prevTrigger.current = discoverTrigger;
      setActiveSubTab("discovery");
      setDiscoveryResult(null);
      handleDiscover();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discoverTrigger, costingResult]);

  const topMatches = discoveryResult?.matches.filter((m) => m.recommendation === "top") ?? [];
  const backupMatches = discoveryResult?.matches.filter((m) => m.recommendation === "backup") ?? [];

  const subTabs: { key: SubTab; label: string; icon: React.ReactNode }[] = [
    { key: "discovery", label: "Discovery", icon: <Search className="h-3.5 w-3.5" /> },
    { key: "vendors", label: "My Vendors", icon: <Users className="h-3.5 w-3.5" /> },
    { key: "rfq-tracker", label: "RFQ Tracker", icon: <FileText className="h-3.5 w-3.5" /> },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
          {subTabs.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveSubTab(key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                activeSubTab === key
                  ? "bg-white shadow-sm text-slate-800"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {activeSubTab === "discovery" && (
          <div className="space-y-6">
            {!costingResult ? (
              <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 py-24 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <Factory className="h-8 w-8 text-slate-300" />
                </div>
                <div>
                  <p className="font-semibold text-slate-500">No analysis yet</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Run a cost analysis first to enable vendor discovery
                  </p>
                </div>
              </div>
            ) : (
              <>
                {!discoveryResult && !loading && (
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8 text-center space-y-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 mx-auto">
                      <Search className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Ready to discover vendors</p>
                      <p className="text-sm text-slate-500 mt-1">
                        AI will identify the best Indian manufacturers for your{" "}
                        <span className="font-medium">{costingResult.partSummary.partName}</span>
                      </p>
                    </div>
                    {discoveryError && (
                      <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                        {discoveryError}
                      </div>
                    )}
                    <button
                      onClick={handleDiscover}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 transition-colors shadow-sm"
                    >
                      <Search className="h-4 w-4" />
                      Find Vendors
                    </button>
                  </div>
                )}

                {loading && (
                  <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-slate-200 bg-white py-24 shadow-sm">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 shadow-inner">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-slate-800">Discovering vendors…</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Analysing Indian manufacturing ecosystem for best matches
                      </p>
                    </div>
                  </div>
                )}

                {discoveryResult && !loading && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 text-center">
                        <p className="text-2xl font-bold text-slate-900">{discoveryResult.matches.length}</p>
                        <p className="text-xs text-slate-500 mt-1">Vendors Found</p>
                      </div>
                      <div className="rounded-2xl border border-blue-100 bg-blue-50 shadow-sm p-4 text-center">
                        <p className="text-2xl font-bold text-blue-700">{discoveryResult.recommendedSuppliersCount}</p>
                        <p className="text-xs text-blue-600 mt-1">Top Suppliers</p>
                      </div>
                      <div className="rounded-2xl border border-amber-100 bg-amber-50 shadow-sm p-4 text-center">
                        <p className="text-2xl font-bold text-amber-700">{discoveryResult.sourcingRisks.length}</p>
                        <p className="text-xs text-amber-600 mt-1">Sourcing Risks</p>
                      </div>
                    </div>

                    {discoveryResult.sourcingRisks.length > 0 && (
                      <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 space-y-3">
                        <p className="text-xs font-semibold uppercase text-amber-700 tracking-wide flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Sourcing Risks
                        </p>
                        <ul className="space-y-2">
                          {discoveryResult.sourcingRisks.map((risk, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                              {risk}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {topMatches.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                          <Star className="h-4 w-4 text-blue-600" />
                          Top Recommended Suppliers
                        </h3>
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                          {topMatches.map((match) => (
                            <VendorCard
                              key={match.vendor.id}
                              match={match}
                              onGenerateRFQ={setRfqVendor}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {backupMatches.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                          <Users className="h-4 w-4 text-slate-500" />
                          Backup Suppliers
                        </h3>
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                          {backupMatches.map((match) => (
                            <VendorCard
                              key={match.vendor.id}
                              match={match}
                              onGenerateRFQ={setRfqVendor}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <button
                        onClick={() => setStrategyExpanded((v) => !v)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                      >
                        <span className="font-semibold text-slate-800 text-sm">Sourcing Strategy</span>
                        {strategyExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                      {strategyExpanded && (
                        <div className="px-5 pb-5 space-y-4 border-t border-slate-100">
                          {[
                            { label: "RFQ Strategy", value: discoveryResult.rfqStrategy },
                            { label: "Prototype Strategy", value: discoveryResult.prototypeStrategy },
                            { label: "Production Strategy", value: discoveryResult.productionStrategy },
                            { label: "Dual Vendor Rationale", value: discoveryResult.dualVendorRationale },
                          ].map(({ label, value }) => (
                            <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</p>
                              <p className="text-sm text-slate-700 leading-relaxed">{value}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-center">
                      <button
                        onClick={handleDiscover}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium px-5 py-2.5 transition-colors shadow-sm"
                      >
                        <Search className="h-4 w-4" />
                        Re-run Discovery
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeSubTab === "vendors" && <VendorImporter />}

        {activeSubTab === "rfq-tracker" && (
          <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <FileText className="h-8 w-8 text-slate-300" />
            </div>
            <div>
              <p className="font-semibold text-slate-500">RFQ management coming soon</p>
              <p className="text-sm text-slate-400 mt-1">
                Track your sent RFQs, responses, and quotation comparisons in one place
              </p>
            </div>
          </div>
        )}
      </div>

      <RFQModal
        vendor={rfqVendor}
        partDetails={costingResult}
        request={discoveryRequest}
        onClose={() => setRfqVendor(null)}
      />
    </>
  );
}
