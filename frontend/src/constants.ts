// export const dbUrl = "http://localhost:5000";
export const dbUrl = "https://zcr3h7z8-5000.inc1.devtunnels.ms";

export const roles = ["seller", "customer"] as const;

// Derive a type from the array
export type Role = typeof roles[number];