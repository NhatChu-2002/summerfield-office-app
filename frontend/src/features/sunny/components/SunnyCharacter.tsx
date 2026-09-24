import { memo, useId, type CSSProperties, type ReactNode } from 'react'
import './sunny-character.css'

// Sprite faces swap Vy's hand-drawn face art. Every other face is drawn live over front.webp.
export type SunnyFace = 'front' | 'heart' | 'glasses' | 'teary' | 'sleepy'
  | 'happy' | 'wink' | 'surprised' | 'dizzy' | 'drowsy'
export type SunnyDirection = 'front' | 'left' | 'right' | 'away'
export type SunnyMouth = 'closed' | 'talk' | 'open' | 'yawn'
export type SunnyMotion = 'idle' | 'react' | 'walk' | 'held' | 'sleep' | 'wake' | 'settle' | 'greet'
  | 'wave' | 'fall' | 'land' | 'pet' | 'dizzy' | 'sip' | 'dance' | 'hug'
export type SunnyAct = 'look' | 'tilt' | 'stretch' | 'hop' | 'fly' | 'flight' | 'wish'

const FRONT = '/sunny-pet/front.webp'
// Layers split from front.webp by scripts/split_sunny_layers.py, so the dragonfly and wings can move
// without leaving pieces of themselves behind on the body.
const BODY = '/sunny-pet/body.webp'
const FLY = '/sunny-pet/fly.webp'
const WING = '/sunny-pet/wing.webp'
const SPRITE_FACES: ReadonlySet<SunnyFace> = new Set(['heart', 'glasses', 'teary'])
const LID = '#b3d2e7'
// Measured from front.webp: sclera centres and the pupils, which sit slightly toward the beak.
const EYE_Y = 100.5
const PUPIL_Y = 101.5
const EYES = [
  { side: 'left', cx: 62.5, pupil: 67.5 },
  { side: 'right', cx: 144.5, pupil: 140 },
] as const

const origin = (x: number, y: number): CSSProperties => ({ transformOrigin: `${x}px ${y}px` })
const spiral = (x: number, y: number) =>
  `M${x} ${y}a2 2 0 0 1 4 0a4 4 0 0 1-8 0a6 6 0 0 1 12 0a8 8 0 0 1-16 0a10 10 0 0 1 20 0`

function Eye({ id, side, cx, pupil }: { id: string } & (typeof EYES)[number]) {
  // The lid edge droops toward the outer corner, so half-closed eyes look sleepy rather than cross.
  const outer = side === 'left' ? -1 : 1
  const lidEdge = `M${cx - 25} ${EYE_Y - (outer < 0 ? 17 : 24)}Q${cx} ${EYE_Y - 17} ${cx + 25} ${EYE_Y - (outer < 0 ? 24 : 17)}`
  return <g className={`sunny-eye sunny-eye-${side}`}>
    <ellipse className="sunny-eye-patch" cx={cx} cy={EYE_Y} rx="24.5" ry="27.5" fill={`url(#${id}-fur)`} filter={`url(#${id}-feather)`} />
    <g className="sunny-eye-open" style={origin(cx, EYE_Y)}>
      <g clipPath={`url(#${id}-sclera-${side})`}>
        <ellipse cx={cx} cy={EYE_Y} rx="21.4" ry="24.4" fill="#fff" />
        <g className="sunny-gaze"><g className="sunny-glance">
          <g className="sunny-pupil" style={origin(pupil, PUPIL_Y)}>
            <g clipPath={`url(#${id}-pupil-${side})`}><image href={FRONT} width="208" height="260" /></g>
          </g>
        </g></g>
        <path className="sunny-spiral" d={spiral(cx - 1, EYE_Y + 1)} style={origin(cx + 1, EYE_Y + 1)} />
      </g>
      {/* A slightly larger clip keeps the lid's soft edge on fur instead of the white of the eye. */}
      <g clipPath={`url(#${id}-lid-${side})`}>
        <g className="sunny-lid">
          <path d={`M${cx + 25} ${EYE_Y - 80}H${cx - 25}L${lidEdge.slice(1)}Z`} fill={LID} />
          <path className="sunny-lid-edge" d={lidEdge} />
        </g>
      </g>
    </g>
    <path className="sunny-eye-arc sunny-eye-happy" d={`M${cx - 12.5} ${EYE_Y + 5}Q${cx} ${EYE_Y - 13} ${cx + 12.5} ${EYE_Y + 5}`} />
    <path className="sunny-eye-arc sunny-eye-shut" d={`M${cx - 12.5} ${EYE_Y}Q${cx} ${EYE_Y + 10} ${cx + 12.5} ${EYE_Y}`} />
  </g>
}

