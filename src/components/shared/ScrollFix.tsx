'use client'

import { useEffect } from 'react'

/**
 * ScrollFix: Aggressive safety net for scroll-related issues on mobile.
 *
 * The root cause of the scrolling bug is that Radix UI's RemoveScroll
 * and various other JS code paths leave `overflow:hidden` on body/html
 * as an inline style after dialogs/sheets close. On mobile Safari and
 * Chrome, this prevents ALL touch scrolling.
 *
 * The CSS `:has()` selectors in globals.css handle the primary fix,
 * but inline styles have higher specificity than class selectors.
 * This component forcibly removes stuck inline styles when no overlay
 * is open, ensuring the CSS rules can take effect.
 *
 * Combined strategy (defense in depth):
 * 1. CSS :has() rules in globals.css (primary)
 * 2. This JS component removes inline styles (secondary)
 * 3. Dialog onCloseAutoFocus removes styles (tertiary)
 */
export function ScrollFix() {
  useEffect(() => {
    const isOverlayOpen = (): boolean => {
      // Check for Radix Sheet
      if (document.querySelector('[data-state="open"][data-slot="sheet-content"]')) return true
      // Check for Radix Dialog
      if (document.querySelector('[data-state="open"][data-slot="dialog-overlay"]')) return true
      // Check for AI Chat overlay (attribute may be on body or on a child element)
      if (document.body.hasAttribute('data-chat-open') || document.querySelector('[data-chat-open="true"]')) return true
      // NOTE: Removed check for [data-radix-popper-content-wrapper] because it is too broad.
      // That attribute persists for tooltips, dropdowns, and other non-modal poppers
      // even when they are not "open", which prevented this cleanup from running
      // and left scroll locks stuck after dialogs/sheets closed.
      return false
    }

    const cleanup = () => {
      if (isOverlayOpen()) return // Don't interfere with active overlays

      const bodyStyle = document.body.style
      const htmlStyle = document.documentElement.style

      // Remove ALL inline overflow/padding styles that RemoveScroll leaves behind
      const propsToRemove = ['overflow', 'overflow-y', 'overflowY', 'padding-right', 'paddingRight'] as const
      for (const prop of propsToRemove) {
        if (bodyStyle.getPropertyValue(prop) || bodyStyle[prop as keyof CSSStyleDeclaration]) {
          bodyStyle.removeProperty(prop)
        }
        if (htmlStyle.getPropertyValue(prop) || htmlStyle[prop as keyof CSSStyleDeclaration]) {
          htmlStyle.removeProperty(prop)
        }
      }

      // Remove Radix's scroll-locked attributes
      document.body.removeAttribute('data-scroll-locked')
      document.documentElement.removeAttribute('data-scroll-locked')

      // Remove any data-scroll-locked from inner elements
      document.querySelectorAll('[data-scroll-locked]').forEach((el) => {
        el.removeAttribute('data-scroll-locked')
      })

      // Also check for RemoveScroll's wrapper div that can block scroll events
      const removeScrollWrapper = document.querySelector('[data-radix-scroll-area-viewport]')
      if (removeScrollWrapper) {
        ;(removeScrollWrapper as HTMLElement).style.removeProperty('overflow')
      }
    }

    // Run cleanup on mount
    cleanup()

    // Periodic cleanup every 300ms (aggressive but necessary for mobile)
    const interval = setInterval(cleanup, 300)

    // Also run on key events
    document.addEventListener('visibilitychange', cleanup)

    // Run on touchstart — if user touches screen and scroll is locked, fix it
    window.addEventListener('touchstart', cleanup, { passive: true })

    // Run on resize (orientation change)
    window.addEventListener('resize', cleanup, { passive: true })

    // Run on scroll attempt
    const onScrollAttempt = () => {
      const scrollable = document.documentElement.scrollHeight > window.innerHeight + 50
      const stuck = bodyOverflowHidden()
      if (scrollable && stuck) {
        cleanup()
      }
    }
    window.addEventListener('scroll', onScrollAttempt, { passive: true })

    function bodyOverflowHidden(): boolean {
      return document.body.style.overflow === 'hidden' ||
        document.body.style.overflowY === 'hidden' ||
        document.documentElement.style.overflow === 'hidden' ||
        document.documentElement.style.overflowY === 'hidden'
    }

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', cleanup)
      window.removeEventListener('touchstart', cleanup)
      window.removeEventListener('resize', cleanup)
      window.removeEventListener('scroll', onScrollAttempt)
    }
  }, [])

  return null
}
