import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { Bird, Heart, Sparkles, Star } from 'lucide-react'
import { SunnyCharacter, type SunnyAct, type SunnyDirection, type SunnyFace, type SunnyMotion, type SunnyMouth } from './SunnyCharacter'
import { PlayIcons, SunnyPlayMenu, type PlayItem } from './SunnyPlayMenu'
import './sunny-pet.css'

type Point = { x: number; y: number }
type Bounds = { left: number; right: number; top: number; bottom: number; toggleRight: number }
type Reaction = 'react' | 'wake' | 'settle' | 'land' | 'wave' | 'dizzy'
type Response = { text: string; face: SunnyFace }
type Boba = '' | 'in' | 'sip' | 'out'
type Drag = {
  id: number; pointer: Point; origin: Point; headingAnchor: Point; bounds: Bounds; moved: boolean
  lastX: number; lastTime: number; vx: number; shakeDirection: number; flips: number[]; dizzy: boolean
}

const ENABLED_KEY = 'sfhq_sunny_enabled'
const POSITION_KEY = 'sfhq_sunny_position'
const GREETED_KEY = 'sfhq_sunny_greeted'
const SLEEP_AFTER_MS = 90_000
const DROWSY_AFTER_MS = SLEEP_AFTER_MS - 9_000
const CRAVE_AFTER_MS = 35_000
const CRAVE_FOR_MS = 20_000
const CRAVE_EVERY_MS = 4 * 60_000
const JUMP_DURATION_MS = 820
// Play: how long each performance runs before she speaks, and how long a boba keeps her full.
const FLIGHT_MS = 3400
const DANCE_MS = 3600
const HUG_MS = 1400
const FULL_FOR_MS = 60_000
const PLAY_MENU_ID = 'sunny-play-menu'
const REACTION_MS: Record<Reaction, number> = { react: JUMP_DURATION_MS, wake: 600, settle: 300, land: 460, wave: 1500, dizzy: 1800 }
const IDLE_ACT_MS = { look: 2600, tilt: 1900, stretch: 1600, hop: 900, fly: 2200 } satisfies Partial<Record<SunnyAct, number>>
type IdleAct = keyof typeof IDLE_ACT_MS

// Short lines and expressions adapted from Sunny in Vy's original HQ page.
const responses: Response[] = [
  { text: "I'm 90% fluff and 10% boba.", face: 'wink' },
  { text: "Small steps, big sips. You've got this.", face: 'heart' },
  { text: 'Why did the tea bag go to therapy? It was steeped in problems.', face: 'teary' },
  { text: 'Small improvements every day add up to something big.', face: 'glasses' },
  { text: "My dragonfly thinks I'm a very comfy hat.", face: 'wink' },
  { text: 'Progress over perfection, one task at a time.', face: 'heart' },
  { text: "What did the lost tea say? I've been oolong gone!", face: 'teary' },
  { text: "Move as a team. Don't leave anyone behind.", face: 'glasses' },
  { text: "I'd help with the spreadsheets, but I only have wings.", face: 'wink' },
  { text: 'Good things take time. Let it steep.', face: 'heart' },
  { text: 'Why do boba pearls never get lost? They always stick together.', face: 'teary' },
  { text: 'Ask early. A question today is cheaper than a mistake next week.', face: 'glasses' },
  { text: 'Meetings are just tea parties with calendars.', face: 'wink' },
  { text: 'Rest is part of the recipe.', face: 'heart' },
  { text: "What's a bird's favorite drink? Chirp-uccino. Kidding. It's boba.", face: 'teary' },
  { text: 'Break a big problem into small ones, then solve them one at a time.', face: 'glasses' },
  { text: "I don't have a to-do list. I have a to-boba list.", face: 'wink' },
  { text: "You're doing better than you think.", face: 'heart' },
  { text: 'What do you call a tea that tells jokes? Hilari-tea.', face: 'teary' },
  { text: 'Take care of the details. Customers notice the ones you skip.', face: 'glasses' },
]
const dragResponses = ['New spot, who dis?', 'A little stroll, a little boba.', 'This looks like a good spot.']
const wakeResponses = ['Just resting my eyes. Hi!', 'Did someone say boba?', 'That was a very productive nap.']
const dizzyResponses = ['Whoa... the room is spinning.', 'Wheee! Okay, maybe a little less shaking.', 'Which way is the tea bar?']
const petResponses = ['Hehe, that tickles!', 'Right behind the wing. Yes, that spot.', 'Best. Coworker. Ever.']
const flightResponses = ['Welcome back, little buddy!', 'Three laps! A new record.', 'My dragonfly says hi.']
const danceResponses = ['Ta-da!', 'I call that one the Brown Sugar Shuffle.', "Thank you, thank you. I'm here all shift."]
const hugResponses = ['Group hug!', 'Aww, I needed that.', 'Hugs are free refills.']
const fullResponses = ["I'm still full from the last one. Maybe later!", "One boba at a time. That's the rule."]

