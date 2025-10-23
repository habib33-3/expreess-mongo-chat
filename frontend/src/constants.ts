export const dbUrl = "http://localhost:5000";

export const roles = ["seller", "customer"] as const;

// Derive a type from the array
export type Role = typeof roles[number];