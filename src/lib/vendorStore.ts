"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Vendor } from "./vendorTypes";

interface VendorStore {
  vendors: Vendor[];
  addVendor: (v: Vendor) => void;
  removeVendor: (id: string) => void;
  updateVendor: (id: string, updates: Partial<Vendor>) => void;
  clearVendors: () => void;
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
    { name: "astra-procure-vendors" }
  )
);
