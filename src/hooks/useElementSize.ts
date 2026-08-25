import { useEffect, useRef, useState } from 'react'

export interface Size {
  w: number
  h: number
}

// Measures an element's content box and updates on resize. Used by cards that
// scale their content to the current grid cell size.
export function useElementSize<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState<Size>({ w: 0, h: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      setSize({ w: r.width, h: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return [ref, size] as const
}

export function clamp(min: number, value: number, max: number): number {
  return Math.max(min, Math.min(value, max))
}
