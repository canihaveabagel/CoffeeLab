import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "../client/src/index.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://coffeelab-recruiting.ryleelin.chatgpt.site"),
  title: "CoffeeLab",
  description: "AI relationship memory for recruiting",
  robots: { index: false, follow: false },
  openGraph: {
    title: "CoffeeLab",
    description: "AI relationship memory for recruiting",
    url: "https://coffeelab-recruiting.ryleelin.chatgpt.site",
    siteName: "CoffeeLab",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CoffeeLab",
    description: "AI relationship memory for recruiting",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300..700;1,14..32,300..700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
