'use client'

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { lockScroll, unlockScroll } from '@/components/shared/ScrollFix'
import {
  MessageCircle,
  X,
  Send,
  User,
  RotateCcw,
  BadgeCheck,
  Shield,
  Zap,
  Headphones,
  ExternalLink,
  Loader2,
  CreditCard,
  List,
  Phone,
  Sparkles,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Quick Actions (Sales-Focused) ───────────────────────────────────────────

const quickActions = [
  { label: '📋 Price List', action: 'সব ক্যাটাগরির দাম দেখাও', icon: List },
  { label: '📦 Order Process', action: 'কীভাবে অর্ডার করবো?', icon: Zap },
  { label: '💳 Payment Number', action: 'bKash number ki?', icon: CreditCard },
  { label: '🔒 Warranty', action: 'warranty ki vabe pabo?', icon: Shield },
  { label: '📞 Contact Support', action: 'WhatsApp number ki?', icon: Phone },
  { label: '⭐ Best Sellers', action: 'ফিচার্ড প্রোডাক্ট দেখাও', icon: BadgeCheck },
]

// ─── Trust Indicators ─────────────────────────────────────────────────────────

const trustIndicators = [
  { icon: Shield, label: 'Warranty' },
  { icon: Zap, label: '5-20 Min' },
  { icon: Headphones, label: '24/7' },
  { icon: BadgeCheck, label: 'Verified' },
]

// ─── Typewriter Messages ─────────────────────────────────────────────────────

const typewriterMessages = [
  '👋 আমি কর্মচারী — বলুন কী লাগবে!',
  '🎬 Netflix এর দাম জানতে চান?',
  '⭐ সেরা ডিল দেখুন — Featured Products!',
  '💎 বাংলাদেশে সেরা দাম গ্যারান্টি!',
  '🛒 অর্ডার করতে চান? গাইড করবো!',
  '🔐 PIN জানতে চান? আমাকে জিজ্ঞেস করুন!',
  '⚡ মাত্র 5-20 মিনিটে ডেলিভারি!',
  '💳 bKash/Nagad পেমেন্ট সহজ!',
]

// ─── Greeting Message ────────────────────────────────────────────────────────

const KORMOCHARY_GREETING = `আসসালামু আলাইকুম! 🎉 Streaming Hub-এ স্বাগতম!

আমি কর্মচারী — আপনার পার্সোনাল শপিং অ্যাসিস্ট্যান্ট। বাংলাদেশে সেরা দামে প্রিমিয়াম সাবস্ক্রিপশন পেতে আমি সাহায্য করবো! 💯

🎬 Netflix, Spotify, ChatGPT Plus
🔒 VPN, AI Tools, আরও অনেক কিছু!

কী লাগবে বলুন — সেরা ডিল খুঁজে দেবো! 😊`

// ─── formatMessage: Markdown-like text → React elements ──────────────────────

function formatMessage(text: string): ReactNode[] {
  const lines = text.split('\n')
  const elements: ReactNode[] = []

  lines.forEach((line, lineIdx) => {
    const processedLine = processInlineFormatting(line)

    if (lineIdx < lines.length - 1) {
      elements.push(
        <span key={`line-${lineIdx}`}>
          {processedLine}
          <br />
        </span>
      )
    } else {
      elements.push(<span key={`line-${lineIdx}`}>{processedLine}</span>)
    }
  })

  return elements
}

function processInlineFormatting(line: string): ReactNode[] {
  const elements: ReactNode[] = []
  let remaining = line

  // Check if this is a bullet point line (• or -)
  const bulletMatch = remaining.match(/^(\s*)([•\-])\s(.*)/)
  if (bulletMatch) {
    const [, indent, , content] = bulletMatch
    elements.push(
      <span key={`bullet-${indent.length}`} className="flex items-start gap-1.5 my-0.5">
        <span className="mt-[7px] shrink-0 h-1.5 w-1.5 rounded-full bg-[#10b981] dark:bg-[#34d399]" />
        <span>{processInlineFormatting(content)}</span>
      </span>
    )
    return elements
  }

  // Check if this is a numbered list item (1. 2. etc.)
  const numberedMatch = remaining.match(/^(\s*)(\d+)[.)]\s(.*)/)
  if (numberedMatch) {
    const [, , num, content] = numberedMatch
    elements.push(
      <span key={`num-${num}`} className="flex items-start gap-1.5 my-0.5">
        <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-emerald-100 dark:bg-[#0f172a]/30 text-[#0f172a] dark:text-[#34d399] flex items-center justify-center text-[10px] font-bold leading-none mt-px">
          {num}
        </span>
        <span>{processInlineFormatting(content)}</span>
      </span>
    )
    return elements
  }

  // Process inline: **bold** and links
  let keyIdx = 0
  while (remaining.length > 0) {
    // Bold pattern: **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        elements.push(<span key={`t-${keyIdx++}`}>{remaining.slice(0, boldMatch.index)}</span>)
      }
      elements.push(
        <strong key={`b-${keyIdx++}`} className="font-semibold text-[#0f172a] dark:text-[#34d399]">
          {boldMatch[1]}
        </strong>
      )
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length)
      continue
    }

    // Link pattern: [text](url)
    const linkMatch = remaining.match(/\[(.+?)\]\((.+?)\)/)
    if (linkMatch && linkMatch.index !== undefined) {
      if (linkMatch.index > 0) {
        elements.push(<span key={`t-${keyIdx++}`}>{remaining.slice(0, linkMatch.index)}</span>)
      }
      elements.push(
        <a
          key={`a-${keyIdx++}`}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#10b981] dark:text-[#34d399] underline underline-offset-2 hover:text-[#0f172a] dark:hover:text-[#f59e0b] transition-colors"
        >
          {linkMatch[1]}
        </a>
      )
      remaining = remaining.slice(linkMatch.index + linkMatch[0].length)
      continue
    }

    // No more matches, push the rest
    elements.push(<span key={`t-${keyIdx++}`}>{remaining}</span>)
    break
  }

  return elements
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)

  // Manual scroll lock on mobile when chat is open
  useEffect(() => {
    if (isOpen) {
      lockScroll()
    } else {
      unlockScroll()
    }
    return () => {
      if (isOpen) unlockScroll()
    }
  }, [isOpen])

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
  const [hasInteracted, setHasInteracted] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastSentRef = useRef<number>(0)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Typewriter effect for the floating bubble ──
  useEffect(() => {
    if (isOpen) return

    const currentMessage = typewriterMessages[currentMsgIndex]
    let charIndex = 0

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

  // ── Auto-scroll to bottom ──
  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
      })
    }
  }, [messages, isLoading])

  // ── Focus input when opened ──
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 350)
    }
  }, [isOpen])

  // ── Send message handler ──
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
    setHasInteracted(true)

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

  // ──────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ===== Floating Chat Button (Fixed Bottom-Right) ===== */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            className="fixed z-[60] flex items-center gap-2 sm:gap-3
              right-3 bottom-[72px]
              sm:right-6 sm:bottom-6"
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {/* Typewriter Message Bubble — desktop only (to the LEFT of the button) */}
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.8 }}
              className="hidden sm:flex items-center gap-2 bg-background border border-border/60 shadow-lg rounded-2xl px-4 py-2.5 max-w-[260px] cursor-pointer hover:shadow-xl hover:border-[#10b981]/50 transition-all group/bubble relative"
              onClick={() => setIsOpen(true)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-snug">
                  {displayedText}
                  {isTyping && (
                    <span className="inline-block w-[2px] h-4 bg-[#10b981] ml-0.5 align-middle animate-pulse" />
                  )}
                </p>
              </div>
              {isTyping && (
                <div className="flex items-center gap-[3px] shrink-0">
                  <span className="h-1 w-1 rounded-full bg-[#10b981] animate-bounce [animation-delay:0ms]" />
                  <span className="h-1 w-1 rounded-full bg-[#10b981] animate-bounce [animation-delay:150ms]" />
                  <span className="h-1 w-1 rounded-full bg-[#10b981] animate-bounce [animation-delay:300ms]" />
                </div>
              )}
              {/* Speech bubble arrow pointing right toward the button */}
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0
                border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-l-[9px] border-l-border/60" />
              <div className="absolute -right-[5px] top-1/2 -translate-y-1/2 w-0 h-0
                border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[7px] border-l-background" />
            </motion.div>

            {/* The Main Round AI Button */}
            <motion.button
              onClick={() => setIsOpen(true)}
              className="relative flex items-center justify-center
                w-14 h-14
                sm:w-[60px] sm:h-[60px]
                rounded-full
                bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#10b981]
                hover:from-[#0f172a] hover:via-[#0f172a] hover:to-[#34d399]
                text-white shadow-lg hover:shadow-2xl
                transition-all active:scale-90 group
                ring-2 ring-[#10b981]/20
                touch-manipulation"
              aria-label="Chat with কর্মচারী — AI Assistant"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.9 }}
            >
              {/* Subtle glow animation */}
              <span className="absolute inset-[-4px] rounded-full bg-[#10b981]/20 animate-pulse [animation-duration:2s]" />
              <span className="absolute inset-0 rounded-full bg-[#10b981]/25 animate-ping [animation-duration:2.5s]" />

              {/* Icon inside the button — use Sparkles icon as fallback when no avatar image */}
              <span className="relative z-10 flex items-center justify-center">
                <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 text-white drop-shadow-lg" />
              </span>

              {/* Notification badge — top right */}
              <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-amber-400 border-[2.5px] border-background shadow-sm flex items-center justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-800 animate-pulse" />
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Chat Window (Fixed Bottom-Right) ===== */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile overlay backdrop */}
            <motion.div
              className="fixed inset-0 z-[59] bg-black/50 backdrop-blur-sm sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Chat panel */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed z-[60] flex flex-col bg-background border border-border/50 shadow-2xl overflow-hidden
                inset-x-0 bottom-0 h-[85dvh] rounded-t-2xl
                sm:inset-x-auto sm:bottom-[90px] sm:right-6 sm:w-[400px] sm:h-auto sm:max-h-[600px] sm:rounded-2xl"
            >
              {/* ===== HEADER ===== */}
              <div className="relative bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#10b981] text-white p-3 sm:p-4 flex items-center justify-between shrink-0 overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/5" />
                <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />

                <div className="flex items-center gap-2.5 sm:gap-3 relative z-10">
                  <div className="relative">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center ring-2 ring-white/30 shadow-md">
                      <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#10b981] flex items-center justify-center ring-2 ring-[#0f172a]">
                      <BadgeCheck className="h-2.5 w-2.5 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm sm:text-base tracking-tight">কর্মচারী</h3>
                      <BadgeCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#f59e0b]" />
                      <Badge
                        variant="secondary"
                        className="text-[9px] sm:text-[10px] font-semibold bg-white/15 text-white border-0 rounded-full px-1.5 sm:px-2 py-0 h-4 sm:h-5"
                      >
                        AI Sales Assistant
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-2 w-2 rounded-full bg-green-300 animate-pulse" />
                      <p className="text-[10px] sm:text-[11px] text-slate-200 font-medium">অনলাইন — সাহায্য করতে প্রস্তুত</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 relative z-10">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/15 h-7 sm:h-8 px-2 sm:px-2.5 text-xs font-medium rounded-lg"
                    onClick={clearChat}
                    aria-label="Reset chat"
                  >
                    <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                    <span className="hidden sm:inline">রিসেট</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/15 h-7 w-7 sm:h-8 sm:w-8 rounded-lg"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close chat"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* ===== TRUST INDICATORS BAR ===== */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 bg-slate-50/50 dark:bg-[#0f172a]/20 border-b border-border/30 shrink-0">
                {trustIndicators.map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="flex items-center gap-1">
                      <div className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] text-[#0f172a] dark:text-[#34d399] font-medium">
                        <Icon className="h-2.5 w-2.5" />
                        <span>{item.label}</span>
                      </div>
                      {idx < trustIndicators.length - 1 && (
                        <div className="w-px h-3 bg-slate-200 dark:bg-slate-700 ml-2 sm:ml-3" />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* ===== MESSAGE AREA ===== */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 overscroll-contain scroll-smooth"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgb(16 185 129 / 0.3) transparent',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {messages.map((msg, i) => (
                  <motion.div
                    key={`${msg.timestamp}-${i}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className={`flex gap-2 sm:gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="relative shrink-0 mt-0.5">
                        <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center ring-1 ring-[#10b981]/30">
                          <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                        </div>
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] sm:max-w-[82%] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 text-[12px] sm:text-[13px] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-[#0f172a] to-[#10b981] text-white rounded-br-md shadow-md shadow-[#10b981]/20'
                          : 'bg-muted/70 dark:bg-muted/50 rounded-bl-md border border-border/30'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="whitespace-pre-wrap">{formatMessage(msg.content)}</div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
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
                      <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-gradient-to-br from-[#0f172a] to-[#10b981] flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-[#10b981]/20">
                        <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-2 sm:gap-2.5 justify-start"
                  >
                    <div className="relative shrink-0">
                      <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center ring-1 ring-[#10b981]/30">
                        <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                      </div>
                    </div>
                    <div className="bg-muted/70 dark:bg-muted/50 rounded-2xl rounded-bl-md px-4 py-3 border border-border/30">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#10b981] animate-bounce [animation-delay:0ms]" />
                        <span className="h-2 w-2 rounded-full bg-[#10b981] animate-bounce [animation-delay:150ms]" />
                        <span className="h-2 w-2 rounded-full bg-[#10b981] animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* ===== QUICK ACTIONS ===== */}
              <div
                className="px-2 sm:px-3 py-2 flex gap-1 sm:gap-1.5 overflow-x-auto shrink-0 border-t border-border/30"
                style={{ scrollbarWidth: 'none' }}
              >
                {quickActions.map(q => (
                  <button
                    key={q.label}
                    className="cursor-pointer whitespace-nowrap text-[10px] sm:text-[11px] shrink-0
                      hover:bg-emerald-50 dark:hover:bg-[#0f172a]/40
                      border border-border/60 hover:border-[#10b981]/50 dark:hover:border-[#34d399]
                      transition-all active:scale-95 py-1.5 sm:py-2 px-2.5 sm:px-3.5 rounded-full bg-background
                      font-medium text-foreground/80 hover:text-[#0f172a] dark:hover:text-[#34d399]
                      touch-manipulation"
                    onClick={() => {
                      sendMessage(q.action)
                    }}
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              {/* ===== INPUT AREA ===== */}
              <div className="p-2 sm:p-3 border-t border-border/30 shrink-0 bg-background/80 backdrop-blur-sm">
                <div className="flex gap-2 items-center">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="বাংলা, বাংলিশ বা English এ লিখুন..."
                    className="h-10 sm:h-11 text-sm sm:text-base rounded-xl border-border/50 focus-visible:ring-[#10b981]/30"
                    disabled={isLoading || cooldown}
                    style={{ fontSize: '16px' }}
                  />
                  <Button
                    size="icon"
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading || cooldown}
                    className="bg-gradient-to-r from-[#0f172a] to-[#10b981] hover:from-[#0f172a] hover:to-[#34d399] h-10 w-10 sm:h-11 sm:w-11 rounded-xl shadow-md shadow-[#10b981]/20 shrink-0 touch-manipulation"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {cooldown && (
                  <p className="text-[10px] text-muted-foreground mt-1.5 text-center animate-pulse">
                    একটু অপেক্ষা করুন...
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
