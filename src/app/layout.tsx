import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
export const metadata: Metadata = { title: "SAMSONS CAFE | Cafe & Roastery", description: "A private reserve for extraordinary coffee and crafted café fare." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className={`${outfit.variable} ${playfair.variable}`}><CartProvider>{children}</CartProvider></body></html>; }
