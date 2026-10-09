export function cn(...inputs: Array<string | false | null | undefined | Record<string, boolean>>) {
  return inputs
    .filter((input): input is string | Record<string, boolean> => Boolean(input))
    .map((input) => {
      if (typeof input === "object") {
        return Object.entries(input)
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join(" ");
      }
      return input;
    })
    .join(" ");
}
export function formatINR(value: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value); }
export function isLowStock(stock: number) { return stock > 0 && stock <= 5; }
