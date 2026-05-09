'use client'

import { useState, useRef, useCallback } from 'react'
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
import { AlertTriangle, Lock, CheckCircle } from 'lucide-react'

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
