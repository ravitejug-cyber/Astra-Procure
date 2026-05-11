"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ProjectEntry } from "./types";

interface ProjectStore {
  projects: ProjectEntry[];
  addProject: (entry: ProjectEntry) => void;
  removeProject: (id: string) => void;
  clearAll: () => void;
}

const BULLET_RE = /[•‣◦⁃∙]+/g;
const LEADING_WS_RE = /^\s+/;
function cleanStr(s: unknown): string {
  if (typeof s !== "string") return String(s ?? "");
  return s.replace(BULLET_RE, "").replace(LEADING_WS_RE, "").trim();
}
function deepClean<T>(val: T): T {
  if (typeof val === "string") return cleanStr(val) as unknown as T;
  if (Array.isArray(val)) return val.map(deepClean) as unknown as T;
  if (val !== null && typeof val === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) out[k] = deepClean(v);
    return out as unknown as T;
  }
  return val;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      projects: [],
      addProject: (entry) =>
        set((state) => ({ projects: [entry, ...state.projects] })),
      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),
      clearAll: () => set({ projects: [] }),
    }),
    {
      name: "astra-procure-projects",
      storage: createJSONStorage(() => localStorage),
      // Sanitize any bullet chars in persisted data on every rehydration
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<ProjectStore>;
        return {
          ...current,
          projects: deepClean(Array.isArray(p?.projects) ? p.projects : []),
        };
      },
    }
  )
);
