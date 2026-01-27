import { useRef, useEffect, useState } from 'react'

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

  useEffect(() => {
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
  }, [threshold, triggerOnce])

  return { ref, isVisible }
}
