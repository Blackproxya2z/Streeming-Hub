'use client'

import { useEffect } from 'react'

/**
 * ScrollFix: Safety net for scroll-related issues on mobile.
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
 * Strategy (defense in depth):
 * 1. CSS :has() rules in globals.css (primary)
 * 2. MutationObserver watches for stale overflow styles (secondary)
 * 3. Dialog onCloseAutoFocus removes styles (tertiary)
 * 4. Periodic check as last-resort fallback (quaternary, every 2s)
 *
 * Previous version used a 300ms interval which caused mobile jank
 * due to constant DOM queries triggering layout/reflow.
 */
export function ScrollFix() {
  useEffect(() => {
    const isOverlayOpen = (): boolean => {
      // Check for Radix Sheet
      if (document.querySelector('[data-state="open"][data-slot="sheet-content"]')) return true
      // Check for Radix Dialog
      if (document.querySelector('[data-state="open"][data-slot="dialog-overlay"]')) return true
      // Check for AI Chat overlay (attribute on body or child element)
      if (document.body.hasAttribute('data-chat-open') || document.querySelector('[data-chat-open="true"]')) return true
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
    }

    // Run cleanup on mount
    cleanup()

    // ── MutationObserver: watches for stale overflow:hidden on body/html ──
    // This is more efficient than a high-frequency interval because it only
    // triggers when the DOM actually changes, not on a timer.
    const observer = new MutationObserver(() => {
      // Check if body or html has a stuck overflow:hidden inline style
      const bodyStuck =
        document.body.style.overflow === 'hidden' ||
        document.body.style.overflowY === 'hidden'
      const htmlStuck =
        document.documentElement.style.overflow === 'hidden' ||
        document.documentElement.style.overflowY === 'hidden'

      if (bodyStuck || htmlStuck) {
        // Small delay to let any ongoing dialog close animation finish
        requestAnimationFrame(() => {
          cleanup()
        })
      }
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'data-scroll-locked'],
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'data-scroll-locked'],
    })

    // ── Last-resort periodic check (every 2s, not 300ms) ──
    // This catches edge cases where MutationObserver might miss something.
    // 2s is a good balance between responsiveness and performance.
    const interval = setInterval(cleanup, 2000)

    // ── Event-based cleanup ──
    // Run on visibility change (tab switch back)
    document.addEventListener('visibilitychange', cleanup)

    // Run on resize (orientation change on mobile)
    window.addEventListener('resize', cleanup, { passive: true })

    return () => {
      observer.disconnect()
      clearInterval(interval)
      document.removeEventListener('visibilitychange', cleanup)
      window.removeEventListener('resize', cleanup)
    }
  }, [])

  return null
}
