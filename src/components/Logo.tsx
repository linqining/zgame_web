export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <rect width="64" height="64" rx="15" fill="#0c1411" stroke="#1a2622" />
      <path
        d="M19 20h25L25 43h19"
        stroke="#34d399"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M39 28h7v15h-9" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="32" r="25" stroke="#34d399" strokeWidth="1.6" strokeOpacity="0.22" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark />
      <span className="text-lg font-extrabold tracking-tight text-white">
        Z<span className="text-mint-400">Game</span>
      </span>
    </span>
  );
}
