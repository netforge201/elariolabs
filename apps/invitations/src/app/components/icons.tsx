import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export function ArrowUpRightIcon({ className = 'w-3.5 h-3.5', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

export function ArrowLeftIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

export function DownloadIcon({ className = 'w-3.5 h-3.5', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M12 3v13" />
      <path d="M7 11l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

export function ChevronDownIcon({ className = 'w-3 h-3', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function CheckIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function CalendarIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <circle cx="8" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="8" cy="18" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function GoogleCalendarIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M12 13v5M9.5 15.5h5" strokeWidth="1.8" />
    </svg>
  );
}

export function AppleIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.89c.66-.82 1.11-1.96.99-3.1-.96.04-2.12.64-2.8 1.44-.61.71-1.14 1.86-1 2.98 1.08.08 2.16-.54 2.81-1.32z" />
    </svg>
  );
}

/** Turn-by-turn navigation arrow (used for the Waze button). */
export function NavigationIcon({ className = 'w-3.5 h-3.5', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M3 11l19-9-9 19-2-8-8-2z" />
    </svg>
  );
}

export function MapPinIcon({ className = 'w-3.5 h-3.5', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function CopyIcon({ className = 'w-3.5 h-3.5', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

export function SparklesIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M12 3c0 4.97 4.03 9 9 9-4.97 0-9 4.03-9 9 0-4.97-4.03-9-9-9 4.97 0 9-4.03 9-9z" fill="currentColor" fillOpacity="0.2" />
      <path d="M19 3v4m2-2h-4M5 17v4m2-2H3" />
    </svg>
  );
}

export function TablePlateIcon({ className = 'w-5 h-5', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <circle cx="12" cy="12" r="3" />
      <path d="M7 2v4M17 2v4M7 18v4M17 18v4" />
    </svg>
  );
}

export function CrestStarIcon({ className = 'w-3 h-3', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
    </svg>
  );
}

export function UndoIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 015.5 5.5v0a5.5 5.5 0 01-5.5 5.5H11" />
    </svg>
  );
}

export function RedoIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M15 14l5-5-5-5" />
      <path d="M20 9H9.5A5.5 5.5 0 004 14.5v0A5.5 5.5 0 009.5 20H13" />
    </svg>
  );
}

export function DuplicateIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" />
    </svg>
  );
}

export function DesktopIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

export function MobileIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect x="5" y="2" width="14" height="20" rx="3" />
      <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" />
    </svg>
  );
}

export function RoundTableIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} {...props}>
      <circle cx="12" cy="12" r="7" strokeWidth="1.8" />
      <circle cx="12" cy="3" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="21" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="3" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="21" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function RectTableIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} {...props}>
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <circle cx="8" cy="2" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16" cy="2" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="8" cy="22" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16" cy="22" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function OvalTableIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} {...props}>
      <ellipse cx="12" cy="12" rx="9" ry="6" />
      <circle cx="7" cy="3" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="17" cy="3" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="7" cy="21" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="17" cy="21" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MinusIcon({ className = 'w-3 h-3', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function ClockIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function HeartOutlineIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export function HeartFilledIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className} {...props}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export function PlayIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <polygon points="6 4 20 12 6 20 6 4" />
    </svg>
  );
}

export function PauseIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

export function MusicIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

export function PhotoIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

export function UploadIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export function CloseIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// Minimalist botanical one-line art illustration (Template 3 Linear)
export function BotanicalLineArt({ className = 'w-full h-auto', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 200 400" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      {/* Stem */}
      <path d="M85 380 C 88 320, 92 250, 96 180 C 98 150, 100 120, 100 85" />
      
      {/* Lower Leaf Left */}
      <path d="M92 270 C 65 255, 40 220, 48 180 C 58 195, 75 225, 94 240" fill="currentColor" fillOpacity="0.04" />
      <path d="M92 270 C 65 255, 40 220, 48 180 C 58 195, 75 225, 94 240" />

      {/* Mid Leaf Right */}
      <path d="M96 210 C 125 190, 155 160, 150 120 C 138 140, 120 170, 98 190" fill="currentColor" fillOpacity="0.04" />
      <path d="M96 210 C 125 190, 155 160, 150 120 C 138 140, 120 170, 98 190" />

      {/* Bud / Tulip Head */}
      {/* Center petal */}
      <path d="M100 85 C 92 65, 88 40, 100 18 C 112 40, 108 65, 100 85 Z" fill="currentColor" fillOpacity="0.05" />
      <path d="M100 85 C 92 65, 88 40, 100 18 C 112 40, 108 65, 100 85 Z" />

      {/* Left petal */}
      <path d="M95 82 C 78 68, 70 42, 85 24 C 92 38, 96 55, 96 78" />

      {/* Right petal */}
      <path d="M105 82 C 122 68, 130 42, 115 24 C 108 38, 104 55, 104 78" />

      {/* Inner delicate pistil lines */}
      <path d="M100 55 C 100 45, 100 35, 100 28" strokeWidth="1" strokeOpacity="0.6" />
    </svg>
  );
}

