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
  Phone,
  PhoneOff,
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
  { label: '📦 কিনতে চাই', action: 'কীভাবে অর্ডার করবো?' },
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

// Chrome loads voices asynchronously — this helper ensures they're available
function getVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve([])
      return
    }
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      resolve(voices)
      return
    }
    // Voices not loaded yet — wait for voiceschanged event
    const onVoicesChanged = () => {
      const v = window.speechSynthesis.getVoices()
      if (v.length > 0) {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
        resolve(v)
      }
    }
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged)
    // Safety: resolve after 2s even if no voices loaded
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
      resolve(window.speechSynthesis.getVoices())
    }, 2000)
  })
}

// Chrome workaround: speechSynthesis pauses after ~15s of inactivity.
// This keeps it alive by calling resume() periodically while speaking.
let chromeKeepAliveInterval: ReturnType<typeof setInterval> | null = null
function startChromeKeepAlive() {
  if (chromeKeepAliveInterval) return
  chromeKeepAliveInterval = setInterval(() => {
    if (window.speechSynthesis?.speaking) {
      window.speechSynthesis.resume()
    } else {
      stopChromeKeepAlive()
    }
  }, 10000)
}
function stopChromeKeepAlive() {
  if (chromeKeepAliveInterval) {
    clearInterval(chromeKeepAliveInterval)
    chromeKeepAliveInterval = null
  }
}

// ─── Server TTS (ElevenLabs/OpenAI) → Browser TTS (fallback) ─────────────────

let currentAudio: HTMLAudioElement | null = null

async function speakWithServerTTS(text: string, lang: DetectedLang, onEnd?: () => void): Promise<boolean> {
  // Clean text for TTS on the client side too (for the request body)
  const cleanText = text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1')
    .replace(/[•\-]\s/g, '')
    .replace(/\d+[.)]\s/g, '')
    .replace(/৳/g, 'টাকা')
    .replace(/BDT/gi, 'টাকা')
    .replace(/\bbKash\b/gi, 'বিকাশ')
    .replace(/\bNagad\b/gi, 'নগদ')
    .replace(/\bWhatsApp\b/gi, 'হোয়াটসঅ্যাপ')
    .replace(/↵/g, ' ')
    .replace(/\n/g, ' ')
    .trim()

  if (!cleanText) { onEnd?.(); return true }

  try {
    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause()
      currentAudio = null
    }

    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText, lang }),
    })

    // If server TTS returns 503 with fallback flag, use browser TTS
    if (res.status === 503) {
      console.warn('Server TTS unavailable (ElevenLabs + OpenAI failed), falling back to browser TTS')
      return false
    }

    if (!res.ok) {
      console.warn('Server TTS failed, falling back to browser TTS')
      return false
    }

    const audioBlob = await res.blob()
    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)
    currentAudio = audio

    return new Promise<boolean>((resolve) => {
      const safetyTimer = setTimeout(() => {
        audio.pause()
        currentAudio = null
        URL.revokeObjectURL(audioUrl)
        onEnd?.()
        resolve(true)
      }, 45000)

      audio.onended = () => {
        clearTimeout(safetyTimer)
        currentAudio = null
        URL.revokeObjectURL(audioUrl)
        onEnd?.()
        resolve(true)
      }

      audio.onerror = () => {
        clearTimeout(safetyTimer)
        currentAudio = null
        URL.revokeObjectURL(audioUrl)
        console.warn('Audio playback error, falling back to browser TTS')
        resolve(false)
      }

      audio.play().catch(() => {
        clearTimeout(safetyTimer)
        currentAudio = null
        URL.revokeObjectURL(audioUrl)
        resolve(false)
      })
    })
  } catch {
    console.warn('Server TTS error, falling back to browser TTS')
    return false
  }
}

function stopServerAudio() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
}

