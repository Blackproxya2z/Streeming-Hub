'use client'

import { Card, CardContent } from '@/components/ui/card'
import { MessageCircle, CreditCard, Clock, Mail, CheckCircle, Headphones } from 'lucide-react'
import { motion } from 'framer-motion'

const steps = [
  {
    step: 1,
    icon: MessageCircle,
    title: 'পণ্য বাছাই করুন',
    titleEn: 'Choose Your Product',
    description: 'আমাদের ক্যাটালগ থেকে আপনার পছন্দের সাবস্ক্রিপশন বাছাই করুন।',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    step: 2,
    icon: CreditCard,
    title: 'Send Money করুন',
    titleEn: 'Send Money via bKash/Nagad',
    description: 'bKash বা Nagad দিয়ে Send Money করুন আমাদের নম্বরে। Payment নয়, Send Money!',
    color: 'from-amber-500 to-orange-600',
  },
  {
    step: 3,
    icon: Mail,
    title: 'WhatsApp-এ কনফার্ম করুন',
    titleEn: 'Confirm on WhatsApp',
    description: 'Send Money করার পর WhatsApp-এ মেসেজ পাঠান। Transaction ID-এর শেষ ৩ ডিজিট দিন।',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    step: 4,
    icon: Clock,
    title: 'ডেলিভারি নিন',
    titleEn: 'Get Delivery in 5-20 Min',
    description: 'পেমেন্ট কনফার্মেশনের ৫-২০ মিনিটের মধ্যে আপনার সাবস্ক্রিপশন ডেলিভারি হবে।',
    color: 'from-purple-500 to-violet-600',
  },
  {
    step: 5,
    icon: CheckCircle,
    title: 'একাউন্ট ব্যবহার করুন',
    titleEn: 'Login & Enjoy',
    description: 'আপনার সাবস্ক্রিপশন একাউন্টের ডিটেইলস WhatsApp-এ পাবেন। লগইন করে উপভোগ করুন!',
    color: 'from-green-500 to-emerald-600',
  },
  {
    step: 6,
    icon: Headphones,
    title: 'সাপোর্ট পান',
    titleEn: '24/7 Support',
    description: 'কোনো সমস্যা হলে WhatsApp-এ যোগাযোগ করুন। আমরা সবসময় সাহায্য করতে প্রস্তুত!',
    color: 'from-pink-500 to-rose-600',
  },
]

export function HowToOrder() {
  return (
    <section className="py-12 sm:py-16 px-4 bg-muted/30" id="how-to-order" aria-labelledby="how-heading">
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
                  {'titleEn' in item && <p className="text-xs text-muted-foreground/60 mb-1">{item.titleEn}</p>}
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
