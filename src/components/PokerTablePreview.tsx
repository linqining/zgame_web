import { Check, CircleDot, Flag, LockKeyhole, RefreshCw, ShieldCheck, UserRound, Zap } from "lucide-react";
import { useState } from "react";
import type { AleoTable } from "../aleo/api";
import hiddenCard from "../assets/poker/cards/hiddenhidden.png";
import tableImage from "../assets/poker/table.svg";

type ActionKind = "check" | "call" | "fold" | "bet" | "raise";

type PokerTablePreviewProps = {
  table?: AleoTable;
  currentAddress?: string;
  busy?: boolean;
  status?: string;
  onAction?: (kind: ActionKind, amount?: number) => void;
  onRefresh?: () => void;
};

const seatPositions = [
  "left-[1%] top-[31%]",
  "left-1/2 top-[2%] -translate-x-1/2",
  "right-[1%] top-[31%]",
  "right-[1%] top-[75%]",
  "left-[1%] top-[75%]",
];

const actionLabels: Record<ActionKind, string> = {
  fold: "Fold",
  check: "Check",
  call: "Call",
  bet: "Bet",
  raise: "Raise",
};

const previewSeats = [
  { seat: 0, address: "mock:cipher", stack: 2450, bet: 0, total_bet: 0, folded: false, all_in: false },
  { seat: 1, address: "mock:nova", stack: 1980, bet: 0, total_bet: 0, folded: false, all_in: false },
  { seat: 2, address: "mock:mira", stack: 3120, bet: 0, total_bet: 0, folded: false, all_in: false },
  { seat: 3, address: "mock:atlas", stack: 1760, bet: 0, total_bet: 0, folded: false, all_in: false },
  { seat: 4, address: "mock:sora", stack: 2890, bet: 0, total_bet: 0, folded: false, all_in: false },
];

function displayName(address: string) {
  if (address.startsWith("mock:")) return address.slice(5);
  return `${address.slice(0, 8)}…${address.slice(-4)}`;
}

function initials(address: string) {
  const name = displayName(address);
  return name.slice(0, 2).toUpperCase();
}

