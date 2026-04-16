import type { Metadata } from "next";
import { cookies } from "next/headers";
import { IBM_Plex_Sans, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import { AppProviders } from "@/components/providers/app-providers";
import { DEMO_COOKIE_NAME, DEMO_COOKIE_VALUE } from "@/features/demo/shared";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialDemoMode =
    cookieStore.get(DEMO_COOKIE_NAME)?.value === DEMO_COOKIE_VALUE;

  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${interfaceFont.variable} ${codeFont.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppProviders initialDemoMode={initialDemoMode}>
          <div className="relative min-h-screen overflow-x-hidden">
            <SiteHeader />
            <main className="relative z-10 mx-auto flex min-h-[calc(100vh-4.75rem)] w-full max-w-[1320px] flex-col px-4 pb-14 pt-6 sm:px-6">
              {children}
            </main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
