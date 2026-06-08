'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { useAppStore } from '@/lib/store'
// lockScroll/unlockScroll REMOVED — was causing scroll to get permanently stuck on mobile
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertTriangle,
  Lock,
  Search,
  Puzzle,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'

/* ────────────────────────────────────────────────
   Floating sparkle particles for the reveal
   ──────────────────────────────────────────────── */
function SparkleParticles({ active }: { active: boolean }) {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    angle: (360 / 18) * i,
    distance: 40 + Math.random() * 50,
    size: 3 + Math.random() * 5,
    delay: Math.random() * 0.3,
    duration: 0.6 + Math.random() * 0.5,
  }))

  return (
    <AnimatePresence>
      {active && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {particles.map((p) => {
            const rad = (p.angle * Math.PI) / 180
            const x = Math.cos(rad) * p.distance
            const y = Math.sin(rad) * p.distance
            return (
              <motion.div
                key={p.id}
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  background: `radial-gradient(circle, #fbbf24, #f59e0b)`,
                  boxShadow: '0 0 6px 2px rgba(251,191,36,0.5)',
                }}
                initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], x, y, scale: [0, 1.2, 0] }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: 'easeOut',
                }}
              />
            )
          })}
        </div>
      )}
    </AnimatePresence>
  )
}

/* ────────────────────────────────────────────────
   The "Secret Code" hide-and-seek PIN puzzle
   ──────────────────────────────────────────────── */