function greetingLine() {
  const now = new Date()
  const hour = now.getHours()
  if (now.getDay() === 1 && hour < 12) return "Happy Monday! Let's steep something great."
  if (now.getDay() === 5 && hour >= 12) return "It's Friday! Boba to celebrate later?"
  if (hour < 12) return 'Good morning! The kettle is on.'
  if (hour < 17) return 'Good afternoon! Sip some water, then conquer.'
  return "Working late? I'll keep you company."
}

function savedPreference() {
  try { return localStorage.getItem(ENABLED_KEY) !== 'false' } catch { return true }
}

function savedPosition(): Point | null {
  try {
    const value = JSON.parse(localStorage.getItem(POSITION_KEY) || 'null')
    return value && Number.isFinite(value.x) && Number.isFinite(value.y)
      && value.x >= 0 && value.x <= 1 && value.y >= 0 && value.y <= 1 ? value : null
  } catch { return null }
}

function boundsFor(pet: HTMLElement): Bounds {
  const shell = pet.closest('.vy-shell')
  const shellRect = shell?.getBoundingClientRect()
  const rail = shell?.querySelector<HTMLElement>('.vy-rail')
  const toggle = shell?.querySelector<HTMLElement>('.vy-pet-toggle')
  const mobileTabs = shell?.querySelector<HTMLElement>('.vy-mobile-tabs')
  const headers = shell?.querySelectorAll<HTMLElement>('.vy-topbar, .vy-utility')
  const left = rail && getComputedStyle(rail).display !== 'none'
    ? rail.getBoundingClientRect().right + 10 : Math.max(0, shellRect?.left ?? 0) + 8
  const right = Math.max(left, Math.min(window.innerWidth, shellRect?.right ?? window.innerWidth) - pet.offsetWidth - 8)
  const headerBottom = Array.from(headers ?? []).reduce((value, header) =>
    getComputedStyle(header).display === 'none' ? value : Math.max(value, header.getBoundingClientRect().bottom), 0)
  const top = Math.max(12, headerBottom + 10)
  const navTop = mobileTabs && getComputedStyle(mobileTabs).display !== 'none'
    ? mobileTabs.getBoundingClientRect().top : window.innerHeight
  return { left, right, top, bottom: Math.max(top, navTop - pet.offsetHeight - 10),
    toggleRight: toggle?.getBoundingClientRect().right ?? left }
}

function within(point: Point, bounds: Bounds): Point {
  const left = point.y > bounds.bottom - 60 ? Math.max(bounds.left, bounds.toggleRight + 12) : bounds.left
  return { x: Math.max(Math.min(left, bounds.right), Math.min(bounds.right, point.x)),
    y: Math.max(bounds.top, Math.min(bounds.bottom, point.y)) }
}

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value))

// Vy's boba cup, reused for Sunny's craving thought and her sip.
function BobaCup() {
  return <svg viewBox="0 0 36 50" aria-hidden="true" focusable="false">
    <path d="M21 1l-4 17" stroke="#9DBB93" strokeWidth="3" strokeLinecap="round" />
    <path d="M5 14h26l-3.5 33a3 3 0 0 1-3 2.6H11.5a3 3 0 0 1-3-2.6z" fill="#F4EEE6" stroke="#B89370" strokeWidth="1.3" />
    <path className="vy-boba-tea" d="M6.6 20h22.8l-2.9 27a2 2 0 0 1-2 1.8H11.5a2 2 0 0 1-2-1.8z" fill="#D9B38A" />
    <g fill="#3B2A22"><circle cx="13" cy="44" r="2.3" /><circle cx="18" cy="45" r="2.3" /><circle cx="23" cy="44" r="2.3" /><circle cx="15.5" cy="40.5" r="2.3" /><circle cx="20.5" cy="40.8" r="2.3" /></g>
    <rect x="3" y="11" width="30" height="5" rx="2.5" fill="#CDA077" />
  </svg>
}

// Types the line out while Sunny's beak moves. Screen readers get the whole line at once.
function SpeechBubble({ text, instant, align, vertical, onTyped }: {
  text: string; instant: boolean; align: string; vertical: string; onTyped: () => void
}) {
  const [shown, setShown] = useState(instant ? text.length : 0)
  const typed = useRef(onTyped)
  useEffect(() => { typed.current = onTyped })
  useEffect(() => {
    if (instant) { setShown(text.length); typed.current(); return }
    const step = Math.min(32, 1600 / text.length)
    const started = performance.now()
    let timer = 0
    const tick = () => {
      const count = Math.min(text.length, Math.ceil((performance.now() - started) / step))
      setShown(count)
      if (count < text.length) timer = window.setTimeout(tick, step)
      else typed.current()
    }
    timer = window.setTimeout(tick, step)
    return () => window.clearTimeout(timer)
  }, [text, instant])

  return <span className={`vy-pet-bubble align-${align} position-${vertical}`} role="status" aria-live="polite">
    <span className="sr-only">{text}</span>
    <span aria-hidden="true">{text.slice(0, shown)}<span className="vy-pet-bubble-rest">{text.slice(shown)}</span></span>
  </span>
}

