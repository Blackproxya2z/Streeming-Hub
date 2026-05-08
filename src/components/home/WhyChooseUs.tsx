'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Zap, DollarSign, Shield, Mail, MessageCircle, CreditCard } from 'lucide-react'
import { motion } from 'framer-motion'

const features = [
  {
    icon: Zap,
    title: 'Fast Delivery',
    description: 'Get your subscription delivered within 5-20 minutes after payment confirmation.',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    icon: DollarSign,
    title: 'Affordable Price',
    description: 'Best prices in Bangladesh market. We offer competitive rates on all subscriptions.',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Shield,
    title: 'Warranty Available',
    description: 'Full warranty on all subscriptions. Get replacement or refund if any issues occur.',
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    icon: Mail,
    title: 'Own Mail Option',
    description: 'Get your subscription with your own email address for full control and security.',
    gradient: 'from-purple-500 to-violet-600',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp Support',
    description: '24/7 customer support via WhatsApp. Quick response and instant assistance.',
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    icon: CreditCard,
    title: 'bKash/Nagad Payment',
    description: 'Easy payment through bKash and Nagad. Safe and convenient local payment methods.',
    gradient: 'from-pink-500 to-rose-600',
  },
]

export function WhyChooseUs() {
  return (
    <section className="py-12 sm:py-16 px-4" id="why-choose" aria-labelledby="why-heading">
      <div className="container mx-auto">
        <div className="text-center mb-10">
          <h2 id="why-heading" className="text-2xl sm:text-3xl font-bold mb-3">Why Choose Us</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            We provide the best digital subscription experience in Bangladesh
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 group border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