export const SunnyCharacter = memo(function SunnyCharacter({
  face = 'front', direction = 'front', motion = 'idle', mouth = 'closed', act, blush = false, blinking = false,
}: {
  face?: SunnyFace
  direction?: SunnyDirection
  motion?: SunnyMotion
  mouth?: SunnyMouth
  act?: SunnyAct | null
  blush?: boolean
  blinking?: boolean
}) {
  const id = useId().replace(/:/g, '')
  const away = direction === 'away'
  const source = away ? '/sunny-pet/back.webp' : BODY
  const liveFace = !SPRITE_FACES.has(face)
  const part = (clip: string | null, className: string, image = source, children?: ReactNode, mask = 'alpha') => {
    const layer = <>
      <image href={image} width="208" height="260" />
      {children}
      <rect width="208" height="260" fill={`url(#${id}-light)`} mask={`url(#${id}-${mask})`} className="sunny-light" />
    </>
    return <g className={className}>{clip ? <g clipPath={`url(#${id}-${clip})`}>{layer}</g> : layer}</g>
  }
  // The right wing is the left wing mirrored.
  const wings = <>
    {part(null, 'sunny-wing sunny-wing-left', WING, undefined, 'alpha-wing')}
    <g transform="translate(208 0) scale(-1 1)">
      {part(null, 'sunny-wing sunny-wing-right', WING, undefined, 'alpha-wing')}
    </g>
  </>

  return <svg className="sunny-character" data-motion={motion} data-direction={direction} data-face={face}
    data-mouth={mouth} data-act={act ?? undefined} data-blush={blush} data-blink={blinking}
    viewBox="0 0 208 260" aria-hidden="true" focusable="false">
    <defs>
      {/* The torso outline. Wings and feet are separate layers that move on their own. */}
      <clipPath id={`${id}-body`}><path d="M0 0H208V140H180Q173 155 157 166Q164 175 167 190L171 214Q166 238 146 248H62Q42 238 37 216L40 195Q42 177 52 166Q37 155 28 140H0Z" /></clipPath>
      <clipPath id={`${id}-foot-left`}><path d="M62 246H103V260H62Z" /></clipPath>
      <clipPath id={`${id}-foot-right`}><path d="M105 246H148V260H105Z" /></clipPath>
      <clipPath id={`${id}-face`}><rect x="24" y="48" width="160" height="94" /></clipPath>
      <clipPath id={`${id}-jaw`}><path d="M84 119.5H123L104 134.5Z" /></clipPath>
      {EYES.map(eye => <clipPath key={eye.side} id={`${id}-sclera-${eye.side}`}><ellipse cx={eye.cx} cy={EYE_Y} rx="21.4" ry="24.4" /></clipPath>)}
      {EYES.map(eye => <clipPath key={eye.side} id={`${id}-lid-${eye.side}`}><ellipse cx={eye.cx} cy={EYE_Y} rx="22.6" ry="25.6" /></clipPath>)}
      {EYES.map(eye => <clipPath key={eye.side} id={`${id}-pupil-${eye.side}`}><ellipse cx={eye.pupil} cy={PUPIL_Y} rx="14.4" ry="17.4" /></clipPath>)}
      <mask id={`${id}-alpha`} maskUnits="userSpaceOnUse" x="0" y="0" width="208" height="260" style={{ maskType: 'alpha' }}>
        <image href={source} width="208" height="260" />
      </mask>
      <mask id={`${id}-alpha-wing`} maskUnits="userSpaceOnUse" x="0" y="0" width="208" height="260" style={{ maskType: 'alpha' }}>
        <image href={WING} width="208" height="260" />
      </mask>
      <linearGradient id={`${id}-light`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity=".35" />
        <stop offset=".45" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#214859" stopOpacity=".24" />
      </linearGradient>
      {/* Fur shading sampled around the eyes: lighter above, a little deeper below. */}
      <linearGradient id={`${id}-fur`} x1="0" y1={EYE_Y - 28} x2="0" y2={EYE_Y + 28} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#b5d4e8" />
        <stop offset=".5" stopColor="#b0cfe5" />
        <stop offset="1" stopColor="#aac8de" />
      </linearGradient>
      <filter id={`${id}-feather`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4" /></filter>
      <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" /></filter>
    </defs>
    <g className="sunny-tilt"><g className="sunny-rig">
      {/* From behind, the wings sit behind the body. Facing forward they're in front, as in the art. */}
      {away && wings}
      {part('foot-left', 'sunny-foot sunny-foot-left', FRONT)}
      {part('foot-right', 'sunny-foot sunny-foot-right', FRONT)}
      {part('body', 'sunny-body')}
      {!away && part('face', 'sunny-face', liveFace ? FRONT : `/sunny-pet/${face}.webp`, <>
        {liveFace && EYES.map(eye => <Eye key={eye.side} id={id} {...eye} />)}
        <g className="sunny-blush" filter={`url(#${id}-soft)`} fill="#f49cb2">
          <ellipse cx="42" cy="128" rx="11" ry="5.5" /><ellipse cx="166" cy="128" rx="11" ry="5.5" />
        </g>
        <g className="sunny-mouth">
          <path className="sunny-mouth-hole" d="M87 119.5Q104 138 120 119.5Z" fill="#1c2f47" />
          <ellipse className="sunny-tongue" cx="104" cy="125" rx="5.5" ry="2.6" fill="#e58a9d" />
          <g className="sunny-jaw"><g clipPath={`url(#${id}-jaw)`}><image href={FRONT} width="208" height="260" /></g></g>
        </g>
      </>)}
      {!away && wings}
      {!away && <g className="sunny-fly"><g className="sunny-fly-buzz"><image href={FLY} width="208" height="260" /></g></g>}
    </g></g>
  </svg>
})
