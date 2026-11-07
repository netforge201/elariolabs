/** The Elario mark: two interlocking rings (same artwork as app/icon.svg). */
export default function BrandMark({ size = 48, id }: { size?: number; id: string }) {
  const clip = `bx-mark-${id}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={clip}><rect x="29" y="33" width="12" height="12" /></clipPath>
      </defs>
      <rect width="64" height="64" rx="16" fill="#1f3a2e" />
      <circle cx="25" cy="35" r="10.5" fill="none" stroke="#ffffff" strokeWidth="6" />
      <circle cx="39" cy="29" r="10.5" fill="none" stroke="#f4c7b8" strokeWidth="6" />
      <circle cx="25" cy="35" r="10.5" fill="none" stroke="#ffffff" strokeWidth="6" clipPath={`url(#${clip})`} />
      <path d="M51 9.5l1.3 3 3 1.3-3 1.3-1.3 3-1.3-3-3-1.3 3-1.3z" fill="#f4c7b8" />
    </svg>
  );
}
