'use client'

import { useAppStore } from '@/lib/store'
import { Header } from '@/components/layout/Header'
import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { Footer } from '@/components/layout/Footer'
import { MobileBottomBar } from '@/components/layout/MobileBottomBar'
import { FloatingWhatsApp } from '@/components/shared/FloatingWhatsApp'
import { BackToTop } from '@/components/shared/BackToTop'
import { AgeGate } from '@/components/shared/AgeGate'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { AIChatWidget } from '@/components/shared/AIChatWidget'
import { SEOHead } from '@/components/shared/SEOHead'
import { HeroSection } from '@/components/home/HeroSection'
import { CategoryCards } from '@/components/home/CategoryCards'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { WhyChooseUs } from '@/components/home/WhyChooseUs'
import { HowToOrder } from '@/components/home/HowToOrder'
import { CustomerReviews } from '@/components/home/CustomerReviews'
import { FAQ } from '@/components/home/FAQ'
import { ProductCatalog } from '@/components/products/ProductCatalog'
import { ProductDetail } from '@/components/products/ProductDetail'
import { OrderForm } from '@/components/order/OrderForm'
import { AdminPanel } from '@/components/admin/AdminPanel'
import { PaymentPage } from '@/components/pages/PaymentPage'
import { TermsPage } from '@/components/pages/TermsPage'
import { PrivacyPage } from '@/components/pages/PrivacyPage'

// SEO data per page
const pageSEO: Record<string, { title: string; description: string; keywords: string[] }> = {
  home: {
    title: "Bangladesh's #1 Digital Subscription Store",
    description: "Buy Netflix, Spotify, YouTube Premium, ChatGPT Plus, Midjourney, VPN & 120+ premium subscriptions at best prices in Bangladesh. bKash/Nagad payment, 5-20 min delivery.",
    keywords: ['streaming subscription Bangladesh', 'Netflix BD', 'Spotify BD', 'ChatGPT Plus BD', 'VPN Bangladesh', 'digital subscription store', 'OTT subscription'],
  },
  products: {
    title: 'All Products — Browse 120+ Digital Subscriptions',
    description: 'Browse 120+ premium digital subscriptions: Netflix, Spotify, YouTube Premium, ChatGPT, Midjourney, VPN, educational & more at best prices in Bangladesh.',
    keywords: ['buy subscription online', 'digital subscription catalog', 'Netflix price Bangladesh', 'Spotify premium BD'],
  },
  category: {
    title: 'Shop by Category',
    description: 'Browse subscriptions by category — Streaming, AI Tools, VPN, Education, Design, Productivity, Cloud Storage, Gaming & more.',
    keywords: ['subscription categories', 'streaming subscription', 'AI tools subscription', 'VPN plans Bangladesh'],
  },
  product: {
    title: 'Product Details & Pricing',
    description: 'View product details, pricing plans, warranty info, and order now with bKash/Nagad. Fast 5-20 minute delivery.',
    keywords: ['subscription price', 'buy subscription', 'order subscription Bangladesh'],
  },
  order: {
    title: 'Place Your Order',
    description: 'Complete your order in 3 easy steps — fill details, pay via bKash/Nagad, get delivery in 5-20 minutes.',
    keywords: ['order subscription', 'buy online Bangladesh', 'bKash payment subscription'],
  },
  payment: {
    title: 'Payment & Contact Info',
    description: 'Payment info for Streaming Hub — bKash/Nagad number, WhatsApp contact, and delivery details. Fast 5-20 min delivery.',
    keywords: ['bKash number', 'Nagad payment', 'Streaming Hub contact', 'subscription payment BD'],
  },
  terms: {
    title: 'Terms & Conditions',
    description: 'Streaming Hub terms and conditions — read our policies on subscriptions, payments, warranties, and refunds.',
    keywords: ['terms and conditions', 'subscription policy', 'refund policy Bangladesh'],
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'Streaming Hub privacy policy — how we handle your data, payment info, and personal information.',
    keywords: ['privacy policy', 'data protection', 'privacy Bangladesh'],
  },
}

function HomePage() {
  return (
    <>
      <HeroSection />
      <CategoryCards />
      <FeaturedProducts />
      <WhyChooseUs />
      <HowToOrder />
      <CustomerReviews />
      <FAQ />
    </>
  )
}

function PageRouter() {
  const { currentPage } = useAppStore()

  switch (currentPage) {
    case 'home':
      return <HomePage />
    case 'products':
    case 'category':
      return <ProductCatalog />
    case 'product':
      return <ProductDetail />
    case 'order':
      return <OrderForm />
    case 'payment':
    case 'contact':
      return <PaymentPage />
    case 'reviews':
      return (
        <section className="py-8 px-4" aria-label="Customer Reviews">
          <div className="container mx-auto">
            <CustomerReviews />
          </div>
        </section>
      )
    case 'terms':
      return <TermsPage />
    case 'privacy':
      return <PrivacyPage />
    case 'admin':
      return <AdminPanel />
    default:
      return <HomePage />
  }
}

export default function Home() {
  const { currentPage } = useAppStore()
  const seo = pageSEO[currentPage] || pageSEO.home

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <SEOHead
          title={seo.title}
          description={seo.description}
          keywords={seo.keywords}
        />
        <AnnouncementBar />
        <Header />
        <main className="flex-1 pb-24 lg:pb-0" role="main">
          <PageRouter />
        </main>
        <Footer />
        <MobileBottomBar />
        <FloatingWhatsApp />
        <BackToTop />
        <AgeGate />
        <AIChatWidget />
      </div>
    </ErrorBoundary>
  )
}
