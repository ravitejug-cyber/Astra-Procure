"use client";

import React from "react";
import {
  AlertTriangle,
  CheckCircle,
  MapPin,
  Award,
  Clock,
  Phone,
  Globe,
  Star,
  FileText,
} from "lucide-react";
import type { VendorMatch, Vendor } from "@/lib/vendorTypes";

interface Props {
  match: VendorMatch;
  onGenerateRFQ: (vendor: Vendor) => void;
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 75
      ? "bg-emerald-500"
      : score >= 50
      ? "bg-amber-400"
      : "bg-red-400";
  const textColor =
    score >= 75
      ? "text-emerald-700"
      : score >= 50
      ? "text-amber-700"
      : "text-red-600";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-sm font-bold w-8 text-right ${textColor}`}>
        {score}
      </span>
    </div>
  );
}

function RecommendationBadge({
  recommendation,
}: {
  recommendation: VendorMatch["recommendation"];
}) {
  if (recommendation === "top") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
        <Star className="h-3 w-3" />
        Top Supplier
      </span>
    );
  }
  if (recommendation === "backup") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
        Backup
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">
      Not Recommended
    </span>
  );
}

export function VendorCard({ match, onGenerateRFQ }: Props) {
  const { vendor, suitabilityScore, matchReasons, riskFlags, recommendation } =
    match;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <h3 className="font-semibold text-slate-900 text-base leading-tight">
            {vendor.name}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
              <MapPin className="h-3 w-3" />
              {vendor.city}, {vendor.state}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                vendor.source === "imported"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-sky-100 text-sky-700"
              }`}
            >
              {vendor.source === "imported" ? "Imported" : "AI Discovered"}
            </span>
            <RecommendationBadge recommendation={recommendation} />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Suitability Score</span>
          <span className="text-slate-400">
            Technical {match.technicalScore} · Quality {match.qualityScore} ·
            Commercial {match.commercialScore}
          </span>
        </div>
        <ScoreBar score={suitabilityScore} />
      </div>

      {vendor.processCapabilities.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Capabilities
          </p>
          <div className="flex flex-wrap gap-1.5">
            {vendor.processCapabilities.map((cap) => (
              <span
                key={cap}
                className="rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-xs text-blue-700 font-medium"
              >
                {cap}
              </span>
            ))}
          </div>
        </div>
      )}

      {vendor.certifications.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Certifications
          </p>
          <div className="flex flex-wrap gap-1.5">
            {vendor.certifications.map((cert) => (
              <span
                key={cert}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-xs text-emerald-700 font-medium"
              >
                <Award className="h-3 w-3" />
                {cert}
              </span>
            ))}
          </div>
        </div>
      )}

      {matchReasons.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Why This Vendor
          </p>
          <ul className="space-y-1">
            {matchReasons.map((reason, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-slate-700"
              >
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {riskFlags.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Risk Flags
          </p>
          <ul className="space-y-1">
            {riskFlags.map((flag, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-amber-700"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 flex-wrap">
        <div className="flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {vendor.leadTimeDays}d lead
          </span>
          {vendor.contact && (
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {vendor.contact}
            </span>
          )}
          {vendor.website && (
            <a
              href={
                vendor.website.startsWith("http")
                  ? vendor.website
                  : `https://${vendor.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              Website
            </a>
          )}
        </div>
        <button
          onClick={() => onGenerateRFQ(vendor)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 transition-colors shadow-sm"
        >
          <FileText className="h-3.5 w-3.5" />
          Generate RFQ
        </button>
      </div>
    </div>
  );
}
