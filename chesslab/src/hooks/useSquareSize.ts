import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Mede o espaço real disponível e devolve o lado do tabuleiro
 * (quadrado) que cabe sem scroll: min(largura, altura, teto).
 */
export function useSquareSize(max = 460, min = 240) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState(320)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => {
      const rect = el.getBoundingClientRect()
      const next = Math.floor(Math.min(rect.width, rect.height))
      setSize(Math.max(min, Math.min(max, next)))
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [max, min])

  return { ref, size }
}
