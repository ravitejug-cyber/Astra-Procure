"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Plus, Trash2, Building2, X } from "lucide-react";
import { useVendorStore } from "@/lib/vendorStore";
import type { Vendor, ProcessCapability } from "@/lib/vendorTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): Vendor[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const vendors: Vendor[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 2) continue;
    const [
      name = "",
      processCapabilitiesRaw = "",
      machinesRaw = "",
      materialExpertiseRaw = "",
      city = "",
      state = "",
      moqRaw = "1",
      certificationsRaw = "",
      leadTimeDaysRaw = "30",
      contact = "",
      website = "",
      industriesRaw = "",
      notes = "",
    ] = cols;

    const processCapabilities = processCapabilitiesRaw
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean) as ProcessCapability[];

    vendors.push({
      id: crypto.randomUUID(),
      name: name.trim(),
      processCapabilities,
      machines: machinesRaw.split(";").map((s) => s.trim()).filter(Boolean),
      materialExpertise: materialExpertiseRaw.split(";").map((s) => s.trim()).filter(Boolean),
      city: city.trim(),
      state: state.trim(),
      moq: parseInt(moqRaw) || 1,
      certifications: certificationsRaw.split(";").map((s) => s.trim()).filter(Boolean),
      leadTimeDays: parseInt(leadTimeDaysRaw) || 30,
      contact: contact.trim(),
      website: website.trim(),
      notes: notes.trim(),
      source: "imported",
      industries: industriesRaw.split(";").map((s) => s.trim()).filter(Boolean),
      monthlyCapacity: "",
    });
  }
  return vendors;
}

const EMPTY_FORM: Omit<Vendor, "id" | "source"> = {
  name: "",
  processCapabilities: [],
  machines: [],
  materialExpertise: [],
  city: "",
  state: "",
  moq: 100,
  certifications: [],
  leadTimeDays: 30,
  contact: "",
  website: "",
  notes: "",
  industries: [],
  monthlyCapacity: "",
};

