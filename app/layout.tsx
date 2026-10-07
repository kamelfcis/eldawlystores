import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, IBM_Plex_Mono } from "next/font/google";
import { QueryProvider } from "@/components/providers/query-provider";
import { CartProvider } from "@/components/cart/cart-provider";
import { WishlistProvider } from "@/components/wishlist/wishlist-provider";
import { CompareProvider } from "@/components/compare/compare-provider";
import "./globals.css";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: { default: "Doly Stores", template: "%s | Doly Stores" },
  description: "متجر Doly Stores للإلكترونيات — هواتف، لابتوب، سماعات وإكسسوارات",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${ibmPlexArabic.variable} ${ibmPlexMono.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <QueryProvider>
          <CartProvider>
            <WishlistProvider>
              <CompareProvider>{children}</CompareProvider>
            </WishlistProvider>
          </CartProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
