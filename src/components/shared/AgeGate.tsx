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
import { AlertTriangle, Lock } from 'lucide-react'

export function AgeGate() {
  const { ageGateOpen, setAgeVerified, setAgeGateOpen, pendingAdultNavigate, navigate, setPendingAdultNavigate } = useAppStore()
  const [step, setStep] = useState<'age' | 'pin'>('age')
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
      setStep('age')
      setPin('')
      setError('')
      // Execute pending navigation if there is one
      if (pendingAdultNavigate) {
        navigate(pendingAdultNavigate.page, pendingAdultNavigate.params)
        setPendingAdultNavigate(null)
      }
    } else {
      setError('Wrong PIN. Access denied.')
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
              <AlertDialogTitle className="text-xl">Age Verification Required</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                This section contains content intended for adults only. Are you 18 years of age or older?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row gap-3 sm:gap-3">
              <AlertDialogCancel className="flex-1" onClick={handleCancel}>No, Go Back</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleAgeConfirm}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                Yes, I&apos;m 18+
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <Lock className="h-8 w-8 text-red-500" />
              </div>
              <AlertDialogTitle className="text-xl">Enter Access PIN</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                Please enter the PIN to access restricted content.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3 px-2">
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="Enter PIN"
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
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}
            </div>
            <AlertDialogFooter className="flex-row gap-3 sm:gap-3 mt-2">
              <AlertDialogCancel className="flex-1" onClick={handleCancel}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handlePinSubmit}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={pin.length === 0}
              >
                Verify PIN
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
