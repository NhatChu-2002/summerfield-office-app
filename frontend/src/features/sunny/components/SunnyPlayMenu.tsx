import { useEffect, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'

export type PlayItem = { key: string; label: string; icon: ReactNode; onSelect: () => void }

// Vy's "Play with Sunny" menu. It opens beside Sunny, focuses its first item, and closes on Escape,
// on a choice, or on a click anywhere else.
export function SunnyPlayMenu({ id, items, side, vertical, onClose }: {
  id: string; items: PlayItem[]; side: 'left' | 'right'; vertical: 'up' | 'down'; onClose: (returnFocus: boolean) => void
}) {
  const menu = useRef<HTMLDivElement>(null)
  // Held in a ref so a new callback from the parent never re-runs the effect (which would steal focus).
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose })

  // Keep the whole menu on screen, even on a narrow phone.
  useLayoutEffect(() => {
    const element = menu.current
    if (!element) return
    const box = element.getBoundingClientRect()
    const margin = 8
    const x = box.left < margin ? margin - box.left : box.right > window.innerWidth - margin ? window.innerWidth - margin - box.right : 0
    const y = box.top < margin ? margin - box.top : box.bottom > window.innerHeight - margin ? window.innerHeight - margin - box.bottom : 0
    if (x || y) element.style.translate = `${Math.round(x)}px ${Math.round(y)}px`
  }, [])

  useEffect(() => {
    menu.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
    const outside = (event: PointerEvent) => {
      const target = event.target as Node
      // The trigger toggles the menu itself, so a press on it isn't "outside".
      if (!menu.current?.contains(target) && !(target instanceof Element && target.closest('.vy-pet-play'))) close.current(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const buttons = [...(menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])]
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
    const move = (next: number) => { event.preventDefault(); buttons[(next + buttons.length) % buttons.length]?.focus() }
    if (event.key === 'ArrowDown') move(index + 1)
    else if (event.key === 'ArrowUp') move(index - 1)
    else if (event.key === 'Home') move(0)
    else if (event.key === 'End') move(buttons.length - 1)
    else if (event.key === 'Escape') { event.preventDefault(); onClose(true) }
    else if (event.key === 'Tab') onClose(false)
  }

  return <div ref={menu} id={id} className={`vy-pet-menu side-${side} v-${vertical}`} role="menu" aria-label="Play with Sunny" onKeyDown={onKeyDown}>
    <p aria-hidden="true">Play with Sunny</p>
    {items.map((item) => <button key={item.key} type="button" role="menuitem" onClick={() => { onClose(false); item.onSelect() }}>
      {item.icon}{item.label}
    </button>)}
  </div>
}

// Small icons from Vy's menu, plus a dragonfly in the same style.
export const PlayIcons = {
  boba: <svg viewBox="0 0 36 50" aria-hidden="true"><path d="M5 14h26l-3.5 33a3 3 0 0 1-3 2.6H11.5a3 3 0 0 1-3-2.6z" fill="#D9B38A" /><rect x="3" y="10" width="30" height="5" rx="2.5" fill="#CDA077" /></svg>,
  dance: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8 15V4l9-2v11" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="5.5" cy="15" r="2.5" /><circle cx="14.5" cy="13" r="2.5" /></svg>,
  hug: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 17S2 12 2 7a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5-8 10-8 10z" fill="#D2735F" /></svg>,
  fly: <svg viewBox="0 0 20 20" aria-hidden="true"><ellipse cx="6" cy="7" rx="5" ry="2.2" fill="#DCEFE0" stroke="#5E8C66" strokeWidth="1" transform="rotate(-18 6 7)" /><ellipse cx="14" cy="7" rx="5" ry="2.2" fill="#DCEFE0" stroke="#5E8C66" strokeWidth="1" transform="rotate(18 14 7)" /><ellipse cx="10" cy="12.5" rx="1.6" ry="5" fill="#6E9B76" /><circle cx="10" cy="7" r="2.6" fill="#7FB187" /></svg>,
  nap: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M15 12.5A7 7 0 0 1 7.5 5a7 7 0 1 0 7.5 7.5z" fill="#BFD3D6" stroke="currentColor" strokeWidth="1.2" /></svg>,
}
