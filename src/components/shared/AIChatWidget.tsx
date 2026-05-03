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

// Simple debounce helper
function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "👋 Hi! I'm SH Assistant — your AI helper at Streaming Hub. How can I help you today?\n\n🔍 Search products\n📦 Order info\n💳 Payment help\n❓ Any questions",
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
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

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
          content: "⏳ I'm a bit busy right now. Please wait a moment and try again, or contact us directly on WhatsApp: +8801647236359 💬",
          whatsappUrl: 'https://wa.me/8801647236359?text=' + encodeURIComponent('Hi, I need help from Streaming Hub support'),
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
        content: data.response || "Sorry, I couldn't process that. Please try again.",
        whatsappUrl: data.whatsappUrl,
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '❌ Connection error. Please try again or contact us on WhatsApp: +8801647236359',
        whatsappUrl: 'https://wa.me/8801647236359?text=' + encodeURIComponent('Hi, I need help from Streaming Hub support'),
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
        content: '👋 Chat cleared! How can I help you?',
        timestamp: Date.now(),
      },
    ])
  }

  const quickActions = [
    { label: 'Netflix price', icon: '🎬' },
    { label: 'VPN plans', icon: '🔒' },
    { label: 'How to order?', icon: '📦' },
    { label: 'bKash number', icon: '💳' },
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
            className="fixed bottom-36 right-4 z-50 lg:bottom-20 lg:right-6 flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95"
            aria-label="Open AI Assistant"
          >
            <Sparkles className="h-5 w-5" />
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
            className="fixed bottom-4 right-4 z-[60] w-[calc(100%-2rem)] sm:w-96 max-h-[80vh] flex flex-col bg-background border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">SH Assistant</h3>
                  <p className="text-[10px] text-emerald-100">AI-powered support</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 h-7 px-2 text-xs"
                  onClick={clearChat}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 h-7 w-7"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 overscroll-contain"
              style={{ maxHeight: 'calc(80vh - 130px)' }}
            >
              {messages.map((msg, i) => (
                <div
                  key={`${msg.timestamp}-${i}`}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-sm'
                        : 'bg-muted rounded-bl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    {msg.whatsappUrl && (
                      <a
                        href={msg.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Order on WhatsApp
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 mt-1">
                      <User className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
                    <Bot className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="px-3 py-1.5 flex gap-1.5 overflow-x-auto shrink-0 border-t scrollbar-none">
              {quickActions.map(q => (
                <Badge
                  key={q.label}
                  variant="outline"
                  className="cursor-pointer whitespace-nowrap text-[10px] shrink-0 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors active:scale-95"
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
            <div className="p-3 border-t shrink-0">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  className="h-9 text-sm"
                  disabled={isLoading || cooldown}
                />
                <Button
                  size="sm"
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading || cooldown}
                  className="bg-emerald-600 hover:bg-emerald-700 h-9 px-3"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {cooldown && (
                <p className="text-[10px] text-muted-foreground mt-1 text-center">Please wait a moment...</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
