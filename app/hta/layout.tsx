import type { Metadata } from "next";
import type { ReactNode } from "react";

const title = "Home Team Academy | Sports Development Boxes for Families";
const description =
  "Home Team Academy is building monthly sports development boxes with proven activities so kids build skills while busy families create quality time together.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.hometeamacademy.com"),
  applicationName: "Home Team Academy",
  title: {
    absolute: title,
  },
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: "https://www.hometeamacademy.com/",
    images: [
      {
        url: "/worldcup/hta-logo-preview.png",
        width: 1200,
        height: 1200,
        alt: "Home Team Academy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/worldcup/hta-logo-preview.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Home Team Academy",
  },
  other: {
    "apple-mobile-web-app-title": "Home Team Academy",
  },
};

export default function HTALayout({ children }: { children: ReactNode }) {
  return children;
}
