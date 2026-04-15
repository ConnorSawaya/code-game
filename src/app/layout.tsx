import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const interfaceFont = IBM_Plex_Sans({
  variable: "--font-interface",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const codeFont = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Relay",
    template: "%s | Relay",
  },
  description:
    "Relay is the code-chain party game where prompts mutate through alternating code and description rounds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${interfaceFont.variable} ${codeFont.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppProviders />
        <div className="relative min-h-screen overflow-x-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-90 [background-image:radial-gradient(circle_at_top,rgba(255,255,255,0.64),transparent_32%),radial-gradient(circle_at_8%_20%,rgba(239,109,75,0.14),transparent_22%),radial-gradient(circle_at_82%_24%,rgba(53,90,216,0.16),transparent_24%),radial-gradient(circle_at_76%_76%,rgba(46,159,151,0.1),transparent_24%),linear-gradient(180deg,transparent,rgba(255,255,255,0.16))]" />
          <SiteHeader />
          <main className="relative z-10 mx-auto flex min-h-[calc(100vh-5.5rem)] w-full max-w-[1320px] flex-col px-4 pb-14 pt-5 sm:px-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
