import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Subscription Lagbe – Premium Digital Subscriptions",
  description: "Your go-to solution for hassle-free OTT subscriptions. Movies, web series, AI tools, educational platforms, VPNs, gaming top-ups and more at affordable prices.",
  keywords: ["Subscription", "OTT", "Netflix", "AI Tools", "VPN", "Bangladesh", "Digital Services"],
  authors: [{ name: "Subscription Lagbe" }],
  openGraph: {
    title: "Subscription Lagbe – Premium Digital Subscriptions",
    description: "Premium subscriptions at best price. OTT, AI tools, education, VPN and more.",
    siteName: "Subscription Lagbe",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
