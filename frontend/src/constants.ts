export const dbUrl = import.meta.env.VITE_DB_URL || "http://localhost:5001";

export const roles = ["seller", "customer"] as const;

// Derive a type from the array
export type Role = typeof roles[number];