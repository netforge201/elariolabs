// Decorative SVGs for the invitation templates. All are aria-hidden: they carry
// no information. Paths use pathLength="1" so CSS can "draw" them in.

type Props = { className?: string };

/** Symmetric hairline flourish with a centre diamond — Ivory template. */
export function Flourish({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 240 24" fill="none" aria-hidden="true" focusable="false">
      <path pathLength={1} className="inv-draw" d="M4 12 H92 C100 12 104 6 112 6" stroke="currentColor" strokeWidth=".8" strokeLinecap="round" />
      <path pathLength={1} className="inv-draw" d="M236 12 H148 C140 12 136 6 128 6" stroke="currentColor" strokeWidth=".8" strokeLinecap="round" />
      <path pathLength={1} className="inv-draw" d="M92 12 C100 12 104 18 112 18 M148 12 C140 12 136 18 128 18" stroke="currentColor" strokeWidth=".8" strokeLinecap="round" />
      <path d="M120 4 L127 12 L120 20 L113 12 Z" stroke="currentColor" strokeWidth=".8" fill="currentColor" fillOpacity=".12" />
      <circle cx="120" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

/** A single-line botanical sprig — Linen template. */
export function Sprig({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 160 420" fill="none" aria-hidden="true" focusable="false"
      stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path pathLength={1} className="inv-draw" d="M82 414 C80 360 78 300 82 240 C86 180 92 120 88 40" />
      <path pathLength={1} className="inv-draw" d="M81 330 C60 318 38 296 34 262 C54 270 72 292 81 312" />
      <path pathLength={1} className="inv-draw" d="M82 290 C104 276 126 252 128 220 C108 230 92 252 83 272" />
      <path pathLength={1} className="inv-draw" d="M84 220 C62 206 44 182 44 150 C64 160 78 182 85 202" />
      <path pathLength={1} className="inv-draw" d="M86 170 C106 156 122 132 122 104 C104 114 92 134 87 152" />
      <path pathLength={1} className="inv-draw" d="M88 112 C72 100 62 80 64 58 C78 68 86 86 88 100" />
      <path pathLength={1} className="inv-draw" d="M88 40 C82 30 82 18 88 8 C94 18 94 30 88 40 Z" />
      <circle cx="58" cy="236" r="1.6" fill="currentColor" stroke="none" className="inv-draw-dot" />
      <circle cx="112" cy="190" r="1.4" fill="currentColor" stroke="none" className="inv-draw-dot" />
      <circle cx="66" cy="128" r="1.2" fill="currentColor" stroke="none" className="inv-draw-dot" />
    </svg>
  );
}

/** Watercolour rose cluster for the Ivory sheet corners. */
export function RoseCorner({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 160 160" fill="none" aria-hidden="true" focusable="false">
      <g opacity=".9">
        <circle cx="45" cy="45" r="28" fill="#F1D5D8" fillOpacity=".7" />
        <circle cx="34" cy="66" r="21" fill="#E9C3C6" fillOpacity=".55" />
        <circle cx="66" cy="34" r="23" fill="#F6E1E0" fillOpacity=".8" />
        <path d="M42 40c6-5 13 2 8 8s-12-2-8-8" stroke="#B17A80" strokeWidth="1.1" />
        <path d="M36 36c16-8 26 8 20 20s-24 4-20-20" stroke="#BF8B90" strokeWidth=".9" opacity=".8" />
        <path d="M30 32c28-12 42 16 32 34s-38 8-32-34" stroke="#CFA0A3" strokeWidth=".7" opacity=".6" />
        <path d="M75 18c15-10 40-6 50 7-13 7-37 3-50-7Z" fill="#A9B8A2" fillOpacity=".6" />
        <path d="M18 75c-10 15-6 40 7 50 7-13 3-37-7-50Z" fill="#A9B8A2" fillOpacity=".6" />
        <path d="M82 48c23-3 46 14 53 32-20-2-40-15-53-32Z" fill="#BCC8B5" fillOpacity=".5" />
        <path d="M48 82c-3 23 14 46 32 53-2-20-15-40-32-53Z" fill="#BCC8B5" fillOpacity=".5" />
        <path d="M60 25q30 10 50 15M25 60q10 30 15 50" stroke="#B9965C" strokeWidth=".9" strokeLinecap="round" opacity=".8" />
        <circle cx="110" cy="40" r="2.2" fill="#B9965C" />
        <circle cx="40" cy="110" r="2.2" fill="#B9965C" />
      </g>
    </svg>
  );
}

export function ChevronDown({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
