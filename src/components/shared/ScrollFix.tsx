'use client'

import { useEffect, useLayoutEffect } from 'react'

/**
 * ScrollFix: Safety net for scroll-related issues.
 *
 * With Dialog/Sheet set to modal={false}, Radix's RemoveScroll is no longer used.
 * This component serves as a safety net to:
 * 1. Clean up any leftover scroll-lock styles from previous sessions (cache)
 * 2. Handle manual scroll locking for AgeGate/Sheet
 * 3. Ensure scrolling ALWAYS works when no overlay is open
 */

// Global scroll lock counter for coordinating multiple overlays
let scrollLockCount = 0

export function lockScroll() {
  scrollLockCount++
  if (scrollLockCount === 1) {
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'
  }
}

export function unlockScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1)
  if (scrollLockCount === 0) {
    document.body.style.overflow = ''
    document.body.style.overscrollBehavior = ''
  }
}

export function ScrollFix() {
  // Clean up any stale scroll-lock styles on mount
  useLayoutEffect(() => {
    // Check if any overlay is actually open
    const hasOpenOverlay = () =>
      !!(
        document.querySelector('[data-state="open"][role="dialog"]') ||
        document.querySelector('[data-state="open"][data-slot="sheet-content"]') ||
        document.querySelector('[data-state="open"][data-slot="dialog-content"]') ||
        document.querySelector('[data-state="open"][data-slot="dialog-overlay"]') ||
        document.querySelector('[data-state="open"][data-slot="sheet-overlay"]')
      )

    if (!hasOpenOverlay()) {
      // Remove any leftover inline styles from Radix RemoveScroll
      const propsToClean = [
        'overflow', 'overflowY', 'overflowX',
        'pointerEvents', 'paddingRight', 'marginRight',
        'position', 'width', 'top', 'left',
      ] as const

      for (const prop of propsToClean) {
        const htmlVal = (document.documentElement.style as Record<string, string>)[prop]
        const bodyVal = (document.body.style as Record<string, string>)[prop]

        // Only remove if it looks like a Radix scroll-lock value
        if (
          (prop === 'overflow' || prop === 'overflowY' || prop === 'overflowX') &&
          (htmlVal === 'hidden' || bodyVal === 'hidden')
        ) {
          ;(document.documentElement.style as Record<string, string>)[prop] = ''
          ;(document.body.style as Record<string, string>)[prop] = ''
        }
        if (prop === 'pointerEvents' && (htmlVal === 'none' || bodyVal === 'none')) {
          ;(document.documentElement.style as Record<string, string>)[prop] = ''
          ;(document.body.style as Record<string, string>)[prop] = ''
        }
      }

      // Remove Radix data attributes
      document.documentElement.removeAttribute('data-scroll-locked')
      document.body.removeAttribute('data-scroll-locked')
      document.documentElement.removeAttribute('data-radix-scroll-locked')
      document.body.removeAttribute('data-radix-scroll-locked')
    }
  }, [])

  return null
}
