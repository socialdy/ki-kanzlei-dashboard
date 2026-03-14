import type { Metadata } from "next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "KI Kanzlei Dashboard",
    template: "%s | KI Kanzlei",
  },
  description:
    "Lead-Management, Outreach-Kampagnen und KI-Automatisierung für die KI Kanzlei. Leads finden, anreichern und kontaktieren — alles in einem Dashboard.",
  keywords: ["KI Kanzlei", "Lead Dashboard", "KI-Automatisierung", "B2B Outreach", "Lead Management"],
  authors: [{ name: "KI Kanzlei", url: "https://www.ki-kanzlei.at" }],
  openGraph: {
    title: "KI Kanzlei Dashboard",
    description: "Lead-Management, Outreach-Kampagnen und KI-Automatisierung — alles in einem Dashboard.",
    siteName: "KI Kanzlei",
    locale: "de_AT",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,300,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen">
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster position="bottom-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
