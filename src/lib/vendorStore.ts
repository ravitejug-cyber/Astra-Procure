"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Vendor } from "./vendorTypes";

interface VendorStore {
  vendors: Vendor[];
  addVendor: (v: Vendor) => void;
  removeVendor: (id: string) => void;
  updateVendor: (id: string, updates: Partial<Vendor>) => void;
  clearVendors: () => void;
}

function deepClean<T>(val: T): T {
  if (typeof val === "string") return val.replace(/[•‣◦⁃∙–—]+/g, "").trimStart() as unknown as T;
  if (Array.isArray(val)) return val.map(deepClean) as unknown as T;
  if (val !== null && typeof val === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) out[k] = deepClean(v);
    return out as unknown as T;
  }
  return val;
}

export const useVendorStore = create<VendorStore>()(
  persist(
    (set) => ({
      vendors: [],
      addVendor: (v) =>
        set((state) => ({ vendors: [v, ...state.vendors] })),
      removeVendor: (id) =>
        set((state) => ({
          vendors: state.vendors.filter((v) => v.id !== id),
        })),
      updateVendor: (id, updates) =>
        set((state) => ({
          vendors: state.vendors.map((v) =>
            v.id === id ? { ...v, ...updates } : v
          ),
        })),
      clearVendors: () => set({ vendors: [] }),
    }),
    {
      name: "astra-procure-vendors",
      storage: createJSONStorage(() => localStorage),
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<VendorStore>;
        return {
          ...current,
          vendors: deepClean(Array.isArray(p?.vendors) ? p.vendors : []),
        };
      },
    }
  )
);
