'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  ExternalLink,
  RotateCcw,
  BadgeCheck,
  Shield,
  Zap,
  Headphones,
  ShoppingCart,
  Search,
  CreditCard,
  HelpCircle,
  Tag,
  Package,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const AVATAR_SRC = '/images/assistant-avatar.png'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  whatsappUrl?: string
  timestamp: number
}

interface ChatResponse {
  response: string
  whatsappUrl?: string
  error?: string
}

const capabilities = [
  { icon: Search, label: 'প্রোডাক্ট খুঁজুন', desc: 'Find products' },
  { icon: Tag, label: 'ফিচার্ড', desc: 'Featured products' },
  { icon: CreditCard, label: 'প্রাইস জানুন', desc: 'Get prices' },
  { icon: ShoppingCart, label: 'অর্ডার করুন', desc: 'Place order' },
  { icon: HelpCircle, label: 'সাহায্য নিন', desc: 'Get help' },
]

// Rotating messages for the typewriter bubble
const typewriterMessages = [
  '👋 আমি কর্মচারী — বলুন কী লাগবে!',
  '🎬 Netflix কত টাকা জানতে চান?',
  '⭐ সেরা ডিল দেখুন — featured products!',
  '💎 BD তে সেরা দাম গ্যারান্টি!',
  '🛒 অর্ডার করতে চান? আমি গাইড করবো!',
  '🔒 VPN প্ল্যান শুরু ৳১৪৯ থেকে',
  '⚡ মাত্র 5-20 মিনিটে ডেলিভারি!',
  '💳 bKash/Nagad পেমেন্ট সহজ!',
]

