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
  Trash2,
  RotateCcw,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        '👋 হ্যালো! আমি SH Assistant — Streaming Hub এর AI হেল্পার।\n\n🔍 প্রোডাক্ট খুঁজুন\n📦 অর্ডার করুন\n💳 পেমেন্ট জানুন\n❓ যেকোনো প্রশ্ন করুন\n\nবাংলা, বাংলিশ বা English — যেভাবেই চান জিজ্ঞেস করুন! 😊',
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [cooldown, setCooldown] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastSentRef = useRef<number>(0)

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

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim()
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
    setInput('')
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
        content:
          '👋 চ্যাট ক্লিয়ার হয়েছে! আবার শুরু করুন — কিভাবে সাহায্য করতে পারি? 😊',
        timestamp: Date.now(),
      },
    ])
  }

  const quickActions = [
    { label: 'Netflix কত টাকা?', icon: '🎬' },
    { label: 'VPN প্ল্যান', icon: '🔒' },
    { label: 'অর্ডার কিভাবে?', icon: '📦' },
    { label: 'bKash নম্বর', icon: '💳' },
    { label: 'Price list', icon: '💰' },
  ]

  return (
    <>
      {/* Floating Button — positioned ABOVE the WhatsApp button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-36 right-4 z-50 lg:bottom-20 lg:right-6 flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 group"
            aria-label="Open AI Assistant"
          >
            <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
            <span className="text-sm font-semibold hidden sm:inline">AI Assistant</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-4 right-4 z-[60] w-[calc(100%-2rem)] sm:w-[400px] max-h-[85vh] flex flex-col bg-background border border-border/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white p-4 flex items-center justify-between shrink-0 overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/5" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/5" />

              <div className="flex items-center gap-3 relative z-10">
                <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/20">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight">SH Assistant</h3>
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

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 overscroll-contain scroll-smooth"
              style={{ maxHeight: 'calc(85vh - 180px)' }}
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
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-emerald-200/50 dark:ring-emerald-800/50">
                      <Bot className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
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
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 flex items-center justify-center shrink-0 ring-1 ring-emerald-200/50 dark:ring-emerald-800/50">
                    <Bot className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
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
                <Badge
                  key={q.label}
                  variant="outline"
                  className="cursor-pointer whitespace-nowrap text-[11px] shrink-0 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all active:scale-95 py-1 px-2.5 rounded-full"
                  onClick={() => {
                    setInput(q.label)
                    inputRef.current?.focus()
                  }}
                >
                  {q.icon} {q.label}
                </Badge>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/30 shrink-0 bg-background/50">
              <div className="flex gap-2 items-center">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="বাংলা, বাংলিশ বা English এ লিখুন..."
                  className="h-10 text-sm rounded-xl border-border/50 focus-visible:ring-emerald-500/30"
                  disabled={isLoading || cooldown}
                />
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading || cooldown}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-10 w-10 rounded-xl shadow-md shadow-emerald-600/20 shrink-0"
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
