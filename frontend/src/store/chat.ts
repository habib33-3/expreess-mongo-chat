import type { User } from "@/types/types";
import { create } from "zustand";

type ContactStore = {
  contact: User | null;
  setContact: (contact: User) => void;
};

export const useContactStore = create<ContactStore>()((set) => ({
  contact: null,
  setContact: (contact: User) => set({ contact }),
}));
