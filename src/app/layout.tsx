import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: "C-CURE Physiotherapy & Rehab Clinic",
  description: "C-CURE Physiotherapy & Rehab Clinic - Patient Management System",
  keywords: ["Physiotherapy", "Rehab", "Clinic", "Patient Management", "Healthcare", "C-CURE"],
  authors: [{ name: "Sanatan Manna" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/mobile-logo.png",
    apple: "/mobile-logo.png",
  },
  openGraph: {
    title: "C-CURE Physiotherapy & Rehab Clinic",
    description: "Advanced Physiotherapy & Rehab Clinic Patient Management System",
    type: "website",
    locale: "en_IN",
    siteName: "C-CURE Physiotherapy",
  },
};

import { OpeningSplashScreen } from "@/components/opening-splash-screen";
import { OfflineIndicator } from "@/components/offline-indicator";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <OpeningSplashScreen />
          <OfflineIndicator />
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
