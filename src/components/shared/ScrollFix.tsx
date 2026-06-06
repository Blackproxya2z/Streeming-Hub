'use client'

import { useEffect } from 'react'

/**
 * ScrollFix: Aggressive safety net for scroll-related issues on mobile.
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
 * 2. Periodically checks for stuck scroll locks and removes them (every 500ms).
 *
 * This is the 5th+ time this bug has been reported, so this component is deliberately
 * aggressive. The 500ms interval ensures scroll is unlocked within half a second
 * of any overlay closing, even if the close event handler fails to clean up.
 */
export function ScrollFix() {
  useEffect(() => {
    const cleanup = () => {
      // Only clean up if there's NO open overlay that should be locking scroll
      const hasOpenSheet = document.querySelector('[data-state="open"][data-slot="sheet-content"]')
      const hasOpenDialog = document.querySelector('[data-state="open"][data-slot="dialog-overlay"]')
      const hasOpenChat = document.querySelector('[data-chat-open="true"]')

      if (!hasOpenSheet && !hasOpenDialog && !hasOpenChat) {
        // No overlays are open — safe to remove any leftover inline styles
        // Clean up body element
        const bodyStyle = document.body.style
        if (bodyStyle.overflow === 'hidden' || bodyStyle.overflowY === 'hidden') {
          bodyStyle.removeProperty('overflow')
          bodyStyle.removeProperty('overflow-y')
          bodyStyle.removeProperty('overflowY')
        }
        // Also clean up any padding-right that RemoveScroll may add (to prevent layout shift)
        if (bodyStyle.paddingRight === '0px' || bodyStyle.getPropertyValue('padding-right')) {
          bodyStyle.removeProperty('padding-right')
        }

        // Clean up html element
        const htmlStyle = document.documentElement.style
        if (htmlStyle.overflow === 'hidden' || htmlStyle.overflowY === 'hidden') {
          htmlStyle.removeProperty('overflow')
          htmlStyle.removeProperty('overflow-y')
          htmlStyle.removeProperty('overflowY')
        }
        if (htmlStyle.paddingRight === '0px' || htmlStyle.getPropertyValue('padding-right')) {
          htmlStyle.removeProperty('padding-right')
        }

        // Remove Radix UI's data-scroll-locked attribute
        document.body.removeAttribute('data-scroll-locked')
        document.documentElement.removeAttribute('data-scroll-locked')

        // Also clean up any Radix RemoveScroll wrapper elements that may linger
        // RemoveScroll wraps body content in a div with specific styles
        const removeScrollWrapper = document.querySelector('[data-radix-scroll-area-viewport]')
        if (removeScrollWrapper) {
          removeScrollWrapper.removeAttribute('data-scroll-locked')
        }
      }
    }

    // Run cleanup on mount
    cleanup()

    // Aggressive periodic cleanup every 500ms (was 2000ms, reduced after 5+ reports)
    const interval = setInterval(cleanup, 500)

    // Also run on visibility change (when user switches back to the tab)
    document.addEventListener('visibilitychange', cleanup)

    // Also run on scroll attempt (if user tries to scroll but can't)
    const onScrollAttempt = () => {
      if (window.scrollY === 0 && document.documentElement.scrollHeight > window.innerHeight + 100) {
        cleanup()
      }
    }
    window.addEventListener('scroll', onScrollAttempt, { passive: true })

    // Also run on touchstart (if user touches the screen to scroll)
    window.addEventListener('touchstart', cleanup, { passive: true })

    // Also run on resize (orientation change on mobile can trigger scroll issues)
    window.addEventListener('resize', cleanup, { passive: true })

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', cleanup)
      window.removeEventListener('scroll', onScrollAttempt)
      window.removeEventListener('touchstart', cleanup)
      window.removeEventListener('resize', cleanup)
    }
  }, [])

  return null
}