function amountLabel(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function Card({ revealed = false }: { revealed?: boolean }) {
  return (
    <div className="w-[clamp(28px,6vw,66px)] overflow-hidden rounded-md border border-white/30 bg-white shadow-[0_8px_16px_rgba(0,0,0,0.28)]">
      <img
        src={hiddenCard}
        alt={revealed ? "Revealed card" : "Encrypted card"}
        className={`block aspect-[5/7] w-full object-cover ${revealed ? "" : "brightness-75"}`}
      />
    </div>
  );
}

function phaseLabel(table?: AleoTable) {
  if (!table) return "Proof-backed play";
  if (table.phase === "betting") return table.chain_status === "confirmed" || table.chain_status === "mock" ? "Player action" : "Awaiting confirmation";
  if (table.phase === "reveal") return "Private reveal";
  if (table.phase === "showdown_ready") return "Showdown ready";
  return "Hand complete";
}

export function PokerTablePreview({
  table,
  currentAddress,
  busy = false,
  status,
  onAction,
  onRefresh,
}: PokerTablePreviewProps) {
  const [amount, setAmount] = useState(10);
  const fallbackActions: ActionKind[] = ["fold", "check", "raise"];
  const availableActions = table?.available_actions ?? fallbackActions;
  const seats = Array.from({ length: 5 }, (_, index) => table ? table.seats[index] : previewSeats[index]);
  const currentTurn = table ? table.current_turn : "mock:nova";
  const canAct = Boolean(table && currentAddress && currentTurn === currentAddress && !busy && onAction);

  return (
    <div className="card overflow-hidden p-4 shadow-2xl sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-700/70 pb-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">Aleo game table</div>
          <div className="mt-1 text-base font-semibold text-white">
            {table ? `Table ${table.id.slice(0, 12)}… · Texas Hold'em` : "Table preview · Texas Hold'em"}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-mint-500/25 bg-mint-500/10 px-3 py-1.5 text-xs font-semibold text-mint-300">
          <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-mint-400" />
          <span>{phaseLabel(table)}</span>
        </div>
      </div>

      <div className="relative mt-4 aspect-[1097/545] overflow-hidden rounded-2xl border border-ink-700/70 bg-[#07100d] shadow-inner">
        <img src={tableImage} alt="ZGame poker table" className="absolute inset-0 h-full w-full object-contain" />

        {seats.map((seat, index) => (
          <div
            key={seat?.seat ?? `empty-${index}`}
            className={`absolute z-10 flex aspect-square w-[15%] min-w-[58px] max-w-[118px] -translate-y-1/2 flex-col items-center justify-center rounded-full border-4 bg-ink-850/95 text-center shadow-xl ${seatPositions[index]} ${
              seat && seat.address === currentTurn
                ? "border-mint-300 shadow-[0_0_28px_rgba(52,211,153,0.42)]"
                : seat
                  ? "border-[#6297b5]"
                  : "border-dashed border-ink-600/80 opacity-60"
            }`}
          >
            {seat ? (
              <>
                <span className="flex h-[42%] w-[42%] items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-ink-600 to-ink-900 font-mono text-[clamp(10px,1.4vw,16px)] font-bold text-gray-100">
                  {initials(seat.address)}
                </span>
                <span className="mt-1 max-w-[86%] truncate text-[clamp(8px,1.25vw,13px)] font-semibold text-white">{displayName(seat.address)}</span>
                <span className="font-mono text-[clamp(7px,1vw,11px)] text-mint-300">{amountLabel(seat.stack)}</span>
                {seat.folded && <span className="text-[8px] uppercase text-amber-300">folded</span>}
              </>
            ) : (
              <span className="font-mono text-[clamp(8px,1vw,11px)] uppercase tracking-wider text-gray-600">Open seat</span>
            )}
          </div>
        ))}

        <div className="absolute left-1/2 top-[48%] z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 sm:gap-2">
          {Array.from({ length: 5 }, (_, index) => <Card key={index} />)}
        </div>

        <div className="absolute left-1/2 top-[66%] z-10 -translate-x-1/2 rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 font-mono text-[clamp(7px,1vw,11px)] uppercase tracking-wider text-amber-200 shadow-lg sm:px-3">
          pot {amountLabel(table?.pot ?? 4860)}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-xs text-gray-400">
          <CircleDot className="h-3.5 w-3.5 shrink-0 text-mint-400" />
          <span className="truncate">{status ?? (currentTurn ? `${displayName(currentTurn)} to act` : "Waiting for the next proof transition")}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <LockKeyhole className="h-3.5 w-3.5 text-mint-400" />
          <span>Hole cards encrypted</span>
        </div>
      </div>

      {onAction ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {availableActions.map((action) => (
            <button
              key={action}
              type="button"
              disabled={!canAct || (action === "bet" || action === "raise") && amount < 1}
              onClick={() => onAction(action, action === "bet" || action === "raise" ? amount : undefined)}
              className={`${action === "raise" || action === "bet" ? "btn-primary" : "btn-ghost"} !px-3 !py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {action === "fold" ? <Flag className="h-3.5 w-3.5" /> : action === "check" || action === "call" ? <Check className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
              {actionLabels[action]}
            </button>
          ))}
          <label className="col-span-2 flex items-center gap-2 rounded-xl border border-ink-600 bg-ink-800/60 px-3 py-2 text-xs text-gray-400 sm:col-span-1">
            <span className="font-mono uppercase tracking-wider">Amount</span>
            <input className="w-full min-w-0 bg-transparent text-right font-mono text-gray-100 outline-none" type="number" min={1} value={amount} onChange={(event) => setAmount(Math.max(1, Number(event.target.value) || 1))} />
          </label>
          {onRefresh && <button type="button" disabled={busy} onClick={onRefresh} className="btn-ghost !px-3 !py-2 text-xs" title="Refresh table state"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button type="button" className="btn-ghost !px-3 !py-2 text-xs"><Flag className="h-3.5 w-3.5" /> Fold</button>
          <button type="button" className="btn-ghost !px-3 !py-2 text-xs"><Check className="h-3.5 w-3.5" /> Check</button>
          <button type="button" className="btn-primary !px-3 !py-2 text-xs"><Zap className="h-3.5 w-3.5" /> Raise</button>
          <button type="button" onClick={onRefresh} className="btn-ghost !px-3 !py-2 text-xs"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
        <div className="rounded-xl border border-ink-700 bg-ink-900/70 p-3">
          <div className="font-mono text-[9px] uppercase tracking-wider text-gray-600">Players</div>
          <div className="mt-1 flex items-center gap-1.5 font-semibold text-gray-200"><UserRound className="h-3.5 w-3.5 text-mint-400" /> {table ? `${table.seats.length} / 3 seated` : "5 / 5 seated"}</div>
        </div>
        <div className="rounded-xl border border-ink-700 bg-ink-900/70 p-3">
          <div className="font-mono text-[9px] uppercase tracking-wider text-gray-600">Custody</div>
          <div className="mt-1 flex items-center gap-1.5 font-semibold text-gray-200"><ShieldCheck className="h-3.5 w-3.5 text-mint-400" /> Aleo program</div>
        </div>
        <div className="col-span-2 rounded-xl border border-mint-500/20 bg-mint-500/[0.06] p-3 sm:col-span-1">
          <div className="font-mono text-[9px] uppercase tracking-wider text-gray-600">Settlement</div>
          <div className="mt-1 flex items-center gap-1.5 font-semibold text-mint-300"><ShieldCheck className="h-3.5 w-3.5" /> {table?.chain_status === "confirmed" ? "Chain confirmed" : "Player approved"}</div>
        </div>
      </div>
    </div>
  );
}
