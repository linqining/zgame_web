import { Check, CircleDot, Flag, LockKeyhole, RefreshCw, ShieldCheck, UserRound, Zap } from "lucide-react";
import { useState } from "react";
import tableImage from "../assets/poker/table.svg";
import hiddenCard from "../assets/poker/cards/hiddenhidden.png";
import aceOfClubs from "../assets/poker/cards/cA.png";
import kingOfHearts from "../assets/poker/cards/hK.png";
import tenOfDiamonds from "../assets/poker/cards/d10.png";

type Seat = {
  id: number;
  name: string;
  initials: string;
  stack: string;
  position: string;
};

const seats: Seat[] = [
  { id: 1, name: "Cipher", initials: "C", stack: "2,450", position: "left-[1%] top-[31%]" },
  { id: 2, name: "Nova", initials: "N", stack: "1,980", position: "left-1/2 top-[2%] -translate-x-1/2" },
  { id: 3, name: "Mira", initials: "M", stack: "3,120", position: "right-[1%] top-[31%]" },
  { id: 4, name: "Atlas", initials: "A", stack: "1,760", position: "right-[1%] top-[75%]" },
  { id: 5, name: "Sora", initials: "S", stack: "2,890", position: "left-[1%] top-[75%]" },
];

function Card({ src, alt, revealed = true }: { src: string; alt: string; revealed?: boolean }) {
  return (
    <div className="w-[clamp(28px,6vw,66px)] overflow-hidden rounded-md border border-white/30 bg-white shadow-[0_8px_16px_rgba(0,0,0,0.28)]">
      <img src={src} alt={alt} className={`block aspect-[5/7] w-full object-cover ${revealed ? "" : "brightness-75"}`} />
    </div>
  );
}

export function PokerTablePreview() {
  const [activeSeat, setActiveSeat] = useState(2);
  const [lastAction, setLastAction] = useState("Nova to act");

  const act = (action: string) => {
    setLastAction(`${action} submitted · proof queued`);
  };

  return (
    <div className="card overflow-hidden p-4 shadow-2xl sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-700/70 pb-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">Aleo game table</div>
          <div className="mt-1 text-base font-semibold text-white">Table #0001 · Texas Hold&apos;em</div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-mint-500/25 bg-mint-500/10 px-3 py-1.5 text-xs font-semibold text-mint-300">
          <span className="h-1.5 w-1.5 rounded-full bg-mint-400 animate-pulse-glow" />
          <span>Proof-backed play</span>
        </div>
      </div>

      <div className="relative mt-4 aspect-[1097/545] overflow-hidden rounded-2xl border border-ink-700/70 bg-[#07100d] shadow-inner">
        <img src={tableImage} alt="ZGame poker table" className="absolute inset-0 h-full w-full object-contain" />

        {seats.map((seat) => (
          <button
            key={seat.id}
            type="button"
            aria-label={`${seat.name} seat`}
            aria-pressed={activeSeat === seat.id}
            title={`Select ${seat.name}`}
            onClick={() => {
              setActiveSeat(seat.id);
              setLastAction(`${seat.name} selected`);
            }}
            className={`absolute z-10 flex aspect-square w-[15%] min-w-[58px] max-w-[118px] -translate-y-1/2 flex-col items-center justify-center rounded-full border-4 bg-ink-850/95 text-center shadow-xl transition-all duration-200 hover:scale-105 ${
              activeSeat === seat.id
                ? "border-mint-300 shadow-[0_0_28px_rgba(52,211,153,0.42)]"
                : "border-[#6297b5]"
            } ${seat.position}`}
          >
            <span className="flex h-[42%] w-[42%] items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-ink-600 to-ink-900 font-mono text-[clamp(10px,1.4vw,16px)] font-bold text-gray-100">
              {seat.initials}
            </span>
            <span className="mt-1 max-w-[86%] truncate text-[clamp(8px,1.25vw,13px)] font-semibold text-white">{seat.name}</span>
            <span className="font-mono text-[clamp(7px,1vw,11px)] text-mint-300">{seat.stack}</span>
          </button>
        ))}

        <div className="absolute left-1/2 top-[48%] z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 sm:gap-2">
          <Card src={aceOfClubs} alt="Ace of clubs" />
          <Card src={kingOfHearts} alt="King of hearts" />
          <Card src={tenOfDiamonds} alt="Ten of diamonds" />
          <Card src={hiddenCard} alt="Encrypted card" revealed={false} />
          <Card src={hiddenCard} alt="Encrypted card" revealed={false} />
        </div>

        <div className="absolute left-1/2 top-[66%] z-10 -translate-x-1/2 rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 font-mono text-[clamp(7px,1vw,11px)] uppercase tracking-wider text-amber-200 shadow-lg sm:px-3">
          pot 4,860
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <CircleDot className="h-3.5 w-3.5 text-mint-400" />
          <span>{lastAction}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <LockKeyhole className="h-3.5 w-3.5 text-mint-400" />
          <span>Hole cards encrypted</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button type="button" onClick={() => act("Fold")} className="btn-ghost !px-3 !py-2 text-xs">
          <Flag className="h-3.5 w-3.5" /> Fold
        </button>
        <button type="button" onClick={() => act("Check")} className="btn-ghost !px-3 !py-2 text-xs">
          <Check className="h-3.5 w-3.5" /> Check
        </button>
        <button type="button" onClick={() => act("Raise 240")} className="btn-primary !px-3 !py-2 text-xs">
          <Zap className="h-3.5 w-3.5" /> Raise 240
        </button>
        <button type="button" onClick={() => setLastAction("Table state refreshed")} className="btn-ghost !px-3 !py-2 text-xs" title="Refresh table state">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
        <div className="rounded-xl border border-ink-700 bg-ink-900/70 p-3">
          <div className="font-mono text-[9px] uppercase tracking-wider text-gray-600">Players</div>
          <div className="mt-1 flex items-center gap-1.5 font-semibold text-gray-200"><UserRound className="h-3.5 w-3.5 text-mint-400" /> 5 / 5 seated</div>
        </div>
        <div className="rounded-xl border border-ink-700 bg-ink-900/70 p-3">
          <div className="font-mono text-[9px] uppercase tracking-wider text-gray-600">Custody</div>
          <div className="mt-1 flex items-center gap-1.5 font-semibold text-gray-200"><ShieldCheck className="h-3.5 w-3.5 text-mint-400" /> Aleo program</div>
        </div>
        <div className="col-span-2 rounded-xl border border-mint-500/20 bg-mint-500/[0.06] p-3 sm:col-span-1">
          <div className="font-mono text-[9px] uppercase tracking-wider text-gray-600">Settlement</div>
          <div className="mt-1 flex items-center gap-1.5 font-semibold text-mint-300"><ShieldCheck className="h-3.5 w-3.5" /> Player approved</div>
        </div>
      </div>
    </div>
  );
}
