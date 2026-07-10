import { GoogleTagManager } from "@next/third-parties/google";
import { Cormorant_Garamond, Inter, Quintessential } from "next/font/google";
import type { ReactNode } from "react";
import { Providers } from "@/provider/provider";
import AppChrome from "./app-chrome";

// Fonts
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

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${quintessential.variable} ${cormorant.variable}`}
    >
      <body>
        <Providers>
          <AppChrome>{children}</AppChrome>
        </Providers>
        <GoogleTagManager
          gtmId={`${process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER}`}
        />
      </body>
    </html>
  );
}
