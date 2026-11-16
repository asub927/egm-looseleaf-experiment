/**
 * Safe Same-Document View Transitions Hook for React 19.
 *
 * Implements smooth spatial transitions between curriculum standards,
 * with hardware-acceleration, reduced-motion bypass, concurrency lock,
 * and synchronous DOM flush via ReactDOM.flushSync.
 */

import * as React from "react"
import * as ReactDOM from "react-dom"

export interface UseDeskViewTransitionReturn {
  /**
   * Executes an update function within a View Transition if supported and motion is allowed.
   * Otherwise executes updateFn synchronously.
   */
  startDeskTransition: (updateFn: () => void) => void
  /**
   * True while a view transition is actively executing.
   */
  isTransitioning: boolean
}

export function useDeskViewTransition(): UseDeskViewTransitionReturn {
  const [isTransitioning, setIsTransitioning] = React.useState(false)
  const isTransitioningRef = React.useRef(false)

  const startDeskTransition = React.useCallback((updateFn: () => void) => {
    // 1. Guard against duplicate rapid clicks while transition promise settles
    if (isTransitioningRef.current) {
      return
    }

    // 2. Reduced motion check or unsupported browser fallback
    const prefersReducedMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const supportsViewTransitions =
      typeof document !== "undefined" && "startViewTransition" in document

    if (!supportsViewTransitions || prefersReducedMotion) {
      updateFn()
      return
    }

    // 3. Execute view transition with synchronous React 19 state commit
    isTransitioningRef.current = true
    setIsTransitioning(true)

    try {
      const transition = (document as any).startViewTransition(() => {
        ReactDOM.flushSync(() => {
          updateFn()
        })
      })

      transition.finished
        .catch(() => {
          // Gracefully swallow aborts/errors on rapid navigation
        })
        .finally(() => {
          isTransitioningRef.current = false
          setIsTransitioning(false)
        })
    } catch {
      // Fallback if startViewTransition throws unexpectedly
      isTransitioningRef.current = false
      setIsTransitioning(false)
      updateFn()
    }
  }, [])

  return { startDeskTransition, isTransitioning }
}