// Floral Corner Ornament (Template 1 Cream)
export function FloralCorner({ className = 'w-32 h-32', position = 'top-left', ...props }: { className?: string; position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' } & IconProps) {
  const transform =
    position === 'top-right' ? 'scale(-1, 1)' :
    position === 'bottom-left' ? 'scale(1, -1)' :
    position === 'bottom-right' ? 'scale(-1, -1)' :
    undefined;

  return (
    <svg viewBox="0 0 160 160" fill="none" className={className} style={{ transform, transformOrigin: 'center' }} {...props}>
      <g opacity="0.85">
        {/* Soft watercolor blush petals */}
        <circle cx="45" cy="45" r="28" fill="#F4D3DC" fillOpacity="0.65" />
        <circle cx="35" cy="65" r="22" fill="#E8BCC8" fillOpacity="0.55" />
        <circle cx="65" cy="35" r="24" fill="#F8DEE5" fillOpacity="0.75" />
        <circle cx="50" cy="50" r="15" fill="#DF9CAE" fillOpacity="0.4" />
        
        {/* Rose core contours */}
        <path d="M42 40 C 48 35, 55 42, 50 48 C 45 54, 38 46, 42 40" stroke="#B87588" strokeWidth="1.2" fill="none" />
        <path d="M36 36 C 52 28, 62 44, 56 56 C 50 68, 32 60, 36 36" stroke="#C48496" strokeWidth="1" fill="none" opacity="0.8" />
        <path d="M30 32 C 58 20, 72 48, 62 66 C 52 82, 24 74, 30 32" stroke="#D198A6" strokeWidth="0.8" fill="none" opacity="0.6" />

        {/* Small rose secondary */}
        <circle cx="95" cy="30" r="16" fill="#F4D3DC" fillOpacity="0.5" />
        <circle cx="28" cy="98" r="18" fill="#F4D3DC" fillOpacity="0.5" />
        <path d="M92 28 C 96 24, 100 28, 98 32 C 95 35, 90 32, 92 28" stroke="#B87588" strokeWidth="1" fill="none" />
        <path d="M26 95 C 30 91, 35 95, 32 99 C 29 102, 24 99, 26 95" stroke="#B87588" strokeWidth="1" fill="none" />

        {/* Sage / eucalyptus leaves */}
        <path d="M75 18 C 90 8, 115 12, 125 25 C 112 32, 88 28, 75 18 Z" fill="#9FB59E" fillOpacity="0.6" />
        <path d="M75 18 C 95 18, 110 22, 125 25" stroke="#799477" strokeWidth="0.8" opacity="0.7" />

        <path d="M18 75 C 8 90, 12 115, 25 125 C 32 112, 28 88, 18 75 Z" fill="#9FB59E" fillOpacity="0.6" />
        <path d="M18 75 C 18 95, 22 110, 25 125" stroke="#799477" strokeWidth="0.8" opacity="0.7" />

        <path d="M82 48 C 105 45, 128 62, 135 80 C 115 78, 95 65, 82 48 Z" fill="#B2C4B1" fillOpacity="0.55" />
        <path d="M48 82 C 45 105, 62 128, 80 135 C 78 115, 65 95, 48 82 Z" fill="#B2C4B1" fillOpacity="0.55" />

        {/* Golden fine sprig accents */}
        <path d="M60 25 Q 90 35 110 40" stroke="#C8A26A" strokeWidth="1" strokeLinecap="round" opacity="0.75" />
        <circle cx="110" cy="40" r="2.5" fill="#C8A26A" opacity="0.8" />
        <circle cx="95" cy="36" r="2" fill="#C8A26A" opacity="0.8" />
        <path d="M25 60 Q 35 90 40 110" stroke="#C8A26A" strokeWidth="1" strokeLinecap="round" opacity="0.75" />
        <circle cx="40" cy="110" r="2.5" fill="#C8A26A" opacity="0.8" />
        <circle cx="36" cy="95" r="2" fill="#C8A26A" opacity="0.8" />
      </g>
    </svg>
  );
}

// Sidebar Navigation Icons
export function OverviewNavIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function StudioNavIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

export function GuestsNavIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

export function SeatingNavIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="4" x2="12" y2="7" />
      <line x1="12" y1="17" x2="12" y2="20" />
      <line x1="4" y1="12" x2="7" y2="12" />
      <line x1="17" y1="12" x2="20" y2="12" />
    </svg>
  );
}

