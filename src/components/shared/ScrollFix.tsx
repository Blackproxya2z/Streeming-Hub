'use client'

import { useEffect } from 'react'

/**
 * ScrollFix: Safety net for scroll-related issues on mobile.
 *
 * IMPORTANT: We NO LONGER use lockScroll/unlockScroll JavaScript functions.
 * They caused race conditions where body.style.overflow = 'hidden' got stuck
 * permanently, breaking touch scrolling on mobile devices.
 *
 * Instead, we use CSS-only scroll locking via the `:has()` selector in globals.css.
 *
 * This component does two things:
 * 1. Cleans up any leftover inline overflow styles from stale JS (Radix RemoveScroll,
 *    Framer Motion, or previous lockScroll/unlockScroll implementations).
 * 2. Periodically checks for stuck scroll locks and removes them.
 */
export function ScrollFix() {
  useEffect(() => {
    // Immediately clean up any stale inline overflow styles on mount
    const cleanup = () => {
      // Only clean up if there's NO open overlay that should be locking scroll
      const hasOpenSheet = document.querySelector('[data-state="open"][data-slot="sheet-content"]')
      const hasOpenDialog = document.querySelector('[data-state="open"][data-slot="dialog-overlay"]')
      const hasOpenChat = document.querySelector('[data-chat-open="true"]')

      if (!hasOpenSheet && !hasOpenDialog && !hasOpenChat) {
        // No overlays are open — safe to remove any leftover inline styles
        if (document.body.style.overflow === 'hidden' || document.body.style.overflowY === 'hidden') {
          document.body.style.removeProperty('overflow')
          document.body.style.removeProperty('overflowY')
        }
        if (document.documentElement.style.overflow === 'hidden' || document.documentElement.style.overflowY === 'hidden') {
          document.documentElement.style.removeProperty('overflow')
          document.documentElement.style.removeProperty('overflowY')
        }
      }
    }

    // Run cleanup on mount
    cleanup()

    // Also run cleanup periodically (every 2s) to catch any stuck states
    // This is a safety net — the CSS :has() approach should make this unnecessary,
    // but we keep it as a belt-and-suspenders approach since users reported this
    // issue 4+ times.
    const interval = setInterval(cleanup, 2000)

    // Also run on visibility change (when user switches back to the tab)
    document.addEventListener('visibilitychange', cleanup)

    // Also run on scroll attempt (if user tries to scroll but can't)
    const onScrollAttempt = () => {
      // If scrollY is 0 but there's content to scroll, something might be stuck
      if (window.scrollY === 0 && document.documentElement.scrollHeight > window.innerHeight + 100) {
        cleanup()
      }
    }
    window.addEventListener('scroll', onScrollAttempt, { passive: true })

    // Also run on touchstart (if user touches the screen to scroll)
    window.addEventListener('touchstart', cleanup, { passive: true })

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', cleanup)
      window.removeEventListener('scroll', onScrollAttempt)
      window.removeEventListener('touchstart', cleanup)
    }
  }, [])

  return null
}
