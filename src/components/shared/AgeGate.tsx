'use client'

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
import { AlertTriangle } from 'lucide-react'

export function AgeGate() {
  const { ageGateOpen, setAgeVerified, setAgeGateOpen } = useAppStore()

  return (
    <AlertDialog open={ageGateOpen} onOpenChange={setAgeGateOpen}>
      <AlertDialogContent className="max-w-md">
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
          <AlertDialogCancel className="flex-1">No, Go Back</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => setAgeVerified(true)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            Yes, I&apos;m 18+
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
