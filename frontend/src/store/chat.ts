import type { User } from "@/types/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type ContactStore = {
  contact: User | null;
  setContact: (contact: User) => void;
};

export const useContactStore = create<ContactStore>()(
  persist(
    (set) => ({
      contact: null,
      setContact: (contact: User) => set({ contact }),
    }),
    {
      name: "contact",
    }
  )
);
