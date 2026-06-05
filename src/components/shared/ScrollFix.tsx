'use client'

import { useEffect } from 'react'

/**
 * ScrollFix: Lightweight cleanup for stuck Radix UI scroll locks.
 *
 * Radix Dialog/Sheet adds `overflow:hidden` and `pointer-events:none`
 * to <html>/<body> when a dialog opens. If a dialog doesn't close cleanly
 * (e.g., browser back button, unmount during animation), the scroll lock persists.
 *
 * This component listens for dialog/sheet close events and cleans up any
 * stale inline styles left behind by Radix's RemoveScroll.
 */
export function ScrollFix() {
  useEffect(() => {
    const cleanupStaleStyles = () => {
      // Only clean up if NO overlay is currently open
      const hasOpenOverlay = !!(
        document.querySelector('[data-state="open"][role="dialog"]') ||
        document.querySelector('[data-state="open"][data-slot="sheet-content"]') ||
        document.querySelector('[data-state="open"][data-slot="dialog-overlay"]') ||
        document.querySelector('[data-radix-popper-content-wrapper]')
      )

      if (hasOpenOverlay) return

      const html = document.documentElement
      const body = document.body

      // Check for stale Radix scroll lock styles
      const htmlOverflow = html.style.overflow
      const htmlOverflowY = html.style.overflowY
      const bodyOverflow = body.style.overflow
      const bodyPointerEvents = body.style.pointerEvents

      if (htmlOverflow === 'hidden' || htmlOverflowY === 'hidden') {
        html.style.overflow = ''
        html.style.overflowY = ''
      }
      if (bodyOverflow === 'hidden') {
        body.style.overflow = ''
      }
      if (bodyPointerEvents === 'none') {
        body.style.pointerEvents = ''
      }

      // Remove stale padding/margin compensation
      if (html.style.paddingRight) html.style.paddingRight = ''
      if (body.style.paddingRight) body.style.paddingRight = ''
      if (html.style.marginRight) html.style.marginRight = ''
      if (body.style.marginRight) body.style.marginRight = ''

      // Remove Radix data attributes
      html.removeAttribute('data-scroll-locked')
      body.removeAttribute('data-scroll-locked')
      html.removeAttribute('data-radix-scroll-locked')
      body.removeAttribute('data-radix-scroll-locked')
    }

    // Run on mount
    cleanupStaleStyles()

    // Listen for dialog close events
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const target = mutation.target as HTMLElement
        if (
          target.getAttribute('data-state') === 'closed' ||
          target.getAttribute('role') === 'dialog' ||
          target.getAttribute('data-slot') === 'sheet-content' ||
          target.getAttribute('data-slot') === 'dialog-overlay'
        ) {
          // Delay cleanup slightly to allow Radix's own cleanup to run first
          setTimeout(cleanupStaleStyles, 100)
          setTimeout(cleanupStaleStyles, 300)
          return
        }
      }
      // Also check for style attribute changes on html/body
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        setTimeout(cleanupStaleStyles, 50)
      }
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-state', 'style'],
      subtree: true,
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'data-scroll-locked'],
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return null
}
