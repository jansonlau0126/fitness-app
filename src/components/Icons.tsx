// Simple line icons for gym equipment, drawn for this app (48×48 grid, currentColor).
import type { ReactNode } from 'react';

const P: Record<string, ReactNode> = {
  barbell: <>
    <path d="M3 24h42" />
    <rect x="9" y="13" width="5" height="22" rx="1.5" className="f" /><rect x="15" y="17" width="3.5" height="14" rx="1" />
    <rect x="34" y="13" width="5" height="22" rx="1.5" className="f" /><rect x="29.5" y="17" width="3.5" height="14" rx="1" />
  </>,
  'ez-bar': <>
    <path d="M3 24h8M37 24h8M13 24l3-4 4 8 4-8 4 8 4-8 2 4" />
    <rect x="7" y="16" width="4.5" height="16" rx="1.5" className="f" /><rect x="36.5" y="16" width="4.5" height="16" rx="1.5" className="f" />
  </>,
  'trap-bar': <>
    <path d="M15 13h18l9 11-9 11H15L6 24z" /><path d="M19 19v10M29 19v10" strokeWidth="3.2" />
    <path d="M6 24H2M42 24h4" />
  </>,
  plates: <>
    <circle cx="24" cy="24" r="17" className="f" /><circle cx="24" cy="24" r="11" /><circle cx="24" cy="24" r="3.5" />
  </>,
  dumbbell: <>
    <path d="M17 24h14" strokeWidth="3" />
    <rect x="9" y="14" width="8" height="20" rx="2.5" className="f" /><rect x="31" y="14" width="8" height="20" rx="2.5" className="f" />
    <path d="M6 19v10M42 19v10" strokeWidth="3" />
  </>,
  kettlebell: <>
    <path d="M17 22v-4a7 7 0 0 1 14 0v4" strokeWidth="3" />
    <path d="M13 31a11 11 0 1 1 22 0c0 5-2 8-3 9H16c-1-1-3-4-3-9z" className="f" />
  </>,
  cable: <>
    <rect x="6" y="5" width="11" height="38" rx="2" /><path d="M8.5 15h6M8.5 20h6M8.5 25h6M8.5 30h6" />
    <circle cx="36" cy="9" r="3.5" /><path d="M17 7h15.5M36 12.5V31" /><path d="M30 34h12" strokeWidth="3.2" /><path d="M6 43h36" />
  </>,
  smith: <>
    <path d="M10 4v40M38 4v40M5 44h38" /><path d="M4 21h40" strokeWidth="2.6" />
    <rect x="12" y="15" width="4" height="12" rx="1" className="f" /><rect x="32" y="15" width="4" height="12" rx="1" className="f" />
  </>,
  bench: <>
    <rect x="5" y="19" width="38" height="7" rx="3.5" className="f" />
    <path d="M12 26v13M36 26v13M7 39h10M31 39h10M24 26v6" />
  </>,
  rack: <>
    <path d="M10 4v40M38 4v40M5 44h38" /><path d="M13 12h3M13 20h3M13 28h3M32 12h3M32 20h3M32 28h3" />
    <path d="M4 16h40" strokeWidth="2.6" /><path d="M8 32h32" strokeDasharray="3 3" />
  </>,
  'pullup-bar': <>
    <path d="M4 8h40" strokeWidth="3" /><circle cx="24" cy="17" r="3.5" className="f" />
    <path d="M24 21v12M24 24l-6-16M24 24l6-16M24 33l-4 11M24 33l4 11" />
  </>,
  'dip-bars': <>
    <path d="M4 18h16M28 18h16" strokeWidth="3" /><path d="M8 18v26M16 18v26M32 18v26M40 18v26M4 44h40" />
  </>,
  band: <>
    <path d="M12 34C8 20 16 8 24 8s16 12 12 26" strokeWidth="3.2" />
    <rect x="5" y="34" width="12" height="5" rx="2.5" className="f" /><rect x="31" y="34" width="12" height="5" rx="2.5" className="f" />
  </>,
  'leg-press': <>
    <path d="M6 42L40 8" /><path d="M32 6l10 10" strokeWidth="3.2" /><path d="M8 26v16h14" /><path d="M8 30l8 6" />
    <rect x="24" y="16" width="8" height="8" rx="1.5" transform="rotate(45 28 20)" className="f" />
  </>,
  machine: <>
    <rect x="6" y="5" width="13" height="38" rx="2" /><path d="M8.5 12h8M8.5 17h8M8.5 22h8M8.5 27h8M8.5 32h8" />
    <circle cx="12.5" cy="24.5" r="1.6" className="f" /><path d="M26 32h14v11M26 43h14" /><path d="M31 32V14l9-5" /><path d="M3 43h42" />
  </>,
  'ab-wheel': <>
    <circle cx="24" cy="26" r="11" className="f" /><circle cx="24" cy="26" r="3" /><path d="M5 26h10M33 26h10" strokeWidth="3.4" />
  </>,
  bodyweight: <>
    <circle cx="24" cy="9" r="4" className="f" /><path d="M24 14v16M24 18l-10-8M24 18l10-8M24 30l-7 14M24 30l7 14" />
  </>,
};

export function EquipIcon({ id, className }: { id: string; className?: string }) {
  return (
    <svg className={`eq-svg ${className ?? ''}`} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {P[id] ?? P.dumbbell}
    </svg>
  );
}
