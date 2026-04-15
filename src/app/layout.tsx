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
          <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_top,rgba(255,255,255,0.65),transparent_32%),radial-gradient(circle_at_10%_20%,rgba(232,111,91,0.12),transparent_24%),radial-gradient(circle_at_80%_30%,rgba(70,102,201,0.12),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(122,165,141,0.08),transparent_35%)]" />
          <SiteHeader />
          <main className="relative z-10 mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-7xl flex-col px-4 pb-16 pt-6 sm:px-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
