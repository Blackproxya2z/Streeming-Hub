'use client'

import { Card, CardContent } from '@/components/ui/card'
import { MessageCircle, CreditCard, Clock, Mail, CheckCircle, Headphones } from 'lucide-react'
import { motion } from 'framer-motion'

const steps = [
  {
    step: 1,
    icon: MessageCircle,
    title: 'Choose Your Product',
    description: 'Browse our catalog and select the subscription you want. You can also message us on WhatsApp.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    step: 2,
    icon: CreditCard,
    title: 'Make Payment',
    description: 'Send payment via bKash or Nagad to our payment number. Include your order details in the payment reference.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    step: 3,
    icon: Mail,
    title: 'Send Transaction Details',
    description: 'Share the last 3 digits of your transaction ID via WhatsApp along with your account email (if needed).',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    step: 4,
    icon: Clock,
    title: 'Wait for Delivery',
    description: 'Your subscription will be delivered within 5-20 minutes after payment confirmation.',
    color: 'from-purple-500 to-violet-600',
  },
  {
    step: 5,
    icon: CheckCircle,
    title: 'Receive Your Account',
    description: 'You will receive your subscription account details via WhatsApp. Login and enjoy!',
    color: 'from-green-500 to-emerald-600',
  },
  {
    step: 6,
    icon: Headphones,
    title: 'Get Support',
    description: 'If you face any issues, contact our WhatsApp support anytime. We are always here to help.',
    color: 'from-pink-500 to-rose-600',
  },
]

export function HowToOrder() {
  return (
    <section className="py-16 px-4 bg-muted/30" id="how-to-order" aria-labelledby="how-heading">
      <div className="container mx-auto">
        <div className="text-center mb-10">
          <h2 id="how-heading" className="text-2xl sm:text-3xl font-bold mb-3">How to Order</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Simple and easy ordering process — get your subscription in minutes
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 group border-0 shadow-sm relative">
                <CardContent className="p-6">
                  <div className="absolute top-4 right-4 text-6xl font-bold text-muted/10">
                    {item.step}
                  </div>
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                      Step {item.step}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