async function speak(text: string, lang: DetectedLang, onEnd?: () => void): Promise<SpeechSynthesisUtterance | null> {
  if (typeof window === 'undefined') return null

  // Stop any existing audio
  stopServerAudio()
  if (window.speechSynthesis) window.speechSynthesis.cancel()
  stopChromeKeepAlive()

  // Try Server TTS first (ElevenLabs → OpenAI → Browser fallback)
  const serverSuccess = await speakWithServerTTS(text, lang, onEnd)
  if (serverSuccess) return null // Server TTS handled it

  // Fallback to browser TTS
  if (!window.speechSynthesis) { onEnd?.(); return null }

  // Clean text for speech
  const cleanText = text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1')
    .replace(/[•\-]\s/g, '')
    .replace(/\d+[.)]\s/g, '')
    .replace(/৳/g, 'টাকা')
    .replace(/BDT/gi, 'টাকা')
    .replace(/\bbKash\b/gi, 'বিকাশ')
    .replace(/\bNagad\b/gi, 'নগদ')
    .replace(/\bWhatsApp\b/gi, 'হোয়াটসঅ্যাপ')
    .replace(/↵/g, ' ')
    .replace(/\n/g, ' ')
    .trim()

  if (!cleanText) { onEnd?.(); return null }

  const voices = await getVoicesAsync()
  const utterance = new SpeechSynthesisUtterance(cleanText)

  if (lang === 'bangla' || lang === 'banglish') {
    const bnVoice = voices.find(v => v.lang === 'bn-BD') || voices.find(v => v.lang === 'bn-IN')
    if (bnVoice) {
      utterance.voice = bnVoice
      utterance.lang = bnVoice.lang
    } else {
      const hiVoice = voices.find(v => v.lang === 'hi-IN')
      if (hiVoice) { utterance.voice = hiVoice; utterance.lang = 'hi-IN' }
      else { utterance.lang = 'bn-BD' }
    }
  } else {
    utterance.lang = 'en-US'
    const enVoice = voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('female'))
      || voices.find(v => v.lang === 'en-US')
    if (enVoice) utterance.voice = enVoice
  }

  utterance.rate = 0.9
  utterance.pitch = 1.15
  utterance.volume = 1.0

  startChromeKeepAlive()

  const safetyTimer = setTimeout(() => {
    if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel()
    stopChromeKeepAlive()
    onEnd?.()
  }, 45000)

  const wrappedOnEnd = () => {
    clearTimeout(safetyTimer)
    stopChromeKeepAlive()
    onEnd?.()
  }

  utterance.onend = wrappedOnEnd
  utterance.onerror = () => wrappedOnEnd()

  await new Promise(resolve => setTimeout(resolve, 100))
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
        <span className="mt-[7px] shrink-0 h-1.5 w-1.5 rounded-full bg-primary" />
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
        <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold leading-none mt-px">
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
        <strong key={`b-${keyIdx++}`} className="font-semibold text-teal-700">
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
          className="text-teal-600 underline underline-offset-2 hover:text-teal-800 transition-colors"
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

// ─── Product Card Component (NO Order Button — conversational only) ──────────

