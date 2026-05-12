"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { PCBProjectEntry } from "./pcbTypes";

interface PCBStore {
  projects: PCBProjectEntry[];
  addProject: (entry: PCBProjectEntry) => void;
  removeProject: (id: string) => void;
  clearAll: () => void;
}

export const usePCBStore = create<PCBStore>()(
  persist(
    (set) => ({
      projects: [],
      addProject: (entry) =>
        set((state) => ({ projects: [entry, ...state.projects] })),
      removeProject: (id) =>
        set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),
      clearAll: () => set({ projects: [] }),
    }),
    {
      name: "astra-procure-pcb-v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
