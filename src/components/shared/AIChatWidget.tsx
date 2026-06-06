'use client'

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

type DetectedLang = 'bangla' | 'banglish' | 'english'

interface ProductCard {
  id: string
  name: string
  slug: string
  image: string | null
  basePriceBDT: string
  priceOptions: string
  warranty: string | null
  deliveryTime: string
  stockStatus: string
  category: { name: string; slug: string }
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  products?: ProductCard[]
  suggestions?: string[]
  whatsappUrl?: string
  timestamp: number
  isStreaming?: boolean
  detectedLang?: DetectedLang
}

// ─── Quick Actions (Bengali, Sales-Focused) ──────────────────────────────────

const quickActions = [
  { label: '📋 প্রাইস লিস্ট', action: 'সব ক্যাটাগরির দাম দেখাও' },
  { label: '📦 অর্ডার করুন', action: 'কীভাবে অর্ডার করবো?' },
  { label: '💳 bKash নম্বর', action: 'bKash number ki?' },
  { label: '🔒 ওয়ারেন্টি', action: 'warranty ki vabe pabo?' },
  { label: '📞 যোগাযোগ', action: 'WhatsApp number ki?' },
  { label: '⭐ বেস্ট সেলার', action: 'ফিচার্ড প্রোডাক্ট দেখাও' },
]

// ─── Trust Indicators ─────────────────────────────────────────────────────────

const trustIndicators = [
  { icon: Shield, label: 'Warranty' },
  { icon: Zap, label: '5-20 Min' },
  { icon: Headphones, label: '24/7' },
  { icon: BadgeCheck, label: 'Verified' },
]

// ─── Typewriter Messages (8 Rotating Bengali) ────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCheapestPrice(product: ProductCard): string {
  try {
    const opts = JSON.parse(product.priceOptions || '[]')
    if (Array.isArray(opts) && opts.length > 0) {
      const sorted = [...opts].sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const priceA = parseInt(String(a.priceBDT).replace(/\D/g, '') || '0')
        const priceB = parseInt(String(b.priceBDT).replace(/\D/g, '') || '0')
        return priceA - priceB
      })
      return String(sorted[0].priceBDT)
    }
  } catch {
    // fallback to base price
  }
  return product.basePriceBDT
}

// ─── Language Detection (client-side, mirrors backend) ───────────────────────

function detectLanguageClient(message: string): DetectedLang {
  if (/[\u0980-\u09FF]/.test(message)) return 'bangla'
  const patterns = [/koto/i, /taka/i, /lagbe/i, /chai/i, /order\s*korbo/i, /nite\s*chai/i, /kinte\s*chai/i, /dekhao/i, /ki\s*ki/i, /sob/i, /nam/i, /amar/i, /apnar/i, /bhai/i, /kichu/i, /kemon/i, /valo/i, /ase/i, /ache/i, /korbo/i, /parbo/i, /kivabe/i, /keno/i]
  if (patterns.filter((p) => p.test(message)).length >= 2) return 'banglish'
  return 'english'
}

// ─── TTS Utility ─────────────────────────────────────────────────────────────

