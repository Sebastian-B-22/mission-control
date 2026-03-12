import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import ClientErrorTrap from "@/components/ClientErrorTrap";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  applicationName: "Mission Control",
  title: {
    default: "Mission Control",
    template: "%s | Mission Control",
  },
  description: "Your daily accountability and RPM planning system",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    // "black-translucent" tends to look best in iOS standalone and avoids odd
    // top chrome/title rendering on some devices.
    statusBarStyle: "black-translucent",
    title: "Mission Control",
  },
  other: {
    // Redundancy for iOS/Android install/standalone behavior.
    "apple-mobile-web-app-title": "Mission Control",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "mobile-web-app-capable": "yes",
  },
  icons: {
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black`}>
        <ClientErrorTrap />
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}