export function CompatibilityNavIcon({ className = 'w-4 h-4', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M7 16V4m0 0L3 8m4-4l4 4" />
      <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
}

export function LogoutNavIcon({ className = 'w-3.5 h-3.5', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// Ornaments for Wedding Templates
export function TemplateOrnament({ template, className = 'w-5 h-5' }: { template: string; className?: string }) {
  switch (template) {
    case 'soft-colorful': // Bloom Romance: delicate floral flower
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
          <circle cx="12" cy="12" r="2.5" fill="currentColor" fillOpacity="0.3" />
          <path d="M12 4.5a3 3 0 013 3c0 2-3 4.5-3 4.5s-3-2.5-3-4.5a3 3 0 013-3z" fill="currentColor" fillOpacity="0.15" />
          <path d="M19.5 12a3 3 0 01-3 3c-2 0-4.5-3-4.5-3s2.5-3 4.5-3a3 3 0 013 3z" fill="currentColor" fillOpacity="0.15" />
          <path d="M12 19.5a3 3 0 01-3-3c0-2 3-4.5 3-4.5s3 2.5 3 4.5a3 3 0 01-3 3z" fill="currentColor" fillOpacity="0.15" />
          <path d="M4.5 12a3 3 0 013-3c2 0 4.5 3 4.5 3s-2.5 3-4.5 3a3 3 0 01-3-3z" fill="currentColor" fillOpacity="0.15" />
        </svg>
      );
    case 'azeri': // Azerbaijani National Heritage: geometric star / shebeke rosette
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)" strokeWidth="1.4" />
          <rect x="6" y="6" width="12" height="12" strokeWidth="1.4" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      );
    case 'minimal': // Minimal: fine crosshair
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
          <line x1="12" y1="4" x2="12" y2="20" />
          <line x1="4" y1="12" x2="20" y2="12" />
        </svg>
      );
    case 'botanical': // Botanical: leaf spray / olive branch
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className={className}>
          <path d="M4 20c4-6 10-10 16-16-1 7-5 13-11 16-2 1-3.5 1-5 0z" fill="currentColor" fillOpacity="0.2" />
          <path d="M7 13c1.5-2.5 4-4 7-5" />
          <path d="M11 17c1.5-1.5 3-2.5 5-3" />
        </svg>
      );
    case 'romantic': // Midnight: four-point radiant star
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M12 2C12 7.5 7.5 12 2 12c5.5 0 10 4.5 10 10 0-5.5 4.5-10 10-10-5.5 0-10-4.5-10-10z" />
        </svg>
      );
    case 'classic': // Classic Cream: delicate rose / floral heart
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" fillOpacity="0.2" />
        </svg>
      );
    case 'modern': // Modern Photo: camera lens / cinematic star
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3.5" fill="currentColor" fillOpacity="0.25" />
          <line x1="12" y1="3" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="21" />
          <line x1="3" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="21" y2="12" />
        </svg>
      );
    case 'elegant':
    default: // Editorial Luxury: 8-point faceted diamond star
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2L12 2z" />
          <circle cx="12" cy="11" r="1.5" fill="#fff" />
        </svg>
      );
  }
}

