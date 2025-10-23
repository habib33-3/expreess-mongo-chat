import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/types";

type UserStore = {
  user: User | null;
  setUser: (user: User | null) => void;
  resetUser: () => void;
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      resetUser: () => set({ user: null }),
    }),
    { name: "user-storage" }
  )
);