function SecretCodePuzzle({
  onReveal,
  wrongAttempt,
}: {
  onReveal: () => void
  wrongAttempt: number
}) {
  const [locks, setLocks] = useState([false, false, false])
  const [revealed, setRevealed] = useState(false)
  const shakeControls = useAnimation()

  // Shake on wrong attempt (using animation controls, not setState)
  useEffect(() => {
    if (wrongAttempt > 0) {
      shakeControls.start({
        x: [0, -6, 6, -4, 4, -2, 2, 0],
        transition: { duration: 0.5, ease: 'easeInOut' },
      })
    }
  }, [wrongAttempt, shakeControls])

  const shaking = wrongAttempt > 0

  const handleLockClick = (index: number) => {
    if (revealed) return
    setLocks((prev) => {
      const next = [...prev]
      next[index] = true
      // Check if all three are now activated
      if (next.every(Boolean)) {
        // Short delay before reveal for suspense
        setTimeout(() => {
          setRevealed(true)
          onReveal()
        }, 400)
      }
      return next
    })
  }

  const lockConfigs = [
    {
      emoji: '🔍',
      label: 'খুঁজুন',
      sublabel: 'Search',
      color: 'blue',
      glowColor: 'rgba(37,99,235,0.5)',
      bgActive: 'bg-[#10b981]',
      borderActive: 'border-[#34d399]',
      shadowActive: 'shadow-blue-600/50',
      icon: Search,
    },
    {
      emoji: '🧩',
      label: 'সংযোগ',
      sublabel: 'Connect',
      color: 'amber',
      glowColor: 'rgba(245,158,11,0.5)',
      bgActive: 'bg-amber-500',
      borderActive: 'border-amber-400',
      shadowActive: 'shadow-amber-500/50',
      icon: Puzzle,
    },
    {
      emoji: '✨',
      label: 'উন্মোচন',
      sublabel: 'Reveal',
      color: 'purple',
      glowColor: 'rgba(168,85,247,0.5)',
      bgActive: 'bg-purple-500',
      borderActive: 'border-purple-400',
      shadowActive: 'shadow-purple-500/50',
      icon: Sparkles,
    },
  ]

  return (
    <motion.div
      className="relative mt-4 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 overflow-hidden"
      animate={shakeControls}
    >
      {/* Subtle animated background shimmer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -inset-1 opacity-[0.03]"
          style={{
            background:
              'radial-gradient(ellipse at 30% 50%, rgba(16,185,129,0.3), transparent 50%), radial-gradient(ellipse at 70% 50%, rgba(168,85,247,0.3), transparent 50%)',
          }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.03, 0.06, 0.03] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 p-4">
        {/* Header */}
        <motion.div
          className="text-center mb-3"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-1.5">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              🔮
            </motion.span>
            গোপন সংকেত
            <motion.span
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: 0.5 }}
            >
              🔮
            </motion.span>
          </h4>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
            Unlock the secret to find your code
          </p>
        </motion.div>

        {/* The Three Locks */}
        <AnimatePresence mode="wait">
          {!revealed ? (
            <motion.div
              key="locks"
              className="grid grid-cols-3 gap-2.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              {lockConfigs.map((lock, i) => {
                const isActive = locks[i]
                return (
                  <motion.button
                    key={i}
                    type="button"
                    onClick={() => handleLockClick(i)}
                    disabled={revealed}
                    className={`
                      relative flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 
                      transition-colors duration-300 cursor-pointer select-none
                      min-h-[72px] min-w-[72px]
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
                      ${
                        isActive
                          ? `${lock.borderActive} ${lock.shadowActive} shadow-lg`
                          : shaking
                            ? 'border-red-400/60 bg-red-50 dark:bg-red-950/30'
                            : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }
                    `}
                    whileTap={{ scale: 0.9 }}
                    whileHover={!isActive ? { scale: 1.05, y: -2 } : {}}
                    animate={
                      isActive
                        ? {
                            scale: [1, 1.15, 1],
                            boxShadow: [
                              `0 0 0px ${lock.glowColor}`,
                              `0 0 20px ${lock.glowColor}`,
                              `0 0 10px ${lock.glowColor}`,
                            ],
                          }
                        : {}
                    }
                    transition={
                      isActive
                        ? { duration: 0.5, ease: 'easeOut' }
                        : { type: 'spring', stiffness: 400, damping: 17 }
                    }
                    aria-label={`${lock.label} - ${lock.sublabel}`}
                  >
                    {/* Active glow ring */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-lg"
                        style={{
                          boxShadow: `0 0 15px ${lock.glowColor}, inset 0 0 15px ${lock.glowColor.replace('0.5', '0.1')}`,
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}

                    <motion.span
                      className="text-xl relative z-10"
                      animate={isActive ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 0.4 }}
                    >
                      {lock.emoji}
                    </motion.span>

                    <div className="text-center relative z-10">
                      <span
                        className={`block text-[11px] font-semibold leading-tight ${
                          isActive
                            ? lock.color === 'blue'
                              ? 'text-[#10b981]'
                              : lock.color === 'amber'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-purple-600 dark:text-purple-400'
                            : shaking
                              ? 'text-red-400'
                              : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        {lock.label}
                      </span>
                      <span className="block text-[9px] text-zinc-400 dark:text-zinc-500 leading-tight">
                        {lock.sublabel}
                      </span>
                    </div>

                    {/* Lock/unlock icon */}
                    <motion.div
                      className="absolute top-1.5 right-1.5"
                      initial={{ opacity: 0.4 }}
                      animate={{ opacity: isActive ? 0 : 0.4 }}
                    >
                      <Lock
                        className={`h-3 w-3 ${isActive ? 'text-[#10b981]' : 'text-zinc-400 dark:text-zinc-600'}`}
                      />
                    </motion.div>
                  </motion.button>
                )
              })}
            </motion.div>
          ) : (
            /* ─── PIN REVEAL ─── */
            <motion.div
              key="reveal"
              className="relative flex flex-col items-center py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Expanding glow */}
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{
                  background:
                    'radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />

              {/* The digits */}
              <div className="relative flex items-center justify-center gap-5 mb-3">
                <SparkleParticles active={revealed} />

                {/* Digit 6 — flies from left */}
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, x: -120, rotate: -180, scale: 0.3 }}
                  animate={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                    delay: 0.1,
                  }}
                >
                  <motion.div
                    className="flex items-center justify-center w-14 h-16 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/60 dark:to-amber-800/40 border-2 border-amber-300 dark:border-amber-600"
                    style={{
                      boxShadow:
                        '0 0 20px rgba(251,191,36,0.3), 0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(251,191,36,0.3), 0 4px 12px rgba(0,0,0,0.1)',
                        '0 0 30px rgba(251,191,36,0.5), 0 4px 12px rgba(0,0,0,0.1)',
                        '0 0 20px rgba(251,191,36,0.3), 0 4px 12px rgba(0,0,0,0.1)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <span className="text-3xl font-bold font-mono text-amber-700 dark:text-amber-300 select-none">
                      6
                    </span>
                  </motion.div>
                </motion.div>

                {/* Digit 9 — flies from right */}
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, x: 120, rotate: 180, scale: 0.3 }}
                  animate={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2,
                  }}
                >
                  <motion.div
                    className="flex items-center justify-center w-14 h-16 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/60 dark:to-amber-800/40 border-2 border-amber-300 dark:border-amber-600"
                    style={{
                      boxShadow:
                        '0 0 20px rgba(251,191,36,0.3), 0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(251,191,36,0.3), 0 4px 12px rgba(0,0,0,0.1)',
                        '0 0 30px rgba(251,191,36,0.5), 0 4px 12px rgba(0,0,0,0.1)',
                        '0 0 20px rgba(251,191,36,0.3), 0 4px 12px rgba(0,0,0,0.1)',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 0.5,
                    }}
                  >
                    <span className="text-3xl font-bold font-mono text-amber-700 dark:text-amber-300 select-none">
                      9
                    </span>
                  </motion.div>
                </motion.div>
              </div>

              {/* Celebration text */}
              <motion.div
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-700/30"
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                  আপনার PIN:
                </span>
                <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400 tracking-widest">
                  6 9
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick hint for impatient users */}
        <motion.p
          className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          💡 ধীরে ধীরে বা দ্রুত — আপনার পছন্দ!
        </motion.p>
      </div>
    </motion.div>
  )
}

/* ────────────────────────────────────────────────
   Confetti burst for success step
   ──────────────────────────────────────────────── */
function ConfettiBurst({ active }: { active: boolean }) {
  const confetti = Array.from({ length: 24 }, (_, i) => {
    const colors = [
      '#10b981',
      '#f59e0b',
      '#8b5cf6',
      '#ec4899',
      '#06b6d4',
      '#f97316',
    ]
    return {
      id: i,
      color: colors[i % colors.length],
      angle: (360 / 24) * i + Math.random() * 15,
      distance: 50 + Math.random() * 80,
      size: 4 + Math.random() * 6,
      delay: Math.random() * 0.2,
      rotation: Math.random() * 720 - 360,
      isCircle: Math.random() > 0.5,
    }
  })

  return (
    <AnimatePresence>
      {active && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {confetti.map((c) => {
            const rad = (c.angle * Math.PI) / 180
            const x = Math.cos(rad) * c.distance
            const y = Math.sin(rad) * c.distance
            return (
              <motion.div
                key={c.id}
                className="absolute left-1/2 top-1/2"
                style={{
                  width: c.size,
                  height: c.isCircle ? c.size : c.size * 0.5,
                  borderRadius: c.isCircle ? '50%' : '2px',
                  background: c.color,
                }}
                initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
                animate={{
                  opacity: [1, 1, 0],
                  x,
                  y: y - 20,
                  rotate: c.rotation,
                  scale: [1, 1.2, 0],
                }}
                transition={{
                  duration: 1.2,
                  delay: c.delay,
                  ease: 'easeOut',
                }}
              />
            )
          })}
        </div>
      )}
    </AnimatePresence>
  )
}

/* ────────────────────────────────────────────────
   Main AgeGate component
   ──────────────────────────────────────────────── */
export function AgeGate() {
  const ageGateOpen = useAppStore((s) => s.ageGateOpen)
  const setAgeVerified = useAppStore((s) => s.setAgeVerified)
  const setAgeGateOpen = useAppStore((s) => s.setAgeGateOpen)

  const [step, setStep] = useState<'age' | 'pin' | 'success'>('age')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [wrongAttempt, setWrongAttempt] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

  // NOTE: No manual scroll lock. Dialog modal={false} + overlay prevents background interaction.
  // Previous lockScroll/unlockScroll caused body.style.overflow='hidden' to get stuck permanently.

  const handleAgeConfirm = useCallback(() => {
    setStep('pin')
    setPin('')
    setError('')
    setWrongAttempt(0)
  }, [])

  const handlePinSubmit = useCallback(() => {
    if (pin === '69') {
      setAgeVerified(true)
      setStep('success')
      setShowConfetti(true)
      setPin('')
      setError('')

      setTimeout(() => {
        setAgeGateOpen(false)
        setTimeout(() => {
          setStep('age')
          setShowConfetti(false)
        }, 300)
      }, 1200)
    } else {
      setError('ভুল PIN। আবার চেষ্টা করুন / Wrong PIN. Try again.')
      setWrongAttempt((w) => w + 1)
    }
  }, [pin, setAgeVerified, setAgeGateOpen])

  const handleCancel = useCallback(() => {
    setAgeGateOpen(false)
    setStep('age')
    setPin('')
    setError('')
    setWrongAttempt(0)
    setShowConfetti(false)
  }, [setAgeGateOpen])

  return (
    <Dialog
      modal={false}
      open={ageGateOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleCancel()
          // NOTE: With modal={false}, Radix doesn't apply RemoveScroll.
          // CSS :has() rules in globals.css handle scroll locking/unlocking.
          // ScrollFix component + MutationObserver catch any stale inline styles.
          // We keep a minimal safety cleanup with a longer delay to avoid
          // racing with CSS :has() selector evaluation.
          setTimeout(() => {
            // Only clean up if NO other overlay is open
            const hasOpenSheet = document.querySelector('[data-state="open"][data-slot="sheet-content"]')
            const hasOpenDialog = document.querySelector('[data-state="open"][data-slot="dialog-overlay"]')
            const hasOpenChat = document.body.hasAttribute('data-chat-open') || document.querySelector('[data-chat-open="true"]')
            if (!hasOpenSheet && !hasOpenDialog && !hasOpenChat) {
              document.body.style.removeProperty('overflow')
              document.body.style.removeProperty('overflow-y')
              document.body.style.removeProperty('overflowY')
              document.documentElement.style.removeProperty('overflow')
              document.documentElement.style.removeProperty('overflow-y')
              document.documentElement.style.removeProperty('overflowY')
              document.body.removeAttribute('data-scroll-locked')
              document.documentElement.removeAttribute('data-scroll-locked')
            }
          }, 350) // Delay must be > CSS transition duration (200ms) + buffer
        }
      }}
    >
      <DialogContent
        className="max-w-md overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <AnimatePresence mode="wait">
          {step === 'age' ? (
            <motion.div
              key="age"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <DialogHeader className="text-center">
                <motion.div
                  className="mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                >
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </motion.div>
                <DialogTitle className="text-xl">
                  ⚠️ Age Verification Required
                </DialogTitle>
                <DialogDescription className="text-base">
                  এই সেকশনে শুধুমাত্র প্রাপ্তবয়স্কদের জন্য কন্টেন্ট রয়েছে।
                  আপনি কি ১৮ বছর বা তার বেশি বয়সী?
                </DialogDescription>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  This section contains content intended for adults only. Are you
                  18 years of age or older?
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3 mt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={handleCancel}
                >
                  না, ফিরে যান
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90 h-11"
                  onClick={handleAgeConfirm}
                >
                  হ্যাঁ, আমি ১৮+
                </Button>
              </div>
            </motion.div>
          ) : step === 'pin' ? (
            <motion.div
              key="pin"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <DialogHeader className="text-center">
                <motion.div
                  className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <Lock className="h-8 w-8 text-red-500" />
                </motion.div>
                <DialogTitle className="text-xl">🔐 Access PIN দিন</DialogTitle>
                <DialogDescription className="text-base">
                  রেস্ট্রিক্টেড কন্টেন্ট দেখতে PIN প্রয়োজন।
                </DialogDescription>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  Enter the PIN to access restricted content.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 px-2">
                {/* PIN Input */}
                <motion.div
                  animate={
                    wrongAttempt > 0
                      ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
                      : { x: 0 }
                  }
                  transition={{ duration: 0.5 }}
                >
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="PIN লিখুন"
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value.replace(/\D/g, ''))
                      setError('')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlePinSubmit()
                    }}
                    className={`text-center text-xl tracking-[0.5em] h-14 font-mono ${
                      wrongAttempt > 0
                        ? 'border-red-400 focus-visible:ring-red-300'
                        : ''
                    }`}
                    autoFocus
                  />
                </motion.div>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      className="text-sm text-red-500 text-center font-medium"
                      initial={{ opacity: 0, y: -5, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -5, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <p className="text-xs text-muted-foreground text-center">
                  PIN জানা না থাকলে WhatsApp-এ যোগাযোগ করুন
                </p>

                {/* ── The Secret Code Puzzle ── */}
                <SecretCodePuzzle
                  onReveal={() => {
                    // Optionally auto-fill the PIN when puzzle is solved
                  }}
                  wrongAttempt={wrongAttempt}
                />

                {/* Super subtle easter egg hint */}
                <p className="text-[8px] text-muted-foreground/30 dark:text-muted-foreground/25 text-center select-none mt-1 leading-tight">
                  hint: same as the number before seventy minus one
                </p>
              </div>
              <div className="flex gap-3 mt-3">
                <Button
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={handleCancel}
                >
                  বাতিল
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90 h-11"
                  onClick={handlePinSubmit}
                  disabled={pin.length === 0}
                >
                  PIN যাচাই করুন
                </Button>
              </div>
            </motion.div>
          ) : (
            /* ─── SUCCESS STEP ─── */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              className="relative"
            >
              <ConfettiBurst active={showConfetti} />
              <DialogHeader className="text-center">
                <motion.div
                  className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 12,
                    delay: 0.15,
                  }}
                >
                  <ShieldCheck className="h-8 w-8 text-[#10b981]" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <DialogTitle className="text-xl text-[#10b981]">
                    ✅ ভেরিফিকেশন সফল!
                  </DialogTitle>
                  <DialogDescription className="text-base mt-2">
                    আপনি এখন রেস্ট্রিক্টেড কন্টেন্ট দেখতে পারবেন।
                  </DialogDescription>
                </motion.div>
                {/* Animated checkmark trail */}
                <motion.div
                  className="flex justify-center gap-1 mt-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-[#10b981]"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ delay: 0.5 + i * 0.08, duration: 0.3 }}
                    />
                  ))}
                </motion.div>
              </DialogHeader>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