function speak(text: string, lang: DetectedLang, onEnd?: () => void): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null

  // Cancel any ongoing speech
  window.speechSynthesis.cancel()

  // Clean text for speech (remove emojis, markdown)
  const cleanText = text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1')
    .replace(/[•\-]\s/g, '')
    .replace(/\d+[.)]\s/g, '')
    .replace(/৳/g, 'টাকা')
    .trim()

  if (!cleanText) return null

  const utterance = new SpeechSynthesisUtterance(cleanText)

  // Set language based on detected language
  if (lang === 'bangla') {
    utterance.lang = 'bn-BD'
  } else if (lang === 'banglish') {
    // Banglish: try Bangla voice first since content is in Bengali script
    utterance.lang = 'bn-BD'
  } else {
    utterance.lang = 'en-US'
  }

  utterance.rate = 0.95
  utterance.pitch = 1.0
  utterance.volume = 1.0

  // Try to find a matching voice
  const voices = window.speechSynthesis.getVoices()
  const targetLang = utterance.lang
  const shortLang = targetLang.split('-')[0]

  // Priority: exact lang match > short lang match > default
  const exactVoice = voices.find(v => v.lang === targetLang)
  const shortVoice = exactVoice ? null : voices.find(v => v.lang.startsWith(shortLang))
  const selectedVoice = exactVoice || shortVoice || null

  if (selectedVoice) {
    utterance.voice = selectedVoice
  }

  if (onEnd) {
    utterance.onend = onEnd
    utterance.onerror = onEnd
  }

  window.speechSynthesis.speak(utterance)
  return utterance
}

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
        <span className="mt-[7px] shrink-0 h-1.5 w-1.5 rounded-full bg-primary dark:bg-[#34d399]" />
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
        <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-primary/15 dark:bg-[#0f172a]/30 text-foreground dark:text-[#34d399] flex items-center justify-center text-[10px] font-bold leading-none mt-px">
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
        <strong key={`b-${keyIdx++}`} className="font-semibold text-foreground dark:text-[#34d399]">
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
          className="text-primary dark:text-[#34d399] underline underline-offset-2 hover:text-foreground dark:hover:text-[#F5B301] transition-colors"
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

// ─── Product Card Component ──────────────────────────────────────────────────

function ProductCardItem({ product }: { product: ProductCard }) {
  const cheapestPrice = getCheapestPrice(product)
  const whatsappUrl = `https://wa.me/8801647236359?text=${encodeURIComponent(`🛒 Order: ${product.name} — ${cheapestPrice}`)}`
  const initial = product.name.charAt(0).toUpperCase()

  return (
    <div className="rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 bg-background border border-border/40 overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        {/* Image or gradient placeholder */}
        <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-[#00A6A6] to-[#0B1F3A] flex items-center justify-center">
          {product.image ? (
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-white font-bold text-lg">{initial}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{product.name}</p>
          <p className="text-xs text-muted-foreground">{product.category.name}</p>
        </div>
        <div className="bg-gradient-to-r from-[#00A6A6] to-emerald-500 text-white px-2.5 py-1 rounded-lg text-sm font-bold shrink-0">
          ৳{cheapestPrice}
        </div>
      </div>
      <div className="px-3 pb-3">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold transition-all active:scale-95"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp এ অর্ডার
        </a>
      </div>
    </div>
  )
}

// ─── AI Avatar Component ─────────────────────────────────────────────────────

function AIAvatar({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-6 w-6 sm:h-7 sm:w-7',
    md: 'h-10 w-10 sm:h-11 sm:w-11',
    lg: 'h-12 w-12',
  }
  const iconSizes = {
    sm: 'h-3 w-3 sm:h-3.5 sm:w-3.5',
    md: 'h-5 w-5 sm:h-6 sm:w-6',
    lg: 'h-7 w-7',
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[#00A6A6] to-[#0B1F3A] flex items-center justify-center ring-1 ring-[#00A6A6]/30 overflow-hidden`}
    >
      {/* Try to load avatar image, fallback to Sparkles */}
      <img
        src="/assistant-avatar.png"
        alt="কর্মচারী"
        className="h-full w-full object-cover hidden"
        onLoad={(e) => {
          ;(e.target as HTMLImageElement).classList.remove('hidden')
          ;(e.target as HTMLImageElement).nextElementSibling?.classList.add('hidden')
        }}
        onError={(e) => {
          ;(e.target as HTMLImageElement).classList.add('hidden')
          ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
        }}
      />
      <Sparkles className={`${iconSizes[size]} text-white`} />
    </div>
  )
}

// ─── Speaker Button Component ────────────────────────────────────────────────

function SpeakerButton({ text, lang, isStreaming }: { text: string; lang: DetectedLang; isStreaming?: boolean }) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const handleSpeak = useCallback(() => {
    if (isSpeaking) {
      // Stop speaking
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      setIsSpeaking(false)
      return
    }

    if (isStreaming || !text) return

    setIsSpeaking(true)
    const utterance = speak(text, lang, () => {
      setIsSpeaking(false)
    })
    utteranceRef.current = utterance

    // Safety: auto-reset after max 30 seconds
    setTimeout(() => setIsSpeaking(false), 30000)
  }, [text, lang, isSpeaking, isStreaming])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  if (isStreaming) return null

  return (
    <button
      onClick={handleSpeak}
      className={`inline-flex items-center justify-center h-6 w-6 rounded-full transition-all active:scale-90 touch-manipulation ${
        isSpeaking
          ? 'bg-[#00A6A6] text-white shadow-md shadow-[#00A6A6]/30 animate-pulse'
          : 'bg-muted/60 hover:bg-[#00A6A6]/15 text-muted-foreground hover:text-[#00A6A6]'
      }`}
      aria-label={isSpeaking ? 'বন্ধ করুন' : 'শুনুন'}
      title={isSpeaking ? 'Stop' : 'Listen'}
    >
      {isSpeaking ? (
        <VolumeX className="h-3 w-3" />
      ) : (
        <Volume2 className="h-3 w-3" />
      )}
    </button>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: KORMOCHARY_GREETING,
      timestamp: Date.now(),
      detectedLang: 'bangla',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [cooldown, setCooldown] = useState(false)
  const [currentMsgIndex, setCurrentMsgIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  // Voice input state
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const sendMessageRef = useRef<(msg?: string) => Promise<void>>()

  // Check speech support once at mount
  const [speechSupported] = useState(() => {
    if (typeof window === 'undefined') return false
    return !!(
      (window as unknown as Record<string, unknown>)['SpeechRecognition'] ||
      (window as unknown as Record<string, unknown>)['webkitSpeechRecognition']
    )
  })

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

  // ── Send message handler (with SSE streaming) ──
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

    // Detect language from user message for TTS matching later
    const userDetectedLang = detectLanguageClient(trimmed)

    // Add empty streaming assistant message
    const assistantTimestamp = Date.now()
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: '', timestamp: assistantTimestamp, isStreaming: true, detectedLang: userDetectedLang },
    ])

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
        setMessages(prev => {
          const updated = [...prev]
          const lastIdx = updated.length - 1
          if (updated[lastIdx]?.role === 'assistant') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              content: '⏳ একটু ব্যস্ত আছি, কিছুক্ষণ পর আবার চেষ্টা করুন। অথবা সরাসরি WhatsApp এ যোগাযোগ করুন: +8801647236359 💬',
              whatsappUrl: 'https://wa.me/8801647236359?text=' + encodeURIComponent('Hi, Streaming Hub এ সাহায্য দরকার'),
              isStreaming: false,
            }
          }
          return updated
        })
        setIsLoading(false)
        return
      }

      if (!res.ok) throw new Error('Failed to get response')

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No reader available')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))

            if (data.type === 'token' && data.content) {
              setMessages(prev => {
                const updated = [...prev]
                const lastIdx = updated.length - 1
                if (updated[lastIdx]?.role === 'assistant' && updated[lastIdx].isStreaming) {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: updated[lastIdx].content + data.content,
                  }
                }
                return updated
              })
            } else if (data.type === 'products') {
              setMessages(prev => {
                const updated = [...prev]
                const lastIdx = updated.length - 1
                if (updated[lastIdx]?.role === 'assistant') {
                  updated[lastIdx] = { ...updated[lastIdx], products: data.products }
                }
                return updated
              })
            } else if (data.type === 'suggestions') {
              setMessages(prev => {
                const updated = [...prev]
                const lastIdx = updated.length - 1
                if (updated[lastIdx]?.role === 'assistant') {
                  updated[lastIdx] = { ...updated[lastIdx], suggestions: data.suggestions }
                }
                return updated
              })
            } else if (data.type === 'done') {
              setMessages(prev => {
                const updated = [...prev]
                const lastIdx = updated.length - 1
                if (updated[lastIdx]?.role === 'assistant') {
                  // Use backend's detectedLang if available, otherwise fall back to client-side detection
                  const backendLang = data.detectedLang as DetectedLang | undefined
                  const finalLang = backendLang || userDetectedLang
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    isStreaming: false,
                    whatsappUrl: data.whatsappUrl,
                    detectedLang: finalLang,
                  }
                }
                return updated
              })
            }
          } catch {
            // ignore parse errors for malformed SSE events
          }
        }
      }

      // If stream ended without 'done', mark as not streaming
      setMessages(prev => {
        const updated = [...prev]
        const lastIdx = updated.length - 1
        if (updated[lastIdx]?.role === 'assistant' && updated[lastIdx].isStreaming) {
          updated[lastIdx] = { ...updated[lastIdx], isStreaming: false }
        }
        return updated
      })
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        const lastIdx = updated.length - 1
        if (updated[lastIdx]?.role === 'assistant') {
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: '❌ সংযোগে সমস্যা হচ্ছে। আবার চেষ্টা করুন অথবা WhatsApp এ যোগাযোগ করুন: +8801647236359',
            isStreaming: false,
          }
        }
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, cooldown, messages])

  // ── Keep sendMessage ref updated for voice input ──
  useEffect(() => {
    sendMessageRef.current = sendMessage
  }, [sendMessage])

  // ── Initialize Speech Recognition (Dynamic Language STT) ──
  useEffect(() => {
    if (!speechSupported) return
    const SR = (window as unknown as Record<string, unknown>)['SpeechRecognition'] ||
      (window as unknown as Record<string, unknown>)['webkitSpeechRecognition']
    if (!SR) return

    const recognition = new (SR as new () => SpeechRecognition)()
    // Default to bn-BD, but the engine will auto-detect language
    // Web Speech API on Chrome supports multilingual recognition
    recognition.lang = 'bn-BD'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      const confidence = event.results[0][0].confidence
      setInput(transcript)

      if (event.results[0].isFinal) {
        setIsListening(false)

        // Detect what language the user actually spoke
        // If the transcript contains Bengali script, it's Bangla
        // If it's Roman characters with Banglish patterns, treat as Banglish
        // Otherwise it's English
        const spokenLang = detectLanguageClient(transcript)

        // Update recognition language for next time based on what user spoke
        // This helps improve accuracy for the next recognition session
        try {
          if (spokenLang === 'english') {
            recognition.lang = 'en-US'
          } else {
            recognition.lang = 'bn-BD'
          }
        } catch {
          // Can't change lang while recognition might be active
        }

        // Auto-send after final result using ref
        setTimeout(() => {
          sendMessageRef.current?.(transcript)
        }, 100)
      }
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
  }, [speechSupported])

  const toggleListening = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) return
    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      try {
        // Dynamically set recognition language based on current input pattern
        // If user has been typing in English, start with en-US
        // Otherwise default to bn-BD for Bangla/Banglish
        if (input.trim()) {
          const inputLang = detectLanguageClient(input)
          recognition.lang = inputLang === 'english' ? 'en-US' : 'bn-BD'
        }
        recognition.start()
        setIsListening(true)
      } catch {
        // Already started or not available
        setIsListening(false)
      }
    }
  }, [isListening, input])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    // Stop any ongoing speech
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setMessages([
      {
        role: 'assistant',
        content: KORMOCHARY_GREETING,
        timestamp: Date.now(),
        detectedLang: 'bangla',
      },
    ])
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
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
            {/* Typewriter Message Bubble — desktop only */}
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.8 }}
              className="hidden sm:flex items-center gap-2 bg-background border border-border/60 shadow-lg rounded-2xl px-4 py-2.5 max-w-[260px] cursor-pointer hover:shadow-xl hover:border-[#00A6A6]/50 transition-all group/bubble relative"
              onClick={() => setIsOpen(true)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-snug">
                  {displayedText}
                  {isTyping && (
                    <span className="inline-block w-[2px] h-4 bg-[#00A6A6] ml-0.5 align-middle animate-pulse" />
                  )}
                </p>
              </div>
              {isTyping && (
                <div className="flex items-center gap-[3px] shrink-0">
                  <span className="h-1 w-1 rounded-full bg-[#00A6A6] animate-bounce [animation-delay:0ms]" />
                  <span className="h-1 w-1 rounded-full bg-[#00A6A6] animate-bounce [animation-delay:150ms]" />
                  <span className="h-1 w-1 rounded-full bg-[#00A6A6] animate-bounce [animation-delay:300ms]" />
                </div>
              )}
              {/* Speech bubble arrow */}
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
                bg-gradient-to-br from-teal-600 via-teal-700 to-[#00A6A6]
                dark:from-[#0B1F3A] dark:via-[#0f172a] dark:to-[#00A6A6]
                hover:from-teal-700 hover:via-teal-800 hover:to-[#10b981]
                dark:hover:from-[#0B1F3A] dark:hover:via-[#0f172a] dark:hover:to-[#10b981]
                text-white shadow-lg hover:shadow-2xl
                transition-all active:scale-90 group
                ring-2 ring-[#00A6A6]/20
                touch-manipulation"
              aria-label="Chat with কর্মচারী — AI Assistant"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.9 }}
            >
              {/* Glow animation */}
              <span className="absolute inset-[-4px] rounded-full bg-[#00A6A6]/20 animate-pulse [animation-duration:2s]" />
              <span className="absolute inset-0 rounded-full bg-[#00A6A6]/25 animate-ping [animation-duration:2.5s]" />

              {/* Icon inside the button */}
              <span className="relative z-10 flex items-center justify-center">
                <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 text-white drop-shadow-lg" />
              </span>

              {/* Notification badge */}
              <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-[#F5B301] border-[2.5px] border-background shadow-sm flex items-center justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0B1F3A] animate-pulse" />
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Chat Window ===== */}
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
                inset-x-0 bottom-0 h-[100dvh] rounded-t-2xl
                sm:inset-x-auto sm:bottom-[90px] sm:right-6 sm:w-[400px] sm:h-auto sm:max-h-[600px] sm:rounded-2xl"
            >
              {/* ===== HEADER ===== */}
              <div className="relative bg-gradient-to-r from-teal-600 via-teal-700 to-[#00A6A6] dark:from-[#0B1F3A] dark:via-[#0f172a] dark:to-[#00A6A6] text-white p-3 sm:p-4 flex items-center justify-between shrink-0 overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/5" />
                <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />

                <div className="flex items-center gap-2.5 sm:gap-3 relative z-10">
                  <div className="relative">
                    <AIAvatar size="md" />
                    {/* Green "Online" status indicator dot */}
                    <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-teal-700 dark:ring-[#0B1F3A] shadow-[0_0_6px_rgba(16,185,129,0.6)]">
                      <BadgeCheck className="h-2.5 w-2.5 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm sm:text-base tracking-tight">কর্মচারী</h3>
                      <Badge
                        variant="secondary"
                        className="text-[9px] sm:text-[10px] font-semibold bg-[#F5B301]/20 text-[#F5B301] border-0 rounded-full px-1.5 sm:px-2 py-0 h-4 sm:h-5"
                      >
                        AI Assistant
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                      <p className="text-[10px] sm:text-[11px] text-white/80 dark:text-slate-200 font-medium">অনলাইন — সাহায্য করতে প্রস্তুত</p>
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
              <div className="flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 bg-muted/50 dark:bg-[#0B1F3A]/20 border-b border-border/30 shrink-0">
                {trustIndicators.map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="flex items-center gap-1">
                      <div className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] text-foreground dark:text-[#00A6A6] font-medium">
                        <Icon className="h-2.5 w-2.5" />
                        <span>{item.label}</span>
                      </div>
                      {idx < trustIndicators.length - 1 && (
                        <div className="w-px h-3 bg-border ml-2 sm:ml-3" />
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
                  scrollbarColor: 'rgb(0 166 166 / 0.3) transparent',
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
                        <AIAvatar size="sm" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] sm:max-w-[82%] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 text-[12px] sm:text-[13px] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground dark:bg-gradient-to-br dark:from-[#0B1F3A] dark:to-[#00A6A6] dark:text-white rounded-br-md shadow-md shadow-primary/20 dark:shadow-[#00A6A6]/20'
                          : 'bg-muted/70 dark:bg-muted/50 rounded-bl-md border border-border/30'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <>
                          {/* Text content + Speaker button row */}
                          <div className="flex items-start gap-1.5">
                            <div className="flex-1 whitespace-pre-wrap">
                              {msg.isStreaming && !msg.content ? (
                                // Show typing dots while streaming with no content yet
                                <span className="inline-flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#00A6A6] animate-bounce [animation-delay:0ms]" />
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#00A6A6] animate-bounce [animation-delay:150ms]" />
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#00A6A6] animate-bounce [animation-delay:300ms]" />
                                </span>
                              ) : (
                                formatMessage(msg.content)
                              )}
                              {msg.isStreaming && msg.content && (
                                <span className="inline-block w-[2px] h-3.5 bg-[#00A6A6] ml-0.5 align-middle animate-pulse" />
                              )}
                            </div>
                            {/* Speaker button for TTS */}
                            <div className="shrink-0 mt-0.5">
                              <SpeakerButton
                                text={msg.content}
                                lang={msg.detectedLang || 'bangla'}
                                isStreaming={msg.isStreaming}
                              />
                            </div>
                          </div>

                          {/* Product cards */}
                          {msg.products && msg.products.length > 0 && !msg.isStreaming && (
                            <div className="mt-3 space-y-2">
                              {msg.products.slice(0, 4).map(product => (
                                <ProductCardItem key={product.id} product={product} />
                              ))}
                              {msg.products.length > 4 && (
                                <p className="text-[10px] text-muted-foreground text-center italic">
                                  আরও {msg.products.length - 4}টি প্রোডাক্ট দেখুন...
                                </p>
                              )}
                            </div>
                          )}

                          {/* Suggestions */}
                          {msg.suggestions && msg.suggestions.length > 0 && !msg.isStreaming && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {msg.suggestions.slice(0, 3).map((suggestion, sIdx) => (
                                <button
                                  key={`sug-${sIdx}`}
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className="cursor-pointer text-[10px] sm:text-[11px] px-2.5 py-1 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/15 text-foreground dark:text-[#00A6A6] hover:border-primary/60 transition-all active:scale-95 font-medium"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* WhatsApp button */}
                          {msg.whatsappUrl && !msg.isStreaming && (
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
                        </>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-primary dark:bg-gradient-to-br dark:from-[#0B1F3A] dark:to-[#00A6A6] flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-primary/20 dark:shadow-[#00A6A6]/20">
                        <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Typing indicator — only show when loading and last message isn't streaming */}
                {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-2 sm:gap-2.5 justify-start"
                  >
                    <div className="relative shrink-0">
                      <AIAvatar size="sm" />
                    </div>
                    <div className="bg-muted/70 dark:bg-muted/50 rounded-2xl rounded-bl-md px-4 py-3 border border-border/30">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#00A6A6] animate-bounce [animation-delay:0ms]" />
                        <span className="h-2 w-2 rounded-full bg-[#00A6A6] animate-bounce [animation-delay:150ms]" />
                        <span className="h-2 w-2 rounded-full bg-[#00A6A6] animate-bounce [animation-delay:300ms]" />
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
                      hover:bg-[#00A6A6]/5 dark:hover:bg-[#0B1F3A]/40
                      border border-border/60 hover:border-[#00A6A6]/50 dark:hover:border-[#00A6A6]
                      transition-all active:scale-95 py-1.5 sm:py-2 px-2.5 sm:px-3.5 rounded-full bg-background
                      font-medium text-foreground/80 hover:text-foreground dark:hover:text-[#00A6A6]
                      touch-manipulation"
                    onClick={() => sendMessage(q.action)}
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
                    className="h-10 sm:h-11 text-sm sm:text-base rounded-xl border-border/50 focus-visible:ring-[#00A6A6]/30"
                    disabled={isLoading || cooldown}
                    style={{ fontSize: '16px' }}
                  />

                  {/* Voice Input Button — Dynamic Language STT */}
                  {speechSupported && (
                    <button
                      onClick={toggleListening}
                      className={`relative flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl transition-all active:scale-90 touch-manipulation shrink-0 ${
                        isListening
                          ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border/50'
                      }`}
                      aria-label={isListening ? 'ভয়েস ইনপুট বন্ধ করুন' : 'ভয়েস ইনপুট শুরু করুন'}
                    >
                      {isListening ? (
                        <>
                          {/* Pulsing red ring animation */}
                          <span className="absolute inset-[-3px] rounded-xl bg-red-500/30 animate-ping" />
                          {/* Sound wave animation */}
                          <span className="absolute inset-[-6px] rounded-xl border-2 border-red-400/40 animate-pulse" />
                          <MicOff className="h-4 w-4 sm:h-5 sm:w-5 relative z-10" />
                        </>
                      ) : (
                        <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </button>
                  )}

                  {/* Send button */}
                  <Button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading || cooldown}
                    className="bg-primary hover:bg-primary/90 dark:bg-gradient-to-r dark:from-[#0B1F3A] dark:to-[#00A6A6] dark:hover:from-[#0B1F3A] dark:hover:to-[#10b981] text-primary-foreground h-10 w-10 sm:h-11 sm:w-11 rounded-xl shadow-md shadow-primary/20 dark:shadow-[#00A6A6]/20 shrink-0 touch-manipulation"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Voice status indicator */}
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="flex items-center justify-center gap-2 mt-2 text-xs text-red-500 font-medium"
                  >
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    শুনছি... বাংলা বা English এ কথা বলুন
                    <span className="flex items-center gap-[2px]">
                      <span className="h-3 w-0.5 bg-red-400 rounded-full animate-pulse [animation-delay:0ms]" />
                      <span className="h-4 w-0.5 bg-red-400 rounded-full animate-pulse [animation-delay:150ms]" />
                      <span className="h-5 w-0.5 bg-red-500 rounded-full animate-pulse [animation-delay:300ms]" />
                      <span className="h-4 w-0.5 bg-red-400 rounded-full animate-pulse [animation-delay:450ms]" />
                      <span className="h-3 w-0.5 bg-red-400 rounded-full animate-pulse [animation-delay:600ms]" />
                    </span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