const KORMOCHARY_GREETING = `আসসালামু আলাইকুম! 🎉 Streaming Hub-এ স্বাগতম!

আমি কর্মচারী, আপনার personal shopping assistant। বাংলাদেশে সেরা দামে প্রিমিয়াম সাবস্ক্রিপশন পেতে আমি সাহায্য করবো! 💯

🎬 Netflix, Spotify, ChatGPT Plus
🔒 VPN, AI Tools, আরও অনেক কিছু!

কী লাগবে বলুন — সেরা ডিল খুঁজে দেবো! 😊`

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: KORMOCHARY_GREETING,
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [cooldown, setCooldown] = useState(false)
  const [currentMsgIndex, setCurrentMsgIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastSentRef = useRef<number>(0)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Typewriter effect for the floating bubble
  useEffect(() => {
    if (isOpen) return

    const currentMessage = typewriterMessages[currentMsgIndex]
    let charIndex = 0

    // Defer initial state setting to avoid synchronous setState in effect
    const initTimer = setTimeout(() => {
      setDisplayedText('')
      setIsTyping(true)
    }, 0)

    const typeChar = () => {
      if (charIndex < currentMessage.length) {
        setDisplayedText(currentMessage.slice(0, charIndex + 1))
        charIndex++
        typingTimerRef.current = setTimeout(typeChar, 45 + Math.random() * 35)
      } else {
        setIsTyping(false)
        typingTimerRef.current = setTimeout(() => {
          setCurrentMsgIndex(prev => (prev + 1) % typewriterMessages.length)
        }, 2500)
      }
    }

    typingTimerRef.current = setTimeout(typeChar, 200)

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      clearTimeout(initTimer)
    }
  }, [currentMsgIndex, isOpen])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
      })
    }
  }, [messages, isLoading])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const sendMessage = useCallback(async (overrideMessage?: string) => {
    const trimmed = (overrideMessage || input).trim()
    if (!trimmed || isLoading || cooldown) return

    // Rate limit: minimum 1.5s between messages
    const now = Date.now()
    const elapsed = now - lastSentRef.current
    if (elapsed < 1500) {
      setCooldown(true)
      setTimeout(() => setCooldown(false), 1500 - elapsed)
      return
    }
    lastSentRef.current = now

    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, userMessage])
    if (!overrideMessage) setInput('')
    setIsLoading(true)

    try {
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          sessionId: 'web-session',
          history,
        }),
      })

      // Handle rate limiting
      if (res.status === 429) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content:
            '⏳ একটু ব্যস্ত আছি, কিছুক্ষণ পর আবার চেষ্টা করুন। অথবা সরাসরি WhatsApp এ যোগাযোগ করুন: +8801647236359 💬',
          whatsappUrl:
            'https://wa.me/8801647236359?text=' +
            encodeURIComponent('Hi, Streaming Hub এ সাহায্য দরকার'),
          timestamp: Date.now(),
        }
        setMessages(prev => [...prev, assistantMessage])
        setIsLoading(false)
        return
      }

      if (!res.ok) throw new Error('Failed to get response')

      const data: ChatResponse = await res.json()

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response || 'দুঃখিত, বুঝতে পারিনি। আবার লিখে চেষ্টা করুন।',
        whatsappUrl: data.whatsappUrl,
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content:
          '❌ সংযোগে সমস্যা হচ্ছে। আবার চেষ্টা করুন অথবা WhatsApp এ যোগাযোগ করুন: +8801647236359',
        whatsappUrl:
          'https://wa.me/8801647236359?text=' +
          encodeURIComponent('Hi, Streaming Hub এ সাহায্য দরকার'),
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, cooldown, messages])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: KORMOCHARY_GREETING,
        timestamp: Date.now(),
      },
    ])
  }

  // Quick action buttons — matches the spec's greeting options
  const quickActions = [
    { label: '⭐ Best Sellers', action: 'ফিচার্ড প্রোডাক্ট দেখাও' },
    { label: '🎬 Netflix দাম', action: 'Netflix কত টাকা?' },
    { label: '🤖 ChatGPT Plus', action: 'ChatGPT Plus কত টাকা?' },
    { label: '🔒 VPN প্ল্যান', action: 'VPN প্ল্যান কত টাকা?' },
    { label: '📦 অর্ডার করুন', action: 'কীভাবে অর্ডার করবো?' },
    { label: '❓ সাহায্য', action: 'আমাকে সাহায্য দরকার' },
  ]

  return (
    <>
      {/* ===== Floating AI Button with Typewriter Bubble ===== */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            className="fixed z-[55] flex items-center gap-2 sm:gap-3
              bottom-[96px] right-3
              lg:bottom-[88px] lg:right-6"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {/* Typewriter Message Bubble — visible on sm+ screens */}
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="hidden sm:flex items-center gap-2 bg-background border border-border/60 shadow-lg rounded-xl px-4 py-2.5 max-w-[240px] cursor-pointer hover:shadow-xl hover:border-emerald-300/50 transition-all group/bubble"
              onClick={() => setIsOpen(true)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-snug">
                  {displayedText}
                  {isTyping && (
                    <span className="inline-block w-[2px] h-4 bg-emerald-500 ml-0.5 align-middle animate-pulse" />
                  )}
                </p>
              </div>
              {/* Live typing indicator dots */}
              {isTyping && (
                <div className="flex items-center gap-[3px] shrink-0">
                  <span className="h-1 w-1 rounded-full bg-emerald-500 animate-bounce [animation-delay:0ms]" />
                  <span className="h-1 w-1 rounded-full bg-emerald-500 animate-bounce [animation-delay:150ms]" />
                  <span className="h-1 w-1 rounded-full bg-emerald-500 animate-bounce [animation-delay:300ms]" />
                </div>
              )}
              {/* Speech bubble arrow pointing right toward the button */}
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0 
                border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-l-[9px] border-l-border/60" />
              <div className="absolute -right-[5px] top-1/2 -translate-y-1/2 w-0 h-0 
                border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[7px] border-l-background" />
            </motion.div>

            {/* The Main AI Button */}
            <motion.button
              onClick={() => setIsOpen(true)}
              className="relative flex items-center justify-center
                w-16 h-16 rounded-full p-1
                sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 sm:rounded-full sm:gap-2.5
                bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 
                hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600
                text-white shadow-lg hover:shadow-2xl
                transition-all active:scale-90 group
                ring-2 ring-emerald-400/20"
              aria-label="Chat with কর্মচারী — AI Assistant"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.9 }}
            >
              {/* Pulsing glow ring behind the button */}
              <span className="absolute inset-0 rounded-full bg-emerald-400/25 animate-ping [animation-duration:2.5s]" />

              {/* Inner content — avatar image */}
              <span className="relative flex items-center gap-2 z-10">
                <Image
                  src={AVATAR_SRC}
                  alt="কর্মচারী"
                  width={48}
                  height={48}
                  className="h-12 w-12 sm:h-9 sm:w-9 rounded-full object-cover ring-2 ring-white/30"
                />
                <span className="hidden sm:inline text-sm font-bold tracking-wide drop-shadow-sm">কর্মচারী</span>
              </span>

              {/* Notification badge — top right */}
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-amber-400 border-[2.5px] border-background shadow-sm flex items-center justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-800 animate-pulse" />
              </span>

              {/* Mobile: small live typing indicator below the circle */}
              <span className="sm:hidden absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-[2px] bg-emerald-800/90 rounded-full px-2 py-0.5 shadow-md">
                <span className="h-[3px] w-[3px] rounded-full bg-emerald-300 animate-bounce [animation-delay:0ms]" />
                <span className="h-[3px] w-[3px] rounded-full bg-emerald-300 animate-bounce [animation-delay:150ms]" />
                <span className="h-[3px] w-[3px] rounded-full bg-emerald-300 animate-bounce [animation-delay:300ms]" />
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Chat Window ===== */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed z-[60] flex flex-col bg-background border border-border/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm
              bottom-[96px] right-3 w-[calc(100%-24px)]
              sm:bottom-6 sm:right-6 sm:w-[420px]
              max-h-[80vh] sm:max-h-[75vh]"
          >
            {/* Header — কর্মচারী Branding */}
            <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white p-4 flex items-center justify-between shrink-0 overflow-hidden">
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/5" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/5" />

              <div className="flex items-center gap-3 relative z-10">
                <div className="relative">
                  <Image
                    src={AVATAR_SRC}
                    alt="কর্মচারী"
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-white/30"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-sky-500 flex items-center justify-center ring-2 ring-emerald-500">
                    <BadgeCheck className="h-2.5 w-2.5 text-white" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-base tracking-tight">কর্মচারী</h3>
                    <BadgeCheck className="h-4 w-4 text-sky-300" />
                    <span className="text-[10px] font-medium bg-white/15 rounded-full px-2 py-0.5">AI Assistant</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-300 animate-pulse" />
                    <p className="text-[11px] text-emerald-100 font-medium">অনলাইন — সাহায্য করতে প্রস্তুত</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 relative z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/15 h-8 px-2.5 text-xs font-medium rounded-lg"
                  onClick={clearChat}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  রিসেট
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/15 h-8 w-8 rounded-lg"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Capability Cards */}
            <div className="px-4 pt-3 pb-2 border-b border-border/30 bg-muted/30 shrink-0">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2">আমি কি কি করতে পারি</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {capabilities.map((cap) => {
                  const Icon = cap.icon
                  return (
                    <button
                      key={cap.label}
                      className="flex flex-col items-center gap-1 p-2.5 min-h-[44px] rounded-lg hover:bg-muted/60 transition-colors cursor-pointer active:scale-95"
                      onClick={() => {
                        const actionMap: Record<string, string> = {
                          'প্রোডাক্ট খুঁজুন': 'আমি প্রোডাক্ট খুঁজতে চাই',
                          'ফিচার্ড': 'Show me all featured products',
                          'প্রাইস জানুন': 'সব প্রোডাক্ট এর দাম জানাও',
                          'অর্ডার করুন': 'আমি order করতে চাই',
                          'সাহায্য নিন': 'আমাকে সাহায্য দরকার',
                        }
                        const msg = actionMap[cap.label] || cap.label
                        setInput(msg)
                        sendMessage(msg)
                      }}
                    >
                      <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-[11px] font-medium text-foreground text-center leading-tight">{cap.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Trust Indicators Strip */}
            <div className="flex items-center justify-center gap-3 px-4 py-1.5 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-border/30 shrink-0">
              <div className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400">
                <Shield className="h-2.5 w-2.5" />
                <span>Warranty</span>
              </div>
              <div className="w-px h-3 bg-emerald-200 dark:bg-emerald-800" />
              <div className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400">
                <Zap className="h-2.5 w-2.5" />
                <span>5-20 Min</span>
              </div>
              <div className="w-px h-3 bg-emerald-200 dark:bg-emerald-800" />
              <div className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400">
                <Headphones className="h-2.5 w-2.5" />
                <span>24/7</span>
              </div>
              <div className="w-px h-3 bg-emerald-200 dark:bg-emerald-800" />
              <div className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400">
                <BadgeCheck className="h-2.5 w-2.5" />
                <span>Verified</span>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[120px] sm:min-h-[200px] overscroll-contain scroll-smooth custom-scrollbar"
              style={{ maxHeight: 'calc(80vh - 280px)' }}
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={`${msg.timestamp}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="relative shrink-0 mt-0.5">
                      <Image
                        src={AVATAR_SRC}
                        alt="কর্মচারী"
                        width={28}
                        height={28}
                        className="h-7 w-7 rounded-full object-cover ring-1 ring-emerald-200/50 dark:ring-emerald-800/50"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-sky-500 flex items-center justify-center ring-1 ring-background">
                        <BadgeCheck className="h-2 w-2 text-white" />
                      </div>
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-br-md shadow-md shadow-emerald-600/20'
                        : 'bg-muted/80 rounded-bl-md border border-border/30'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.whatsappUrl && (
                      <a
                        href={msg.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-semibold transition-all shadow-sm hover:shadow-md active:scale-95"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp এ অর্ডার করুন
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-emerald-500/20">
                      <User className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2.5 justify-start"
                >
                  <div className="relative shrink-0">
                    <Image
                      src={AVATAR_SRC}
                      alt="কর্মচারী"
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded-full object-cover ring-1 ring-emerald-200/50 dark:ring-emerald-800/50"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-sky-500 flex items-center justify-center ring-1 ring-background">
                      <BadgeCheck className="h-2 w-2 text-white" />
                    </div>
                  </div>
                  <div className="bg-muted/80 rounded-2xl rounded-bl-md px-4 py-3 border border-border/30">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0ms]" />
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:150ms]" />
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 flex gap-2 overflow-x-auto shrink-0 border-t border-border/30 scrollbar-none">
              {quickActions.map(q => (
                <button
                  key={q.label}
                  className="cursor-pointer whitespace-nowrap text-[11px] shrink-0 hover:bg-emerald-50 dark:hover:bg-emerald-950 border border-border/60 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all active:scale-95 py-2.5 px-4 rounded-full bg-background"
                  onClick={() => {
                    sendMessage(q.action)
                  }}
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* Input — min 16px font to prevent iOS zoom */}
            <div className="p-3 border-t border-border/30 shrink-0 bg-background/50">
              <div className="flex gap-2 items-center">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="বাংলা, বাংলিশ বা English এ লিখুন..."
                  className="h-11 text-base rounded-xl border-border/50 focus-visible:ring-emerald-500/30"
                  disabled={isLoading || cooldown}
                  style={{ fontSize: '16px' }}
                />
                <Button
                  size="icon"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading || cooldown}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-11 w-11 rounded-xl shadow-md shadow-emerald-600/20 shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {cooldown && (
                <p className="text-[10px] text-muted-foreground mt-1.5 text-center">একটু অপেক্ষা করুন...</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
