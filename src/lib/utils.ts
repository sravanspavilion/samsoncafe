export function cn(...inputs: Array<string | false | null | undefined>) { return inputs.filter(Boolean).join(" "); }
export function formatINR(value: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value); }
export function isLowStock(stock: number) { return stock > 0 && stock <= 5; }