export function SunnyPet({ layout }: { layout: 'auto' | 'phone' | 'desktop' }) {
  const [enabled, setEnabled] = useState(savedPreference)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [ready, setReady] = useState(false)
  const [motion, setMotion] = useState<SunnyMotion>('idle')
  const [face, setFace] = useState<SunnyFace>('front')
  const [direction, setDirection] = useState<SunnyDirection>('front')
  const [mouth, setMouth] = useState<SunnyMouth>('closed')
  const [blush, setBlush] = useState(false)
  const [blinking, setBlinking] = useState(false)
  const [act, setAct] = useState<SunnyAct | null>(null)
  const [craving, setCraving] = useState(false)
  const [boba, setBoba] = useState<Boba>('')
  const [activity, setActivity] = useState(0)
  const [bubble, setBubble] = useState<{ text: string; id: number } | null>(null)
  const [bubbleAlign, setBubbleAlign] = useState('center')
  const [bubbleVertical, setBubbleVertical] = useState('above')
  const [thoughtSide, setThoughtSide] = useState('right')
  const [hearts, setHearts] = useState(0)
  const [dust, setDust] = useState(0)
  const [stars, setStars] = useState(false)
  const [menu, setMenu] = useState<{ side: 'left' | 'right'; vertical: 'up' | 'down' } | null>(null)
  // petRef is the wrapper that carries Sunny's position; her body button and the play menu sit inside it.
  const petRef = useRef<HTMLDivElement>(null)
  const playRef = useRef<HTMLButtonElement>(null)
  const position = useRef<Point | null>(null)
  const initialPosition = useRef(savedPosition())
  const reactionTimer = useRef<number | undefined>(undefined)
  const bubbleTimer = useRef<number | undefined>(undefined)
  const strideTimer = useRef<number | undefined>(undefined)
  const suppressTimer = useRef<number | undefined>(undefined)
  const heartTimer = useRef<number | undefined>(undefined)
  const dustTimer = useRef<number | undefined>(undefined)
  const starTimer = useRef<number | undefined>(undefined)
  const petTimer = useRef<number | undefined>(undefined)
  const sequence = useRef<number[]>([])
  const counters = useRef({ heart: 0, bubble: 0, dust: 0, response: 0, drag: 0, wake: 0, dizzy: 0, pet: 0, flight: 0, dance: 0, hug: 0, full: 0 })
  const falling = useRef<Animation | null>(null)
  const waking = useRef(false)
  const petting = useRef(false)
  const rub = useRef({ x: 0, direction: 0, travel: 0, flips: [] as number[], lastHeart: 0 })
  const lastPetLine = useRef(0)
  const lastCrave = useRef(0)
  const lastFed = useRef(0)
  const lastPointer = useRef(0)
  const drag = useRef<Drag | null>(null)
  const suppressClick = useRef(false)
  // Timers read the latest state through these instead of stale closures.
  const live = useRef({ motion, bubble, craving })
  live.current = { motion, bubble, craving }

  const isIdle = () => live.current.motion === 'idle' && !live.current.bubble && !live.current.craving
    && !drag.current && !falling.current && !petting.current && !sequence.current.length

  const clearReaction = () => {
    window.clearTimeout(reactionTimer.current)
    window.clearTimeout(bubbleTimer.current)
  }

  const clearSequence = () => {
    sequence.current.forEach(timer => window.clearTimeout(timer))
    sequence.current = []
    setBoba('')
  }

  const burstHearts = () => {
    window.clearTimeout(heartTimer.current)
    setHearts(++counters.current.heart)
    heartTimer.current = window.setTimeout(() => setHearts(0), 1200)
  }

  // Steps of a performance. They share one list, so starting anything new cancels what was running.
  const later = (ms: number, step: () => void) => { sequence.current.push(window.setTimeout(step, ms)) }

  const fallAsleep = () => {
    clearSequence()
    setCraving(false)
    setAct(null)
    setBubble(null)
    setMouth('closed')
    setBlush(false)
    setFace('sleepy')
    setDirection('front')
    setMotion('sleep')
  }

  const rememberPosition = (at: Point, bounds: Bounds) => {
    const normalized = { x: (at.x - bounds.left) / (bounds.right - bounds.left || 1),
      y: (at.y - bounds.top) / (bounds.bottom - bounds.top || 1) }
    try { localStorage.setItem(POSITION_KEY, JSON.stringify(normalized)) } catch { /* Keep the in-page position. */ }
  }

  const stopFall = () => {
    const animation = falling.current
    const pet = petRef.current
    if (!animation || !pet) return false
    // Preserve the displayed position so catching a falling pet never snaps her back up.
    const { left: x, top: y } = pet.getBoundingClientRect()
    animation.onfinish = null
    animation.cancel()
    falling.current = null
    position.current = { x, y }
    pet.style.transform = `translate3d(${x}px, ${y}px, 0)`
    return true
  }

  const stopPetting = () => {
    window.clearTimeout(petTimer.current)
    if (!petting.current) return
    petting.current = false
    setBlush(false)
    if (live.current.motion === 'pet') {
      setMotion('idle')
      if (!live.current.bubble) setFace('front')
    }
  }

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (reducedMotion) falling.current?.finish()
  }, [reducedMotion])

  useLayoutEffect(() => {
    if (!enabled) return
    const place = () => {
      const pet = petRef.current
      if (!pet) return
      if (stopFall()) setMotion('idle')
      const bounds = boundsFor(pet)
      const stored = initialPosition.current
      const desired = position.current ?? (stored
        ? { x: bounds.left + (bounds.right - bounds.left) * stored.x,
          y: bounds.top + (bounds.bottom - bounds.top) * stored.y }
        : { x: bounds.right, y: bounds.bottom })
      const next = within(desired, bounds)
      initialPosition.current = null
      position.current = next
      pet.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`
      if (drag.current) drag.current.bounds = bounds
      setReady(true)
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [enabled, layout])

  // Her eyes follow the pointer. CSS variables keep this out of React renders.
  useEffect(() => {
    const pet = petRef.current
    if (!enabled || reducedMotion || !pet) return
    let frame = 0
    let pointer: Point = { x: 0, y: 0 }
    const look = (x: number, y: number) => {
      pet.style.setProperty('--sunny-look-x', x.toFixed(2))
      pet.style.setProperty('--sunny-look-y', y.toFixed(2))
    }
    const update = () => {
      frame = 0
      const rect = pet.getBoundingClientRect()
      const dx = pointer.x - (rect.left + rect.width / 2)
      const dy = pointer.y - (rect.top + rect.height * .39)
      if (Math.hypot(dx, dy) > 720) look(0, 0)
      else look(clamp(dx / 160, 1), clamp(dy / 160, 1))
    }
    const onMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY }
      lastPointer.current = performance.now()
      if (!frame) frame = requestAnimationFrame(update)
    }
    const reset = () => look(0, 0)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', reset)
    window.addEventListener('blur', reset)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('mouseleave', reset)
      window.removeEventListener('blur', reset)
      pet.style.removeProperty('--sunny-look-x')
      pet.style.removeProperty('--sunny-look-y')
    }
  }, [enabled, reducedMotion])

  useEffect(() => {
    if (!enabled || reducedMotion || motion !== 'idle') return
    let timer: number
    let open: number
    const blink = () => {
      setBlinking(true)
      open = window.setTimeout(() => setBlinking(false), 180)
      // Now and then a quick double blink.
      timer = window.setTimeout(blink, Math.random() < .2 ? 330 : 2800 + Math.random() * 3200)
    }
    timer = window.setTimeout(blink, 1800 + Math.random() * 2400)
    return () => { window.clearTimeout(timer); window.clearTimeout(open); setBlinking(false) }
  }, [enabled, reducedMotion, motion])

  // Idle life: glance around, tilt her head, stretch, hop, or watch the dragonfly take a lap.
  useEffect(() => {
    if (!enabled || reducedMotion) return
    let timer: number
    let finish: number
    const run = () => {
      if (isIdle() && !document.hidden) {
        const choices: IdleAct[] = performance.now() - lastPointer.current > 3500
          ? ['look', 'look', 'tilt', 'stretch', 'hop', 'fly'] : ['tilt', 'stretch', 'hop', 'fly']
        const next = choices[Math.floor(Math.random() * choices.length)]
        setAct(next)
        finish = window.setTimeout(() => setAct(value => value === next ? null : value), IDLE_ACT_MS[next])
      }
      timer = window.setTimeout(run, 7000 + Math.random() * 7000)
    }
    timer = window.setTimeout(run, 6000 + Math.random() * 4000)
    return () => { window.clearTimeout(timer); window.clearTimeout(finish) }
  }, [enabled, reducedMotion])

  // Left alone, Sunny starts craving boba, then gets drowsy, yawns, and naps.
  useEffect(() => {
    if (!enabled) return
    const timers: number[] = []
    timers.push(window.setTimeout(() => {
      const pet = petRef.current
      const at = position.current
      if (!pet || !at || !isIdle() || Date.now() - lastCrave.current < CRAVE_EVERY_MS) return
      lastCrave.current = Date.now()
      setThoughtSide(at.x > boundsFor(pet).right - 110 ? 'left' : 'right')
      setCraving(true)
      setAct('wish')
      timers.push(window.setTimeout(() => {
        setCraving(false)
        setAct(value => value === 'wish' ? null : value)
      }, CRAVE_FOR_MS))
    }, CRAVE_AFTER_MS))
    timers.push(window.setTimeout(() => {
      if (!isIdle()) return
      setFace('drowsy')
      if (reducedMotion) return
      setMouth('yawn')
      timers.push(window.setTimeout(() => setMouth(value => value === 'yawn' ? 'closed' : value), 1600))
    }, DROWSY_AFTER_MS))
    timers.push(window.setTimeout(() => {
      if (drag.current || falling.current || petting.current) return
      fallAsleep()
    }, SLEEP_AFTER_MS))
    return () => timers.forEach(timer => window.clearTimeout(timer))
  }, [enabled, activity, reducedMotion])

  useEffect(() => {
    if (!enabled) return
    for (const pose of ['front', 'body', 'wing', 'fly', 'heart', 'glasses', 'teary', 'back']) {
      const image = new Image()
      image.src = `/sunny-pet/${pose}.webp`
    }
  }, [enabled])

  useEffect(() => () => {
    for (const timer of [reactionTimer, bubbleTimer, strideTimer, suppressTimer, heartTimer, dustTimer, starTimer, petTimer]) {
      window.clearTimeout(timer.current)
    }
    sequence.current.forEach(timer => window.clearTimeout(timer))
    if (falling.current) {
      falling.current.onfinish = null
      falling.current.cancel()
    }
  }, [])

  const speak = (text: string) => {
    const pet = petRef.current
    const at = position.current
    if (!pet || !at) return false
    const bounds = boundsFor(pet)
    setBubbleAlign(at.x > bounds.right - 170 ? 'left'
      : at.x < bounds.left + 120 ? 'right' : 'center')
    setBubbleVertical(at.y < bounds.top + 130 ? 'below' : 'above')
    window.clearTimeout(bubbleTimer.current)
    setBubble({ text, id: ++counters.current.bubble })
    setMouth(reducedMotion ? 'closed' : 'talk')
    const typing = reducedMotion ? 0 : Math.min(1600, text.length * 32)
    bubbleTimer.current = window.setTimeout(() => {
      setBubble(null)
      setMouth('closed')
      if (!petting.current) { setFace('front'); setBlush(false) }
    }, typing + Math.max(3200, 1200 + text.length * 45))
    return true
  }

  const say = (text: string, expression: SunnyFace, reaction: Reaction = 'react') => {
    clearReaction()
    // A new line ends any performance still running (and puts away the boba cup), so its closing line
    // can't talk over this one. Performances call say() only before scheduling steps, or from the last step.
    clearSequence()
    if (!speak(text)) return
    setActivity(value => value + 1)
    setAct(null)
    setDirection('front')
    setFace(expression)
    setMotion(reducedMotion ? 'idle' : reaction)
    reactionTimer.current = window.setTimeout(() => setMotion('idle'), REACTION_MS[reaction])
  }

  // Greet once per browser session, after she has settled into place.
  useEffect(() => {
    if (!enabled || !ready) return
    const timer = window.setTimeout(() => {
      try {
        if (sessionStorage.getItem(GREETED_KEY)) return
        sessionStorage.setItem(GREETED_KEY, '1')
      } catch { return }
      if (isIdle()) say(greetingLine(), 'happy', 'wave')
    }, 1400)
    return () => window.clearTimeout(timer)
  }, [enabled, ready])

  // Clears whatever she was doing so a new performance starts from rest.
  const startPerformance = () => {
    stopFall()
    stopPetting()
    clearReaction()
    clearSequence()
    setMenu(null)
    setCraving(false)
    setAct(null)
    setBubble(null)
    setMouth('closed')
    setBlush(false)
    setDirection('front')
    setActivity(value => value + 1)
  }

  const feedBoba = () => {
    lastCrave.current = Date.now()
    if (Date.now() - lastFed.current < FULL_FOR_MS) {
      startPerformance()
      setBlush(true)
      say(fullResponses[counters.current.full++ % fullResponses.length], 'happy', 'settle')
      return
    }
    lastFed.current = Date.now()
    startPerformance()
    if (reducedMotion) {
      burstHearts()
      say('Mmm, brown sugar boba is the best!', 'heart')
      return
    }
    say('Ooh, boba! Thank you!', 'happy', 'settle')
    setBlush(true)
    setBoba('in')
    later(900, () => { setBoba('sip'); setMotion('sip'); setMouth('closed') })
    later(3100, () => setBoba('out'))
    later(3500, () => {
      sequence.current = []
      setBoba('')
      burstHearts()
      say('Mmm, brown sugar boba is the best!', 'heart')
    })
  }

  // The dragonfly takes a lap around her head while she watches, then she speaks once it's back.
  const flyDragonfly = () => {
    startPerformance()
    const line = flightResponses[counters.current.flight++ % flightResponses.length]
    if (reducedMotion) { say(line, 'happy', 'settle'); return }
    setFace('front')
    setMotion('idle')
    setAct('flight')
    later(FLIGHT_MS, () => {
      sequence.current = []
      setAct(null)
      say(line, 'happy', 'react')
    })
  }

  const dance = () => {
    startPerformance()
    const line = danceResponses[counters.current.dance++ % danceResponses.length]
    if (reducedMotion) { say(line, 'wink', 'settle'); return }
    setFace('happy')
    setMotion('dance')
    later(DANCE_MS, () => {
      sequence.current = []
      say(line, 'wink', 'react')
    })
  }

  const hug = () => {
    startPerformance()
    setFace('happy')
    setBlush(true)
    burstHearts()
    const line = hugResponses[counters.current.hug++ % hugResponses.length]
    if (reducedMotion) { say(line, 'heart', 'settle'); return }
    setMotion('hug')
    later(700, burstHearts)
    later(HUG_MS, () => {
      sequence.current = []
      setBlush(true)
      say(line, 'heart', 'settle')
    })
  }

  const napNow = () => {
    startPerformance()
    setFace('drowsy')
    if (reducedMotion) { fallAsleep(); return }
    setMouth('yawn')
    later(1500, fallAsleep)
  }

  const wakeUp = () => {
    startPerformance()
    burstHearts()
    say(wakeResponses[counters.current.wake++ % wakeResponses.length], 'surprised', 'wake')
  }

  const openMenu = () => {
    const element = petRef.current
    const at = position.current
    if (!element || !at) return
    const bounds = boundsFor(element)
    // Open toward whichever side has more room; the menu nudges itself on screen if neither fits.
    const roomLeft = at.x
    const roomRight = window.innerWidth - (at.x + element.offsetWidth)
    setMenu({ side: roomLeft > roomRight ? 'left' : 'right', vertical: at.y < bounds.top + 150 ? 'down' : 'up' })
  }

  const closeMenu = useCallback((returnFocus: boolean) => {
    setMenu(null)
    if (returnFocus) playRef.current?.focus()
  }, [])

  const pet = (time: number) => {
    window.clearTimeout(petTimer.current)
    petTimer.current = window.setTimeout(stopPetting, 900)
    if (time - rub.current.lastHeart > 900) { rub.current.lastHeart = time; burstHearts() }
    if (petting.current) return
    petting.current = true
    setBlush(true)
    // A sleeping Sunny just smiles in her sleep.
    if (live.current.motion === 'sleep') return
    clearReaction()
    setCraving(false)
    setAct(null)
    setActivity(value => value + 1)
    setDirection('front')
    setFace('happy')
    setMotion(reducedMotion ? 'idle' : 'pet')
    if (Date.now() - lastPetLine.current > 20_000) {
      lastPetLine.current = Date.now()
      speak(petResponses[counters.current.pet++ % petResponses.length])
    }
  }

  const drop = (dizzy: boolean) => {
    const element = petRef.current
    const start = position.current
    if (!element || !start) return
    const bounds = boundsFor(element)
    const end = within({ x: start.x, y: bounds.bottom }, bounds)
    const distance = Math.max(0, end.y - start.y)
    const land = () => {
      falling.current = null
      position.current = end
      element.style.transform = `translate3d(${end.x}px, ${end.y}px, 0)`
      rememberPosition(end, bounds)
      if (distance > 40 && !reducedMotion) {
        window.clearTimeout(dustTimer.current)
        setDust(++counters.current.dust)
        dustTimer.current = window.setTimeout(() => setDust(0), 700)
      }
      if (dizzy) {
        window.clearTimeout(starTimer.current)
        setStars(true)
        starTimer.current = window.setTimeout(() => setStars(false), 2600)
        say(dizzyResponses[counters.current.dizzy++ % dizzyResponses.length], 'dizzy', 'dizzy')
      } else {
        say(dragResponses[counters.current.drag++ % dragResponses.length], 'happy', 'land')
      }
    }
    if (reducedMotion || distance < 2) { land(); return }
    setFace(dizzy ? 'dizzy' : 'surprised')
    setMouth('open')
    setDirection('front')
    setMotion('fall')
    const animation = element.animate([
      { transform: `translate3d(${start.x}px, ${start.y}px, 0)` },
      { transform: `translate3d(${end.x}px, ${end.y}px, 0)` },
    ], {
      duration: Math.max(160, Math.sqrt(2 * distance / 1400) * 1000),
      // Quadratic acceleration, rendered by the browser without per-frame React updates.
      easing: 'cubic-bezier(0.333333, 0, 0.666667, 0.333333)', fill: 'forwards',
    })
    falling.current = animation
    animation.onfinish = () => { land(); animation.cancel() }
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !event.isPrimary || !position.current || drag.current) return
    stopFall()
    stopPetting()
    clearSequence()
    window.clearTimeout(heartTimer.current)
    setHearts(0)
    waking.current = motion === 'sleep'
    clearReaction()
    setActivity(value => value + 1)
    setAct(null)
    setBubble(null)
    setMouth('closed')
    setBlush(false)
    setFace('front')
    setDirection('front')
    setMotion('held')
    setMenu(null)
    drag.current = { id: event.pointerId, pointer: { x: event.clientX, y: event.clientY },
      origin: position.current, headingAnchor: { x: event.clientX, y: event.clientY },
      bounds: boundsFor(petRef.current ?? event.currentTarget), moved: false,
      lastX: event.clientX, lastTime: event.timeStamp, vx: 0, shakeDirection: 0, flips: [], dizzy: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  // Rubbing back and forth over Sunny with the mouse (no button held) pets her.
  const onHover = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== 'mouse' || event.buttons !== 0 || falling.current || sequence.current.length) return
    const state = rub.current
    const dx = event.clientX - state.x
    state.x = event.clientX
    if (!dx || Math.abs(dx) > 80) return
    const heading = Math.sign(dx)
    if (heading === state.direction) { state.travel += Math.abs(dx); return }
    if (state.travel >= 10) state.flips = [...state.flips.filter(time => event.timeStamp - time < 1500), event.timeStamp]
    state.direction = heading
    state.travel = Math.abs(dx)
    if (petting.current || state.flips.length >= 3) pet(event.timeStamp)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = drag.current
    const element = petRef.current
    if (!current) { onHover(event); return }
    if (!element || current.id !== event.pointerId) return
    const dx = event.clientX - current.pointer.x
    const dy = event.clientY - current.pointer.y
    if (!current.moved && Math.hypot(dx, dy) < 5) return
    if (!current.moved) { current.moved = true; setFace('happy') }
    const stepX = event.clientX - current.headingAnchor.x
    const stepY = event.clientY - current.headingAnchor.y
    // Ignore pointer noise when choosing a pose, without delaying actual movement.
    if (Math.hypot(stepX, stepY) >= 12) {
      if (Math.abs(stepY) > Math.abs(stepX) * 1.4) {
        setDirection(stepY < 0 ? 'away' : 'front')
      } else {
        setDirection(stepX < 0 ? 'left' : 'right')
      }
      current.headingAnchor = { x: event.clientX, y: event.clientY }
    }
    // She dangles from the pointer and swings with its speed. Shaking her hard makes her dizzy.
    const elapsed = Math.max(1, event.timeStamp - current.lastTime)
    const speed = (event.clientX - current.lastX) / elapsed
    current.vx = current.vx * .6 + speed * .4
    current.lastX = event.clientX
    current.lastTime = event.timeStamp
    element.style.setProperty('--sunny-swing', `${clamp(current.vx * 14, 26).toFixed(1)}deg`)
    const heading = Math.sign(speed)
    if (Math.abs(speed) > 1 && heading !== current.shakeDirection) {
      if (current.shakeDirection) current.flips = [...current.flips.filter(time => event.timeStamp - time < 1200), event.timeStamp]
      current.shakeDirection = heading
      if (current.flips.length >= 4 && !current.dizzy) { current.dizzy = true; setFace('dizzy') }
    }
    const next = within({ x: current.origin.x + dx, y: current.origin.y + dy }, current.bounds)
    position.current = next
    element.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`
    setMotion('walk')
    window.clearTimeout(strideTimer.current)
    strideTimer.current = window.setTimeout(() => {
      element.style.setProperty('--sunny-swing', '0deg')
      setMotion('held')
    }, 220)
  }

  const onPointerEnd = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = drag.current
    if (!current || current.id !== event.pointerId) return
    drag.current = null
    window.clearTimeout(strideTimer.current)
    petRef.current?.style.setProperty('--sunny-swing', '0deg')
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    setActivity(value => value + 1)
    setMotion('idle')
    if (!current.moved) return
    waking.current = false
    suppressClick.current = true
    window.clearTimeout(suppressTimer.current)
    suppressTimer.current = window.setTimeout(() => { suppressClick.current = false }, 350)
    setCraving(false)
    drop(current.dizzy)
  }

  const onClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (suppressClick.current) return
    stopFall()
    // A click on the dragonfly (top left of her head) sends it flying. Keyboard clicks have no position.
    const box = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - box.left) / box.width
    const y = (event.clientY - box.top) / box.height
    if (event.detail > 0 && direction !== 'away' && x > .12 && x < .54 && y >= 0 && y < .19) {
      waking.current = false
      flyDragonfly()
      return
    }
    if (waking.current || motion === 'sleep') {
      waking.current = false
      burstHearts()
      say(wakeResponses[counters.current.wake++ % wakeResponses.length], 'surprised', 'wake')
    } else if (craving) {
      feedBoba()
    } else {
      burstHearts()
      const response = responses[counters.current.response++ % responses.length]
      say(response.text, response.face)
    }
  }

  const onToggle = (checked: boolean) => {
    stopFall()
    stopPetting()
    clearReaction()
    clearSequence()
    window.clearTimeout(heartTimer.current)
    window.clearTimeout(starTimer.current)
    window.clearTimeout(dustTimer.current)
    setHearts(0)
    setStars(false)
    setDust(0)
    window.clearTimeout(strideTimer.current)
    drag.current = null
    waking.current = false
    setActivity(value => value + 1)
    setEnabled(checked)
    setMenu(null)
    setBubble(null)
    setCraving(false)
    setAct(null)
    setMouth('closed')
    setBlush(false)
    setFace('front')
    setMotion('idle')
    try { localStorage.setItem(ENABLED_KEY, String(checked)) } catch { /* Keep the in-page choice. */ }
  }

  const label = motion === 'sleep' ? 'Sunny is sleeping. Click to wake her or drag to move.'
    : craving ? 'Sunny is craving boba. Click to share one, or drag to move.'
      : 'Sunny the Summerfield bird. Click for a thought, drag to move, or rub with the mouse to pet.'
  const playItems: PlayItem[] = [
    { key: 'boba', label: 'Give Sunny a boba', icon: PlayIcons.boba, onSelect: feedBoba },
    { key: 'fly', label: 'Let the dragonfly fly', icon: PlayIcons.fly, onSelect: flyDragonfly },
    { key: 'dance', label: 'Wiggle dance', icon: PlayIcons.dance, onSelect: dance },
    { key: 'hug', label: 'Give a hug', icon: PlayIcons.hug, onSelect: hug },
    motion === 'sleep' ? { key: 'wake', label: 'Wake Sunny up', icon: PlayIcons.nap, onSelect: wakeUp }
      : { key: 'nap', label: 'Nap time', icon: PlayIcons.nap, onSelect: napNow },
  ]

  return <>
    {enabled && <div ref={petRef} className={`vy-pet vy-pet-${motion} ${ready ? 'is-ready' : ''} ${menu ? 'is-playing' : ''}`}
      data-facing={direction} data-act={act ?? undefined}
      style={{ '--sunny-jump-duration': `${JUMP_DURATION_MS}ms` } as CSSProperties}>
      <button className="vy-pet-body" type="button"
        title={motion === 'sleep' ? 'Sunny is sleeping. Click to wake her.'
          : craving ? 'Sunny wants boba. Click to share one.' : 'Sunny: click for a thought, click the dragonfly, drag to move, rub to pet'}
        aria-label={label}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd} onLostPointerCapture={onPointerEnd} onClick={onClick}>
        {/* These overlays are siblings, so each key needs its own prefix; a shared number would make React
            confuse them and leave an old bubble stuck on screen. */}
        {bubble && <SpeechBubble key={`bubble-${bubble.id}`} text={bubble.text} instant={reducedMotion}
          align={bubbleAlign} vertical={bubbleVertical}
          onTyped={() => setMouth(value => value === 'talk' ? 'closed' : value)} />}
        {craving && !bubble && <span className={`vy-pet-thought side-${thoughtSide}`} aria-hidden="true"><BobaCup /><span>Boba?</span></span>}
        <span className="vy-pet-ground" aria-hidden="true" />
        <span className="vy-pet-swing" aria-hidden="true">
          <span className="vy-pet-puppet">
            <SunnyCharacter face={face} direction={direction} motion={motion} mouth={mouth}
              act={act} blush={blush} blinking={blinking} />
          </span>
          {boba && <span className={`vy-pet-boba is-${boba}`}><BobaCup /></span>}
        </span>
        {stars && <span className="vy-pet-stars" aria-hidden="true"><Star /><Star /><Star /></span>}
        {dust > 0 && <span className="vy-pet-dust" key={`dust-${dust}`} aria-hidden="true"><span /><span /><span /></span>}
        {hearts > 0 && <span className="vy-pet-hearts" key={`hearts-${hearts}`} aria-hidden="true"><Heart /><Heart /><Heart /></span>}
        {motion === 'dance' && <span className="vy-pet-notes" aria-hidden="true"><span>♪</span><span>♫</span><span>♪</span></span>}
        {motion === 'sleep' && <>
          <span className="vy-pet-snore" aria-hidden="true" />
          <span className="vy-pet-sleep-marks" aria-hidden="true"><span>z</span><span>z</span><span>Z</span></span>
        </>}
      </button>
      <button ref={playRef} className="vy-pet-play" type="button" title="Play with Sunny" aria-label="Play with Sunny"
        aria-haspopup="menu" aria-expanded={Boolean(menu)} aria-controls={menu ? PLAY_MENU_ID : undefined}
        onClick={() => (menu ? closeMenu(false) : openMenu())}><Sparkles size={15} aria-hidden="true" /></button>
      {menu && <SunnyPlayMenu id={PLAY_MENU_ID} items={playItems} side={menu.side} vertical={menu.vertical} onClose={closeMenu} />}
    </div>}
    <label className="vy-pet-toggle" title={enabled ? 'Hide Sunny' : 'Show Sunny'}>
      <Bird size={16} aria-hidden="true" /><span>Sunny</span>
      <input type="checkbox" checked={enabled} onChange={(event) => onToggle(event.target.checked)} aria-label="Show Sunny the bird" />
      <span className="vy-pet-switch" aria-hidden="true" />
    </label>
  </>
}
