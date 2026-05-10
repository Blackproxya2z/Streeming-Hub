'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle, Lock, CheckCircle, Sparkles } from 'lucide-react'

/* ────────────────────────────────────────────────
   Easter-egg hint component — the "hide & seek" PIN
   ──────────────────────────────────────────────── */
function PinHint() {
  const [revealed, setRevealed] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <div className="flex flex-col items-center gap-1.5 mt-1">
      {/* ── The subtle hint trigger ── */}
      <button
        type="button"
        onClick={() => setRevealed(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group relative flex items-center gap-1 text-[11px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors duration-500 cursor-pointer select-none focus:outline-none"
        aria-label="Reveal PIN hint"
      >
        <motion.span
          animate={{ rotate: hovered || revealed ? 15 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          className="inline-block"
        >
          💡
        </motion.span>
        <span className="tracking-wide">
          {revealed ? 'Found it!' : 'Need a hint?'}
        </span>

        {/* Tiny shimmer bar under text on hover */}
        <motion.span
          className="absolute -bottom-0.5 left-1/2 h-[1px] rounded-full bg-gradient-to-r from-transparent via-amber-400/60 to-transparent"
          initial={{ width: 0, x: '-50%' }}
          animate={{
            width: hovered && !revealed ? '100%' : 0,
            x: '-50%',
          }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />
      </button>

      {/* ── The PIN reveal ── */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.05 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-700/30"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
              Your PIN:
            </span>
            {/* Each digit animates in separately */}
            {[6, 9].map((digit, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: -12, rotateX: 90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 20,
                  delay: 0.15 + i * 0.12,
                }}
                className="inline-flex items-center justify-center h-6 w-5 rounded bg-amber-100 dark:bg-amber-900/50 text-sm font-bold font-mono text-amber-600 dark:text-amber-300 shadow-sm"
              >
                {digit}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ────────────────────────────────────────────────
   Main AgeGate component
   ──────────────────────────────────────────────── */
export function AgeGate() {
  const ageGateOpen = useAppStore(s => s.ageGateOpen)
  const setAgeVerified = useAppStore(s => s.setAgeVerified)
  const setAgeGateOpen = useAppStore(s => s.setAgeGateOpen)
  const setFilter = useAppStore(s => s.setFilter)

  const [step, setStep] = useState<'age' | 'pin' | 'success'>('age')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const handleAgeConfirm = useCallback(() => {
    setStep('pin')
    setPin('')
    setError('')
  }, [])

  const handlePinSubmit = useCallback(() => {
    if (pin === '69') {
      // Mark age as verified
      setAgeVerified(true)
      setStep('success')
      setPin('')
      setError('')

      // Close dialog after showing success briefly
      setTimeout(() => {
        setAgeGateOpen(false)
        // Reset step for next time after dialog closes
        setTimeout(() => setStep('age'), 300)
      }, 800)
    } else {
      setError('ভুল PIN। আবার চেষ্টা করুন / Wrong PIN. Try again.')
    }
  }, [pin, setAgeVerified, setAgeGateOpen])

  const handleCancel = useCallback(() => {
    setAgeGateOpen(false)
    setStep('age')
    setPin('')
    setError('')
  }, [setAgeGateOpen])

  return (
    <Dialog open={ageGateOpen} onOpenChange={(open) => { if (!open) handleCancel() }}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        {step === 'age' ? (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
              <DialogTitle className="text-xl">⚠️ Age Verification Required</DialogTitle>
              <DialogDescription className="text-base">
                এই সেকশনে শুধুমাত্র প্রাপ্তবয়স্কদের জন্য কন্টেন্ট রয়েছে। আপনি কি ১৮ বছর বা তার বেশি বয়সী?
              </DialogDescription>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                This section contains content intended for adults only. Are you 18 years of age or older?
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
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-11"
                onClick={handleAgeConfirm}
              >
                হ্যাঁ, আমি ১৮+
              </Button>
            </div>
          </>
        ) : step === 'pin' ? (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <Lock className="h-8 w-8 text-red-500" />
              </div>
              <DialogTitle className="text-xl">🔐 Access PIN দিন</DialogTitle>
              <DialogDescription className="text-base">
                রেস্ট্রিক্টেড কন্টেন্ট দেখতে PIN প্রয়োজন।
              </DialogDescription>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Enter the PIN to access restricted content.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 px-2">
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
                className="text-center text-xl tracking-[0.5em] h-14 font-mono"
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-500 text-center font-medium">{error}</p>
              )}
              <p className="text-xs text-muted-foreground text-center">
                PIN জানা না থাকলে WhatsApp-এ যোগাযোগ করুন
              </p>

              {/* ── Easter egg hint ── */}
              <PinHint />
            </div>
            <div className="flex gap-3 mt-2">
              <Button
                variant="outline"
                className="flex-1 h-11"
                onClick={handleCancel}
              >
                বাতিল
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-11"
                onClick={handlePinSubmit}
                disabled={pin.length === 0}
              >
                PIN যাচাই করুন
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
              <DialogTitle className="text-xl text-emerald-600">✅ ভেরিফিকেশন সফল!</DialogTitle>
              <DialogDescription className="text-base">
                আপনি এখন রেস্ট্রিক্টেড কন্টেন্ট দেখতে পারবেন।
              </DialogDescription>
            </DialogHeader>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
