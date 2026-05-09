"use client";

import React, { useEffect, useState } from "react";
import { X, Copy, Loader2, CheckCircle, FileText } from "lucide-react";
import type { Vendor, DiscoveryRequest, RFQTemplate } from "@/lib/vendorTypes";
import type { CostingResult } from "@/lib/types";

interface Props {
  vendor: Vendor | null;
  partDetails: CostingResult | null;
  request: DiscoveryRequest | null;
  onClose: () => void;
}

export function RFQModal({ vendor, partDetails, request, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [rfq, setRfq] = useState<RFQTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<"email" | "technical">("email");

  useEffect(() => {
    if (!vendor || !request) return;
    setLoading(true);
    setError(null);
    setRfq(null);

    fetch("/api/vendors/rfq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendor, partDetails, request }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "RFQ generation failed.");
        setRfq(data.result);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to generate RFQ.");
      })
      .finally(() => setLoading(false));
  }, [vendor, partDetails, request]);

  const handleCopy = async () => {
    if (!rfq) return;
    const text = activeSection === "email"
      ? `Subject: ${rfq.subject}\n\n${rfq.emailBody}`
      : rfq.technicalSummary;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!vendor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">RFQ Generator</h2>
              <p className="text-xs text-slate-500">{vendor.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-800">Generating RFQ…</p>
                <p className="text-xs text-slate-400 mt-1">
                  Crafting a professional procurement email for {vendor.name}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="m-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!loading && rfq && (
            <div className="p-6 space-y-4">
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Subject</p>
                <p className="text-sm font-medium text-slate-800">{rfq.subject}</p>
              </div>
              <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
                {(["email", "technical"] as const).map((section) => (
                  <button
                    key={section}
                    onClick={() => setActiveSection(section)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all capitalize ${
                      activeSection === section
                        ? "bg-white shadow-sm text-slate-800"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {section === "email" ? "Email Body" : "Technical Summary"}
                  </button>
                ))}
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50">
                <pre className="whitespace-pre-wrap text-xs text-slate-700 font-mono leading-relaxed p-4 max-h-80 overflow-y-auto">
                  {activeSection === "email" ? rfq.emailBody : rfq.technicalSummary}
                </pre>
              </div>
            </div>
          )}
        </div>

        {!loading && rfq && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 shrink-0">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 transition-colors shadow-sm"
            >
              {copied ? (
                <><CheckCircle className="h-4 w-4" />Copied!</>
              ) : (
                <><Copy className="h-4 w-4" />Copy to Clipboard</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
