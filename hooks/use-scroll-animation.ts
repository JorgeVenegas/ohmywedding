import { useRef, useEffect, useState } from 'react'
import { useAnimationsDisabled } from '@/lib/animation-preference'

interface UseScrollAnimationOptions {
  threshold?: number
  triggerOnce?: boolean
}

/**
 * Hook for triggering animations when an element scrolls into view
 * @param options - Configuration options
 * @returns Object containing ref for the container and isVisible state
 */
export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const { threshold = 0.1, triggerOnce = false } = options
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const hasTriggeredRef = useRef(false)
  const animationsOff = useAnimationsDisabled()

  useEffect(() => {
    // Animations disabled (persisted setting, or forced off by the screenshot capture):
    // render every reveal-gated section straight to its final visible state and skip the
    // observer, so there's no scroll/intersection timing left to depend on. This has to be
    // a real post-mount state update — the section is server-rendered with isVisible=false,
    // so its `opacity-0 translate-y-*` className is already in the HTML; only an actual
    // state change triggers the re-render that reconciles it to `opacity-100 translate-y-0`.
    if (animationsOff) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (!triggerOnce || !hasTriggeredRef.current) {
            setIsVisible(true)
            hasTriggeredRef.current = true
          }
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold, triggerOnce, animationsOff])

  // `|| animationsOff` covers the first render before the effect above commits.
  return { ref, isVisible: isVisible || animationsOff }
}
