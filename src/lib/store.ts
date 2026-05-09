"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProjectEntry } from "./types";

interface ProjectStore {
  projects: ProjectEntry[];
  addProject: (entry: ProjectEntry) => void;
  removeProject: (id: string) => void;
  clearAll: () => void;
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
    { name: "astra-procure-projects" }
  )
);
