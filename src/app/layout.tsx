import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ClarityInit } from "@/components/ClarityInit";
import { PostHogProvider } from "@/components/PostHogProvider";
import { Navigation } from "@/components/Navigation";
import { ToastProvider } from "@/components/ui/ToastProvider";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://speedback.fun'),
  title: "SpeedBack ⚡ — Feedback that feels like play",
  description: "Feedback forms that feel like games. Swipe, tap, and drag through questions — way faster than a boring form.",
  openGraph: {
    title: 'SpeedBack ⚡',
    description: 'Feedback forms that feel like games. Get 3x more responses.',
    url: 'https://speedback.fun',
    siteName: 'SpeedBack',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'SpeedBack ⚡',
    description: 'Feedback forms that feel like games. Get 3x more responses.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ colorScheme: 'light' }}>
      <body className={`${plusJakarta.variable} antialiased`}>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <ClarityInit />
        <PostHogProvider>
          <ToastProvider>
            <Navigation />
            <div id="main-content">
              {children}
            </div>
          </ToastProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
