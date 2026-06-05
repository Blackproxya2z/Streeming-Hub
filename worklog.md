---
Task ID: 1
Agent: main
Task: Fix scrolling/touch issues on mobile and desktop, then deploy

Work Log:
- Examined all source files for scroll-blocking CSS/JS issues
- Identified ROOT CAUSE: `* { touch-action: manipulation }` in globals.css was blocking scroll event propagation on mobile browsers
- Identified secondary cause: aggressive CSS `!important` rules fighting with Radix UI's RemoveScroll mechanism
- Identified tertiary cause: ScrollFix component's 500ms interval causing layout thrashing
- Fixed globals.css: removed `* { touch-action: manipulation }`, only apply to interactive elements (button, a, input, select, textarea, summary)
- Fixed globals.css: removed aggressive `!important` body/html overflow rules
- Fixed globals.css: set proper `overflow-y: auto` on html and `overscroll-behavior-y: auto` on body
- Simplified ScrollFix.tsx: removed 500ms interval, simplified MutationObserver to only clean up after dialog close events
- Removed `overflow-y-scroll` from body class in layout.tsx
- Verified all API routes return 200, no compilation errors, lint passes clean
- Pushed to GitHub (force push) for Vercel auto-deploy

Stage Summary:
- Primary scrolling fix: removed `* { touch-action: manipulation }` which was the main cause
- Secondary fix: removed CSS !important rules conflicting with Radix UI
- Tertiary fix: simplified ScrollFix component
- All changes pushed to GitHub, Vercel auto-deploy triggered