function ProductCardItem({ product }: { product: ProductCard }) {
  const cheapestPrice = getCheapestPrice(product)
  const initial = product.name.charAt(0).toUpperCase()

  return (
    <div className="rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 bg-background border border-border/40 overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        {/* Image or gradient placeholder */}
        <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-[#00A6A6] to-[#0B1F3A] flex items-center justify-center">
          {product.image ? (
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <span className="text-white font-bold text-lg">{initial}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
          <p className="text-xs text-muted-foreground">{product.category.name}</p>
        </div>
        <div className="bg-gradient-to-r from-[#00A6A6] to-emerald-500 text-white px-2.5 py-1 rounded-lg text-sm font-bold shrink-0">
          ৳{cheapestPrice}
        </div>
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
        src="/assistant-avatar.jpg"
        alt="কর্মচারী"
        className="h-full w-full object-cover hidden"
        loading="lazy"
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

  const handleSpeak = useCallback(() => {
    if (isSpeaking) {
      stopServerAudio()
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      setIsSpeaking(false)
      return
    }

    if (isStreaming || !text) return

    setIsSpeaking(true)
    speak(text, lang, () => {
      setIsSpeaking(false)
    })

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
  // Gemini-style voice conversation mode
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const sendMessageRef = useRef<(msg?: string) => Promise<void>>(undefined)
  // Refs to avoid stale closures in async voice loop
  const isVoiceModeRef = useRef(false)
  const isAISpeakingRef = useRef(false)
  const messagesRef = useRef(messages)
  const isLoadingRef = useRef(false)

  // Keep refs in sync with state
  useEffect(() => { isVoiceModeRef.current = isVoiceMode }, [isVoiceMode])
  useEffect(() => { isAISpeakingRef.current = isAISpeaking }, [isAISpeaking])
  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { isLoadingRef.current = isLoading }, [isLoading])

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
    if (isOpen && inputRef.current && !isVoiceMode) {
      setTimeout(() => inputRef.current?.focus(), 350)
    }
  }, [isOpen, isVoiceMode])

  // ── Send message handler (with SSE streaming) ──
  const sendMessage = useCallback(async (overrideMessage?: string) => {
    const trimmed = (overrideMessage || input).trim()
    if (!trimmed || isLoadingRef.current || cooldown) return

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
      // Use messagesRef to avoid stale closure and unnecessary re-creates
      const currentMessages = messagesRef.current
      const history = currentMessages.slice(-10).map(m => ({
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

      // NOTE: Voice mode TTS is now handled by the useEffect below,
      // which watches for the last assistant message's isStreaming → false transition.
      // This avoids the stale closure problem with the old setTimeout approach.
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
  }, [input, cooldown])

  // ── Keep sendMessage ref updated for voice input ──
  useEffect(() => {
    sendMessageRef.current = sendMessage
  }, [sendMessage])

  // ── Gemini-style Voice Loop: TTS after AI finishes, then auto-listen ──
  // This useEffect watches for the last assistant message's isStreaming
  // transitioning to false, and triggers TTS → auto-listen in voice mode.
  // Using refs avoids stale closure issues.
  const voiceLoopTriggeredRef = useRef<number>(0) // timestamp of last triggered TTS
  useEffect(() => {
    if (!isVoiceModeRef.current || !speechSupported) return

    const lastMsg = messages[messages.length - 1]
    if (!lastMsg || lastMsg.role !== 'assistant' || lastMsg.isStreaming || !lastMsg.content) return

    // Avoid re-triggering for the same message
    if (voiceLoopTriggeredRef.current === lastMsg.timestamp) return
    voiceLoopTriggeredRef.current = lastMsg.timestamp

    // Skip speaking the initial greeting when first entering voice mode
    // (user hasn't asked anything yet)
    const isInitialGreeting = messages.length <= 1 && lastMsg.content === KORMOCHARY_GREETING
    if (isInitialGreeting) {
      // Just start listening immediately
      const rec = recognitionRef.current
      if (rec && !isAISpeakingRef.current && !isLoadingRef.current) {
        setTimeout(() => {
          try {
            rec.start()
            setIsListening(true)
          } catch {
            // Recognition may already be started
          }
        }, 300)
      }
      return
    }

    // Small delay to ensure the state has settled after isStreaming → false
    const timer = setTimeout(() => {
      if (!isVoiceModeRef.current) return // Voice mode was disabled during delay

      setIsAISpeaking(true)
      const lang = lastMsg.detectedLang || 'bangla'

      speak(lastMsg.content, lang, () => {
        setIsAISpeaking(false)
        // After AI finishes speaking, auto-start listening again if still in voice mode
        if (!isVoiceModeRef.current) return
        const rec = recognitionRef.current
        if (rec) {
          // Small delay before starting recognition again to avoid race condition
          setTimeout(() => {
            if (!isVoiceModeRef.current || isAISpeakingRef.current || isLoadingRef.current) return
            try {
              rec.start()
              setIsListening(true)
            } catch {
              // Recognition may already be started or not available
            }
          }, 500)
        }
      })
    }, 500)

    return () => clearTimeout(timer)
  }, [messages, speechSupported])

  // ── Initialize Speech Recognition (Dynamic Language STT) ──
  useEffect(() => {
    if (!speechSupported) return
    const SR = (window as unknown as Record<string, unknown>)['SpeechRecognition'] ||
      (window as unknown as Record<string, unknown>)['webkitSpeechRecognition']
    if (!SR) return

    const recognition = new (SR as new () => SpeechRecognition)()
    recognition.lang = 'bn-BD'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)

      if (event.results[0].isFinal) {
        setIsListening(false)

        const spokenLang = detectLanguageClient(transcript)

        // Update recognition language for next session
        try {
          if (spokenLang === 'english') {
            recognition.lang = 'en-US'
          } else {
            recognition.lang = 'bn-BD'
          }
        } catch {
          // Can't change lang while recognition might be active
        }

        // Auto-send after final result (in both voice mode and regular mic)
        setTimeout(() => {
          sendMessageRef.current?.(transcript)
        }, 150)
      }
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      // In voice mode, if recognition errors (e.g., no-speech), try to restart
      // Common errors: no-speech (user was quiet), aborted (manual stop), not-allowed (mic denied)
      if (isVoiceModeRef.current && event.error !== 'aborted' && event.error !== 'not-allowed') {
        setTimeout(() => {
          if (isVoiceModeRef.current && !isAISpeakingRef.current && !isLoadingRef.current) {
            try {
              recognition.start()
              setIsListening(true)
            } catch {
              // Recognition may already be started
            }
          }
        }, 800) // Longer delay to avoid rapid restart loops
      }
      if (event.error === 'not-allowed') {
        console.warn('Microphone access denied. Voice mode requires microphone permission.')
        // Auto-exit voice mode if mic is denied
        setIsVoiceMode(false)
        isVoiceModeRef.current = false
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      // In voice mode, auto-restart listening after recognition ends naturally
      // (but only if AI is not currently speaking/loading)
      if (isVoiceModeRef.current && !isAISpeakingRef.current && !isLoadingRef.current) {
        setTimeout(() => {
          if (isVoiceModeRef.current && !isAISpeakingRef.current && !isLoadingRef.current) {
            try {
              recognition.start()
              setIsListening(true)
            } catch {
              // Recognition may already be started
            }
          }
        }, 300)
      }
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
        if (input.trim()) {
          const inputLang = detectLanguageClient(input)
          recognition.lang = inputLang === 'english' ? 'en-US' : 'bn-BD'
        }
        recognition.start()
        setIsListening(true)
      } catch {
        setIsListening(false)
      }
    }
  }, [isListening, input])

  // ── Gemini-style Voice Mode Toggle ──
  const toggleVoiceMode = useCallback(() => {
    if (isVoiceMode) {
      // Exit voice mode
      setIsVoiceMode(false)
      isVoiceModeRef.current = false
      setIsAISpeaking(false)
      isAISpeakingRef.current = false
      stopServerAudio()
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop()
        setIsListening(false)
      }
    } else {
      // Enter voice mode
      setIsVoiceMode(true)
      isVoiceModeRef.current = true
      // Start listening immediately
      const recognition = recognitionRef.current
      if (recognition) {
        try {
          recognition.start()
          setIsListening(true)
        } catch {
          setIsListening(false)
        }
      }
    }
  }, [isVoiceMode, isListening])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = useCallback(() => {
    stopServerAudio()
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setIsVoiceMode(false)
    isVoiceModeRef.current = false
    setIsAISpeaking(false)
    isAISpeakingRef.current = false
    setMessages([
      {
        role: 'assistant',
        content: KORMOCHARY_GREETING,
        timestamp: Date.now(),
        detectedLang: 'bangla',
      },
    ])
  }, [])

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  // ── Manage data-chat-open on body for CSS scroll lock ──
  // Set synchronously via useLayoutEffect to avoid the timing gap where the
  // chat overlay is visible but scroll isn't locked yet (or vice versa).
  // useLayoutEffect runs synchronously after DOM mutations, before the browser
  // paints, so there's no visual flicker.
  useEffect(() => {
    if (isOpen) {
      document.body.setAttribute('data-chat-open', 'true')
    } else {
      document.body.removeAttribute('data-chat-open')
      // Also force-remove any stale overflow that might have been set by the
      // chat's scroll lock mechanism (belt-and-suspenders with CSS :has() rules)
      requestAnimationFrame(() => {
        const hasOpenSheet = document.querySelector('[data-state="open"][data-slot="sheet-content"]')
        const hasOpenDialog = document.querySelector('[data-state="open"][data-slot="dialog-overlay"]')
        if (!hasOpenSheet && !hasOpenDialog) {
          document.body.style.removeProperty('overflow')
          document.body.style.removeProperty('overflow-y')
          document.documentElement.style.removeProperty('overflow')
          document.documentElement.style.removeProperty('overflow-y')
        }
      })
    }
    return () => {
      document.body.removeAttribute('data-chat-open')
    }
  }, [isOpen])

  // ── Close chat helper: clean up voice mode ──
  const closeChat = useCallback(() => {
    setIsOpen(false)
    setIsVoiceMode(false)
    isVoiceModeRef.current = false
    setIsAISpeaking(false)
    isAISpeakingRef.current = false
    stopServerAudio()
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    // data-chat-open is removed by the useEffect above when isOpen becomes false
  }, [])

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

              {/* Avatar inside the button */}
              <span className="relative z-10 flex items-center justify-center">
                <img
                  src="/assistant-avatar.jpg"
                  alt="কর্মচারী"
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover hidden"
                  loading="lazy"
                  onLoad={(e) => {
                    (e.target as HTMLImageElement).classList.remove('hidden')
                    const fallback = (e.target as HTMLImageElement).nextElementSibling
                    if (fallback) fallback.classList.add('hidden')
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).classList.add('hidden')
                    const fallback = (e.target as HTMLImageElement).nextElementSibling
                    if (fallback) fallback.classList.remove('hidden')
                  }}
                />
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
              onClick={closeChat}
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
                      {isVoiceMode ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse shadow-[0_0_6px_rgba(248,113,113,0.6)]" />
                          <p className="text-[10px] sm:text-[11px] text-white/80 font-medium">
                            {isAISpeaking ? 'বলছি...' : isListening ? 'শুনছি...' : 'ভয়েস মোড'}
                          </p>
                        </>
                      ) : (
                        <>
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                          <p className="text-[10px] sm:text-[11px] text-white/80 font-medium">অনলাইন — সাহায্য করতে প্রস্তুত</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 relative z-10">
                  {/* Voice Mode Toggle */}
                  {speechSupported && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`text-white hover:bg-white/15 h-7 w-7 sm:h-8 sm:w-8 rounded-lg transition-all ${
                        isVoiceMode ? 'bg-red-500/30 hover:bg-red-500/40' : ''
                      }`}
                      onClick={toggleVoiceMode}
                      aria-label={isVoiceMode ? 'ভয়েস মোড বন্ধ' : 'ভয়েস মোড চালু'}
                      title={isVoiceMode ? 'ভয়েস মোড বন্ধ করুন' : 'Gemini-style ভয়েস চ্যাট'}
                    >
                      {isVoiceMode ? <PhoneOff className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
                    </Button>
                  )}
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
                    onClick={closeChat}
                    aria-label="Close chat"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* ===== TRUST INDICATORS BAR ===== */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 bg-muted/70 border-b border-border/30 shrink-0">
                {trustIndicators.map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="flex items-center gap-1">
                      <div className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] text-teal-700 font-medium">
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
                  /* NOTE: WebkitOverflowScrolling removed — deprecated since iOS 13.
                     Modern Safari uses momentum scrolling by default. */
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
                          ? 'bg-teal-600 text-white rounded-br-md shadow-md shadow-teal-600/20'
                          : 'bg-muted dark:bg-muted/50 rounded-bl-md border border-border/30 text-foreground'
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

                          {/* Product cards — NO order button, just info display */}
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
                                  className="cursor-pointer text-[10px] sm:text-[11px] px-2.5 py-1 rounded-full border border-teal-600/30 bg-teal-50 hover:bg-teal-100 text-teal-800 hover:border-teal-600/60 transition-all active:scale-95 font-medium"
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
                              WhatsApp এ যোগাযোগ
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-teal-600 flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-teal-600/20">
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
                    <div className="bg-muted dark:bg-muted/50 rounded-2xl rounded-bl-md px-4 py-3 border border-border/30">
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
                      hover:bg-teal-600/5
                      border border-border/60 hover:border-teal-600/50
                      transition-all active:scale-95 py-1.5 sm:py-2 px-2.5 sm:px-3.5 rounded-full bg-background
                      font-medium text-foreground/80 hover:text-foreground
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
                    className="h-10 sm:h-11 text-sm sm:text-base rounded-xl border-border/50 focus-visible:ring-[#00A6A6]/30 text-foreground"
                    disabled={isLoading || cooldown || isVoiceMode}
                    style={{ fontSize: '16px' }}
                  />

                  {/* Voice Input Button — Dynamic Language STT */}
                  {speechSupported && !isVoiceMode && (
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
                          <span className="absolute inset-[-3px] rounded-xl bg-red-500/30 animate-ping" />
                          <span className="absolute inset-[-6px] rounded-xl border-2 border-red-400/40 animate-pulse" />
                          <MicOff className="h-4 w-4 sm:h-5 sm:w-5 relative z-10" />
                        </>
                      ) : (
                        <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </button>
                  )}

                  {/* Voice Mode — Gemini-style conversation button */}
                  {speechSupported && isVoiceMode && (
                    <button
                      onClick={toggleListening}
                      disabled={isAISpeaking}
                      className={`relative flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl transition-all active:scale-90 touch-manipulation shrink-0 ${
                        isListening
                          ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                          : isAISpeaking
                          ? 'bg-[#00A6A6] text-white shadow-lg shadow-[#00A6A6]/30 animate-pulse'
                          : 'bg-[#00A6A6] hover:bg-[#00A6A6]/80 text-white shadow-lg shadow-[#00A6A6]/30'
                      }`}
                      aria-label={isListening ? 'শুনছি...' : 'কথা বলুন'}
                    >
                      {isListening ? (
                        <>
                          <span className="absolute inset-[-3px] rounded-xl bg-red-500/30 animate-ping" />
                          <MicOff className="h-4 w-4 sm:h-5 sm:w-5 relative z-10" />
                        </>
                      ) : isAISpeaking ? (
                        <>
                          <span className="absolute inset-[-3px] rounded-xl bg-[#00A6A6]/30 animate-ping" />
                          <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 relative z-10" />
                        </>
                      ) : (
                        <>
                          <span className="absolute inset-[-3px] rounded-xl bg-[#00A6A6]/20 animate-pulse" />
                          <Mic className="h-4 w-4 sm:h-5 sm:w-5 relative z-10" />
                        </>
                      )}
                    </button>
                  )}

                  {/* Send button — hidden in voice mode */}
                  {!isVoiceMode && (
                    <Button
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || isLoading || cooldown}
                      className="bg-teal-600 hover:bg-teal-700 text-white h-10 w-10 sm:h-11 sm:w-11 rounded-xl shadow-md shadow-teal-600/20 shrink-0 touch-manipulation"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>

                {/* Voice status indicator */}
                {isListening && !isVoiceMode && (
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

                {/* Voice mode status indicator */}
                {isVoiceMode && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 mt-2 text-xs font-medium"
                  >
                    {isAISpeaking ? (
                      <span className="text-[#00A6A6] flex items-center gap-1.5">
                        <Volume2 className="h-3.5 w-3.5" />
                        বলছি...
                      </span>
                    ) : isListening ? (
                      <span className="text-red-500 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        শুনছি... কথা বলুন
                        <span className="flex items-center gap-[2px]">
                          <span className="h-3 w-0.5 bg-red-400 rounded-full animate-pulse [animation-delay:0ms]" />
                          <span className="h-4 w-0.5 bg-red-400 rounded-full animate-pulse [animation-delay:150ms]" />
                          <span className="h-5 w-0.5 bg-red-500 rounded-full animate-pulse [animation-delay:300ms]" />
                          <span className="h-4 w-0.5 bg-red-400 rounded-full animate-pulse [animation-delay:450ms]" />
                          <span className="h-3 w-0.5 bg-red-400 rounded-full animate-pulse [animation-delay:600ms]" />
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        ভয়েস মোড — মাইক বাটনে চাপুন
                      </span>
                    )}
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
