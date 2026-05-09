'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { AlertTriangle, Lock, CheckCircle } from 'lucide-react'

export function AgeGate() {
  const { ageGateOpen, setAgeVerified, setAgeGateOpen, pendingAdultNavigate, navigate, setPendingAdultNavigate } = useAppStore()
  const [step, setStep] = useState<'age' | 'pin' | 'success'>('age')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const handleAgeConfirm = () => {
    setStep('pin')
    setPin('')
    setError('')
  }

  const handlePinSubmit = () => {
    if (pin === '69') {
      setAgeVerified(true)
      setAgeGateOpen(false)
      setStep('success')
      setPin('')
      setError('')
      // Execute pending navigation if there is one
      if (pendingAdultNavigate) {
        navigate(pendingAdultNavigate.page, pendingAdultNavigate.params)
        setPendingAdultNavigate(null)
      }
      // Reset step after a delay for next time
      setTimeout(() => setStep('age'), 500)
    } else {
      setError('ভুল PIN। আবার চেষ্টা করুন / Wrong PIN. Try again.')
    }
  }

  const handleCancel = () => {
    setAgeGateOpen(false)
    setPendingAdultNavigate(null)
    setStep('age')
    setPin('')
    setError('')
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleCancel()
    }
  }

  return (
    <AlertDialog open={ageGateOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        {step === 'age' ? (
          <>
            <AlertDialogHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
              <AlertDialogTitle className="text-xl">⚠️ Age Verification Required</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                এই সেকশনে শুধুমাত্র প্রাপ্তবয়স্কদের জন্য কন্টেন্ট রয়েছে। আপনি কি ১৮ বছর বা তার বেশি বয়সী?
              </AlertDialogDescription>
              <AlertDialogDescription className="text-sm text-muted-foreground mt-1">
                This section contains content intended for adults only. Are you 18 years of age or older?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row gap-3 sm:gap-3">
              <AlertDialogCancel className="flex-1" onClick={handleCancel}>
                না, ফিরে যান
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleAgeConfirm}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                হ্যাঁ, আমি ১৮+
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : step === 'pin' ? (
          <>
            <AlertDialogHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <Lock className="h-8 w-8 text-red-500" />
              </div>
              <AlertDialogTitle className="text-xl">🔐 Access PIN দিন</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                রেস্ট্রিক্টেড কন্টেন্ট দেখতে PIN প্রয়োজন।
              </AlertDialogDescription>
              <AlertDialogDescription className="text-sm text-muted-foreground mt-1">
                Enter the PIN to access restricted content.
              </AlertDialogDescription>
            </AlertDialogHeader>
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
            <AlertDialogFooter className="flex-row gap-3 sm:gap-3 mt-2">
              <AlertDialogCancel className="flex-1" onClick={handleCancel}>বাতিল</AlertDialogCancel>
              <AlertDialogAction
                onClick={handlePinSubmit}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={pin.length === 0}
              >
                PIN যাচাই করুন
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
              <AlertDialogTitle className="text-xl text-emerald-600">✅ ভেরিফিকেশন সফল!</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                আপনি এখন রেস্ট্রিক্টেড কন্টেন্ট দেখতে পারবেন।
              </AlertDialogDescription>
            </AlertDialogHeader>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
