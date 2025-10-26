import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./blocknote-custom.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/ui/theme-provider";
import LiveBlocksProvider from "@/components/ui/LiveBlocksProvider";
import ConditionalLayout from "@/components/ConditionalLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Notion Neel",
  description: "This is a Notion clone built with Next.js, Clerk, Firebase, and Liveblocks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
          <ThemeProvider
            defaultTheme="light"
            storageKey="notion-theme"
          >
            <LiveBlocksProvider>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
            </LiveBlocksProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
