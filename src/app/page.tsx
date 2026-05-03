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
        <section className="py-8 px-4">
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
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <AnnouncementBar />
        <Header />
        <main className="flex-1 pb-24 lg:pb-0">
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
