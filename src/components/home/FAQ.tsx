'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { motion } from 'framer-motion'

const faqs = [
  {
    question: 'How do I order a subscription?',
    answer: 'You can order through our website by clicking "Order Now" on any product, or directly message us on WhatsApp. Select your product, make payment via bKash/Nagad, and receive your account within 5-20 minutes.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept bKash and Nagad payments. Simply send the payment to our payment number and share the last 3 digits of the transaction ID via WhatsApp.',
  },
  {
    question: 'How long does delivery take?',
    answer: 'Most subscriptions are delivered within 5-20 minutes after payment confirmation. Some products may take up to 1-2 hours depending on availability.',
  },
  {
    question: 'Do you offer warranty on subscriptions?',
    answer: 'Yes! We offer warranty on all subscriptions. If you face any issues during the warranty period, we will replace or fix your account for free.',
  },
  {
    question: 'Can I use my own email address?',
    answer: 'Yes, we offer "Own Mail" option for many subscriptions. You can use your personal email address for the account, giving you full control and security.',
  },
  {
    question: 'What if my subscription stops working?',
    answer: 'If your subscription stops working during the warranty period, contact us on WhatsApp immediately. We will fix or replace the account at no extra cost.',
  },
  {
    question: 'Are the accounts shared or personal?',
    answer: 'We offer different account types: Personal (your own private account), Shared (multiple users), Own Mail (on your email), Gift Card, and TopUp options. The type is mentioned in each product listing.',
  },
]

// JSON-LD FAQ Schema for Google rich results
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

export function FAQ() {
  return (
    <section className="py-12 sm:py-16 px-4 bg-muted/30" id="faq" aria-labelledby="faq-heading">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <h2 id="faq-heading" className="text-2xl sm:text-3xl font-bold mb-3">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">
            Got questions? We&apos;ve got answers
          </p>
        </div>

        {/* FAQ Schema for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema),
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="bg-background rounded-xl border px-6 shadow-sm"
              >
                <AccordionTrigger className="text-left font-semibold text-sm hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
