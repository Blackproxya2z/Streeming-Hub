import type { Metadata, Viewport } from "next";
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

const SITE_URL = "https://streaminghub.com.bd";
const SITE_NAME = "Streaming Hub";
const SITE_DESCRIPTION = "Bangladesh's #1 digital subscription store. Buy Netflix, Spotify, YouTube Premium, ChatGPT Plus, Midjourney, VPN & 120+ premium subscriptions at the best prices. bKash/Nagad payment, 5-20 min delivery, full warranty.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Streaming Hub — Bangladesh's #1 Digital Subscription Store | Netflix, Spotify, ChatGPT, VPN & More",
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    // Primary keywords
    "Streaming Hub", "Bangladesh subscription", "digital subscription Bangladesh",
    // Streaming
    "Netflix Bangladesh", "Spotify Bangladesh", "YouTube Premium Bangladesh",
    "Amazon Prime Bangladesh", "Disney+ Bangladesh", "Hotstar Bangladesh",
    "Crunchyroll Bangladesh", "Hoichoi premium", "Chorki subscription",
    // AI Tools
    "ChatGPT Plus Bangladesh", "Midjourney Bangladesh", "Cursor AI Bangladesh",
    "Canva Pro Bangladesh", "Perplexity Pro", "Leonardo AI",
    // VPN
    "VPN Bangladesh", "NordVPN Bangladesh", "ExpressVPN Bangladesh",
    "Surfshark Bangladesh",
    // Education
    "Coursera Bangladesh", "Skillshare Bangladesh", "Duolingo Super",
    // Productivity
    "Microsoft Office 365 Bangladesh", "Grammarly Premium",
    // Gaming
    "Free Fire top up Bangladesh", "PUBG UC Bangladesh",
    // Payment
    "bKash subscription", "Nagad payment", "online subscription BD",
    // General
    "buy subscription online", "premium account Bangladesh",
    "OTT subscription Bangladesh", "digital service BD",
    "subscription lagbe", "সাবস্ক্রিপশন",
    "নেটফ্লিক্স বাংলাদেশ", "স্পটিফাই",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    telephone: true,
    email: false,
    address: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en-BD": SITE_URL,
      "bn-BD": SITE_URL,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_BD",
    alternateLocale: ["bn_BD"],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Streaming Hub — Bangladesh's #1 Digital Subscription Store",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Streaming Hub — Premium Digital Subscriptions in Bangladesh",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Streaming Hub — Bangladesh's #1 Digital Subscription Store",
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
    creator: "@streaminghub_bd",
    site: "@streaminghub_bd",
  },
  verification: {
    google: "google-site-verification-code",
  },
  category: "E-Commerce",
  classification: "Digital Subscription Store",
  other: {
    "fb:app_id": "streaminghub-bd",
    "fb:pages": "streaminghub.bd",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": SITE_NAME,
    "mobile-web-app-capable": "yes",
    "theme-color": "#10b981",
    "geo.region": "BD",
    "geo.placename": "Dhaka, Bangladesh",
    "language": "en-BD",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // JSON-LD Structured Data — Organization
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: SITE_DESCRIPTION,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dhaka",
      addressRegion: "Dhaka",
      addressCountry: "BD",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+8801647236359",
      contactType: "customer service",
      availableLanguage: ["English", "Bengali"],
      areaServed: "BD",
    },
    sameAs: [
      "https://facebook.com/streaminghub.bd",
      "https://instagram.com/streaminghub.bd",
    ],
    priceRange: "৳50 - ৳5000",
    currenciesAccepted: "BDT",
    paymentAccepted: "bKash, Nagad",
  };

  // JSON-LD Structured Data — WebSite with SearchAction
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  // JSON-LD Structured Data — LocalBusiness / Store
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    telephone: "+8801647236359",
    image: `${SITE_URL}/og-image.png`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dhaka",
      addressRegion: "Dhaka",
      addressCountry: "BD",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday", "Tuesday", "Wednesday", "Thursday",
        "Friday", "Saturday", "Sunday"
      ],
      opens: "00:00",
      closes: "23:59",
    },
    paymentAccepted: "bKash, Nagad",
    currenciesAccepted: "BDT",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "150",
      bestRating: "5",
      worstRating: "1",
    },
  };

  // JSON-LD Structured Data — Product (generic, for homepage)
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Premium Digital Subscriptions",
    description: SITE_DESCRIPTION,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "BDT",
      lowPrice: "50",
      highPrice: "5000",
      offerCount: "129",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "150",
      bestRating: "5",
      worstRating: "1",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productSchema),
          }}
        />

        {/* Facebook Domain Verification */}
        <meta name="facebook-domain-verification" content="streaminghub-bd-verify" />

        {/* Additional Facebook / Meta tags */}
        <meta property="fb:app_id" content="streaminghub-bd" />
        <meta property="article:publisher" content="https://facebook.com/streaminghub.bd" />

        {/* PWA support */}
        <meta name="application-name" content="Streaming Hub" />
        <meta name="apple-mobile-web-app-title" content="Streaming Hub" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* Geo targeting for Bangladesh */}
        <meta name="geo.region" content="BD" />
        <meta name="geo.placename" content="Dhaka, Bangladesh" />
        <meta name="language" content="en-BD" />
      </head>
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