export function VendorImporter() {
  const { vendors, addVendor, removeVendor } = useVendorStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Vendor, "id" | "source">>({ ...EMPTY_FORM });
  const [formStrings, setFormStrings] = useState({
    processCapabilities: "",
    machines: "",
    materialExpertise: "",
    certifications: "",
    industries: "",
  });
  const [csvError, setCsvError] = useState<string | null>(null);
  const [importCount, setImportCount] = useState<number | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setCsvError(null);
      setImportCount(null);
      const file = acceptedFiles[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
          const parsed = parseCSV(text);
          if (parsed.length === 0) {
            setCsvError("No valid vendor rows found. Check your CSV format.");
            return;
          }
          parsed.forEach((v) => addVendor(v));
          setImportCount(parsed.length);
        } catch {
          setCsvError("Failed to parse CSV. Ensure it matches the expected format.");
        }
      };
      reader.readAsText(file);
    },
    [addVendor]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "text/plain": [".txt"] },
    multiple: false,
  });

  const handleFormChange = (field: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitManual = () => {
    if (!form.name.trim() || !form.city.trim()) return;
    const vendor: Vendor = {
      ...form,
      id: crypto.randomUUID(),
      source: "manual",
      processCapabilities: formStrings.processCapabilities
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean) as ProcessCapability[],
      machines: formStrings.machines.split(",").map((s) => s.trim()).filter(Boolean),
      materialExpertise: formStrings.materialExpertise.split(",").map((s) => s.trim()).filter(Boolean),
      certifications: formStrings.certifications.split(",").map((s) => s.trim()).filter(Boolean),
      industries: formStrings.industries.split(",").map((s) => s.trim()).filter(Boolean),
    };
    addVendor(vendor);
    setForm({ ...EMPTY_FORM });
    setFormStrings({ processCapabilities: "", machines: "", materialExpertise: "", certifications: "", industries: "" });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-slate-700">
            <Upload className="h-4 w-4 text-blue-600" />
            Import from CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div
            {...getRootProps()}
            className={`rounded-xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-400 bg-blue-50"
                : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">
              {isDragActive ? "Drop the CSV file here…" : "Drag & drop a CSV file, or click to select"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Columns: Name, Process Capabilities, Machines, Material Expertise, City, State, MOQ, Certifications, Lead Time Days, Contact, Website, Industries, Notes
            </p>
            <p className="text-xs text-slate-400">
              Use semicolons (;) to separate multiple values within a field.
            </p>
          </div>
          {csvError && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{csvError}</p>
          )}
          {importCount !== null && (
            <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
              Successfully imported {importCount} vendor{importCount !== 1 ? "s" : ""}.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-700">
              <Plus className="h-4 w-4 text-blue-600" />
              Add Vendor Manually
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showForm ? "Cancel" : "Add Vendor"}
            </Button>
          </div>
        </CardHeader>
        {showForm && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Company Name *"
                value={form.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
                placeholder="e.g. Precision Tech Engineering Pvt Ltd"
              />
              <Input
                label="City *"
                value={form.city}
                onChange={(e) => handleFormChange("city", e.target.value)}
                placeholder="e.g. Pune"
              />
              <Input
                label="State"
                value={form.state}
                onChange={(e) => handleFormChange("state", e.target.value)}
                placeholder="e.g. Maharashtra"
              />
              <Input
                label="MOQ (units)"
                type="number"
                value={form.moq}
                onChange={(e) => handleFormChange("moq", parseInt(e.target.value) || 1)}
              />
              <Input
                label="Lead Time (days)"
                type="number"
                value={form.leadTimeDays}
                onChange={(e) => handleFormChange("leadTimeDays", parseInt(e.target.value) || 30)}
              />
              <Input
                label="Monthly Capacity"
                value={form.monthlyCapacity}
                onChange={(e) => handleFormChange("monthlyCapacity", e.target.value)}
                placeholder="e.g. 10,000 components/month"
              />
              <Input
                label="Contact"
                value={form.contact}
                onChange={(e) => handleFormChange("contact", e.target.value)}
                placeholder="+91-20-12345678"
              />
              <Input
                label="Website"
                value={form.website}
                onChange={(e) => handleFormChange("website", e.target.value)}
                placeholder="www.example.com"
              />
            </div>
            <Input
              label="Process Capabilities (comma-separated)"
              value={formStrings.processCapabilities}
              onChange={(e) => setFormStrings((p) => ({ ...p, processCapabilities: e.target.value }))}
              placeholder="CNC Machining, VMC, Anodizing"
            />
            <Input
              label="Machines (comma-separated)"
              value={formStrings.machines}
              onChange={(e) => setFormStrings((p) => ({ ...p, machines: e.target.value }))}
              placeholder="Fanuc Robodrill, DMG Mori NLX 2500"
            />
            <Input
              label="Material Expertise (comma-separated)"
              value={formStrings.materialExpertise}
              onChange={(e) => setFormStrings((p) => ({ ...p, materialExpertise: e.target.value }))}
              placeholder="Aluminium 6061, ADC12, EN-AC 46000"
            />
            <Input
              label="Certifications (comma-separated)"
              value={formStrings.certifications}
              onChange={(e) => setFormStrings((p) => ({ ...p, certifications: e.target.value }))}
              placeholder="ISO 9001:2015, IATF 16949:2016"
            />
            <Input
              label="Industries Served (comma-separated)"
              value={formStrings.industries}
              onChange={(e) => setFormStrings((p) => ({ ...p, industries: e.target.value }))}
              placeholder="Automotive, Aerospace, Electronics"
            />
            <Input
              label="Notes"
              value={form.notes}
              onChange={(e) => handleFormChange("notes", e.target.value)}
              placeholder="Any additional notes about this vendor"
            />
            <div className="flex justify-end">
              <Button onClick={handleSubmitManual} disabled={!form.name.trim() || !form.city.trim()}>
                <Plus className="h-4 w-4" />
                Add Vendor
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-slate-700">
            <Building2 className="h-4 w-4 text-blue-600" />
            My Vendor Database ({vendors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-10 w-10 text-slate-200 mb-3" />
              <p className="text-sm text-slate-500 font-medium">No vendors yet</p>
              <p className="text-xs text-slate-400 mt-1">Import a CSV or add vendors manually above</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden sm:table-cell">Capabilities</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{vendor.name}</p>
                        {vendor.certifications.length > 0 && (
                          <p className="text-xs text-slate-400 mt-0.5">{vendor.certifications.slice(0, 2).join(", ")}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {vendor.city}{vendor.state ? `, ${vendor.state}` : ""}
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {vendor.processCapabilities.slice(0, 3).map((cap, i) => (
                            <span key={i} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                              {cap}
                            </span>
                          ))}
                          {vendor.processCapabilities.length > 3 && (
                            <span className="text-xs text-slate-400">+{vendor.processCapabilities.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          vendor.source === "imported"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {vendor.source}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeVendor(vendor.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          title="Remove vendor"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
