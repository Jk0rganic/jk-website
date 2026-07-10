import { Cormorant_Garamond, Inter, Quintessential } from "next/font/google";

const quintessential = Quintessential({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-quintessential",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
});

/**
 * Reusable function to get all Google fonts
 */
export function reusableFonts() {
  return { inter, quintessential, cormorant };
}
