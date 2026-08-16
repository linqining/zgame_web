import { ArrowLeft, Check, CircleDot, Flag, LockKeyhole, LogOut, RefreshCw, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import type { AleoTable } from "../aleo/api";
import hiddenCard from "../assets/poker/cards/hiddenhidden.png";
import tableImage from "../assets/poker/table.svg";

type ActionKind = "check" | "call" | "fold" | "bet" | "raise";

type PokerTablePreviewProps = {
  table?: AleoTable;
  currentAddress?: string;
  busy?: boolean;
  status?: string;
  liveState?: "offline" | "connecting" | "live";
  turnTimeoutSeconds?: number;
  serverTimeOffsetSeconds?: number;
  onAction?: (kind: ActionKind, amount?: number) => void;
  onConfirmCreation?: () => void;
  onRefresh?: () => void;
  onLobby?: () => void;
  onLeave?: () => void;
};

const seatPositions = [
  "left-[2%] top-[42%]",
  "left-1/2 top-[7%] -translate-x-1/2",
  "right-[2%] top-[42%]",
  "right-[2%] top-[78%]",
  "left-[2%] top-[78%]",
];

const actionLabels: Record<ActionKind, string> = {
  fold: "Fold",
  check: "Check",
  call: "Call",
  bet: "Bet",
  raise: "Raise",
};

function displayName(address: string) {
  if (address.startsWith("mock:")) return address.slice(5);
  return `${address.slice(0, 8)}…${address.slice(-4)}`;
}

function amountLabel(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function countdown(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const suits = ["♣", "♦", "♥", "♠"];

function Card({ value, faceDown = false }: { value?: number; faceDown?: boolean }) {
  if (faceDown) {
    return (
      <div className="w-[clamp(30px,5.6vw,72px)] overflow-hidden rounded-md border border-white/30 bg-white shadow-[0_8px_16px_rgba(0,0,0,0.36)]">
        <img src={hiddenCard} alt="Hidden card" className="block aspect-[5/7] w-full brightness-75" />
      </div>
    );
  }
  if (value === undefined || value < 0 || value >= 52) {
    return <div aria-hidden="true" className="aspect-[5/7] w-[clamp(30px,5.6vw,72px)] rounded-md border border-dashed border-white/15 bg-black/15" />;
  }
  const rank = ranks[Math.floor(value / 4)];
  const suit = suits[value % 4];
  const red = suit === "♦" || suit === "♥";
  return (
    <div aria-label={`${rank}${suit}`} className={`relative aspect-[5/7] w-[clamp(30px,5.6vw,72px)] rounded-md border border-gray-200 bg-white p-1 font-serif shadow-[0_8px_16px_rgba(0,0,0,0.36)] ${red ? "text-rose-600" : "text-gray-950"}`}>
      <span className="block text-[clamp(10px,1.45vw,18px)] font-bold leading-none">{rank}</span>
      <span className="block text-[clamp(11px,1.5vw,20px)] leading-none">{suit}</span>
      <span className="absolute bottom-1 right-1 text-[clamp(15px,2.2vw,30px)] leading-none">{suit}</span>
    </div>
  );
}

export function PokerTablePreview({
  table,
  currentAddress,
  busy = false,
  status,
  liveState = "offline",
  turnTimeoutSeconds = 20,
  serverTimeOffsetSeconds = 0,
  onAction,
  onConfirmCreation,
  onRefresh,
  onLobby,
  onLeave,
}: PokerTablePreviewProps) {
  const [amount, setAmount] = useState(10);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000) + serverTimeOffsetSeconds);
  const seats = Array.from({ length: 5 }, (_, index) => table?.seats[index]);
  const currentTurn = table?.current_turn;
  const currentTurnSeat = currentTurn ? seats.find((seat) => seat?.address === currentTurn) : undefined;
  const ownSeat = table?.seats.find((seat) => seat.address === currentAddress);
  const callAmount = Math.min(ownSeat?.stack ?? 0, Math.max(0, (table?.current_bet ?? 0) - (ownSeat?.bet ?? 0)));
  const isOwnTurn = Boolean(currentAddress && currentTurn === currentAddress);
  const timeoutAt = currentTurn && table?.phase === "betting"
    ? table.turn_started_at + turnTimeoutSeconds
    : undefined;
  const secondsRemaining = timeoutAt === undefined ? undefined : Math.max(0, timeoutAt - now);
  const timeoutExpired = Boolean(timeoutAt !== undefined && now >= timeoutAt);
  const nextHandAt = table?.next_hand_at;
  const intermissionSeconds = nextHandAt === undefined ? undefined : Math.max(0, nextHandAt - now);
  const canAct = Boolean(table && isOwnTurn && !ownSeat?.leaving && !ownSeat?.left && !busy && onAction && (table.chain_status === "confirmed" || table.chain_status === "mock"));
  const availableActions = table?.available_actions ?? [];
  // The server receives bet/raise as the player's total contribution on this
  // street. Include chips already committed so the slider can form a valid
  // raise after blinds or a prior call.
  const wagerMaximum = Math.max(1, (ownSeat?.bet ?? 0) + (ownSeat?.stack ?? amount));
  const wagerMinimum = Math.min(
    wagerMaximum,
    table?.current_bet
      ? table.current_bet + table.min_raise
      : Math.max(1, table?.min_raise ?? 1),
  );
  const selectedAmount = Math.max(wagerMinimum, Math.min(amount, wagerMaximum));
  const tableReady = table?.chain_status === "confirmed" || table?.chain_status === "mock";

  useEffect(() => {
    if (timeoutAt === undefined && nextHandAt === undefined) return;
    setNow(Math.floor(Date.now() / 1000) + serverTimeOffsetSeconds);
    const timer = window.setInterval(() => setNow(Math.floor(Date.now() / 1000) + serverTimeOffsetSeconds), 1000);
    return () => window.clearInterval(timer);
  }, [timeoutAt, nextHandAt, serverTimeOffsetSeconds]);

  const message = tableReady
    ? status || (currentTurn ? `${currentTurnSeat ? `Seat ${currentTurnSeat.seat + 1}` : "A seated player"} is on turn` : "Waiting for the next hand")
    : "Waiting for Aleo table creation confirmation";

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#0c120f] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(31,76,53,0.36),transparent_42%),linear-gradient(180deg,#101a14_0%,#08100d_72%)]" />

      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onLobby} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs font-semibold text-gray-200 backdrop-blur transition hover:bg-white/10">
            <ArrowLeft className="h-3.5 w-3.5" /> Lobby
          </button>
          {ownSeat && !ownSeat.left && onLeave && <button title="Leave table and cash out" type="button" onClick={onLeave} disabled={busy || ownSeat.leaving} className="inline-flex items-center gap-2 rounded-xl border border-rose-200/20 bg-black/30 px-3 py-2 text-xs font-semibold text-rose-100 backdrop-blur transition hover:bg-rose-300/10 disabled:opacity-40">
            <LogOut className="h-3.5 w-3.5" /> {ownSeat.leaving ? "Leaving" : "Leave"}
          </button>}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-2 text-[11px] font-medium backdrop-blur">
          <span className={`h-2 w-2 rounded-full ${liveState === "live" ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.85)]" : "bg-amber-300"}`} />
          {liveState === "live" ? "LIVE TABLE" : liveState === "connecting" ? "CONNECTING" : "RECONNECTING"}
          {table && <span className="hidden border-l border-white/10 pl-2 font-mono text-gray-400 sm:inline">{table.id.slice(0, 10)}…</span>}
        </div>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1440px] items-center px-3 pb-36 pt-16 sm:px-8 sm:pb-40">
        <div className="relative mx-auto w-full max-w-[1220px] aspect-[1097/610] min-h-[340px]">
          <img src={tableImage} alt="ZGame poker table" className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_26px_44px_rgba(0,0,0,0.55)]" />

          {seats.map((seat, index) => (
            <div
              key={seat?.seat ?? `empty-${index}`}
              className={`absolute z-10 flex aspect-square w-[15.5%] min-w-[66px] max-w-[132px] -translate-y-1/2 flex-col items-center justify-center rounded-full border-[3px] bg-[#121a19]/95 text-center shadow-2xl backdrop-blur ${seatPositions[index]} ${
                seat?.address === currentTurn
                  ? "border-emerald-300 shadow-[0_0_28px_rgba(52,211,153,0.5)]"
                  : seat?.address === currentAddress
                    ? "border-sky-300 shadow-[0_0_24px_rgba(125,211,252,0.42)]"
                    : seat
                      ? "border-[#568097]"
                      : "border-dashed border-white/15 opacity-45"
              }`}
            >
              {seat ? <>
                <span className={`flex h-[38%] w-[38%] items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-slate-900 font-mono text-[clamp(10px,1.25vw,16px)] font-bold text-white ${seat.address === currentTurn && !timeoutExpired ? "turn-avatar" : ""}`}>{displayName(seat.address).slice(0, 2).toUpperCase()}</span>
                <span className="mt-1 max-w-[84%] truncate text-[clamp(8px,1.1vw,13px)] font-semibold text-white">{displayName(seat.address)}</span>
                <span className="font-mono text-[clamp(8px,1vw,12px)] text-emerald-300">{amountLabel(seat.stack)}</span>
                {seat.address === currentAddress && <span className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.16em] text-sky-200">You · Seat {seat.seat + 1}</span>}
                {seat.folded && <span className="text-[8px] uppercase text-amber-300">Folded</span>}
                {seat.leaving && <span className="text-[8px] uppercase text-rose-200">Leaving</span>}
                {seat.left && <span className="text-[8px] uppercase text-gray-400">Cashed out</span>}
              </> : <span className="text-[9px] uppercase tracking-[0.15em] text-gray-500">Open seat</span>}
            </div>
          ))}

          <div className="absolute left-1/2 top-[46%] z-10 flex -translate-x-1/2 -translate-y-1/2 gap-1 sm:gap-2">
            {Array.from({ length: 5 }, (_, index) => <Card key={index} value={table?.community[index]} />)}
          </div>
          <div className="absolute left-1/2 top-[62%] z-10 -translate-x-1/2 rounded-full border border-amber-200/30 bg-[#1d1a11]/90 px-3 py-1.5 font-mono text-[clamp(9px,1.15vw,13px)] font-semibold uppercase tracking-[0.14em] text-amber-100 shadow-xl">
            Pot {amountLabel(table?.pot ?? 0)}
          </div>
          <div className="absolute bottom-[5%] left-1/2 z-10 flex max-w-[82%] -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-2 text-center text-[11px] text-gray-200 backdrop-blur sm:text-xs">
            <CircleDot className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
            <span className="truncate">{intermissionSeconds !== undefined ? `Hand complete · next hand in ${countdown(intermissionSeconds)}` : message}</span>
          </div>
          {ownSeat && !ownSeat.left && (
            <div className="absolute bottom-[16%] left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {table?.hole_cards
                ? table.hole_cards.map((card, index) => <Card key={`${table.hand_id}-${index}`} value={card} />)
                : [0, 1].map((index) => <Card key={`hidden-${index}`} faceDown />)}
            </div>
          )}
        </div>
      </section>

      {currentTurn && (
        <div className="absolute bottom-[calc(8.8rem+env(safe-area-inset-bottom))] left-1/2 z-20 -translate-x-1/2 rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-center text-[11px] backdrop-blur sm:bottom-32">
          <span className="text-gray-400">Turn: </span><span className="font-semibold text-emerald-200">Seat {currentTurnSeat ? currentTurnSeat.seat + 1 : "?"}</span>
          {secondsRemaining !== undefined && <span className={`ml-2 font-mono ${secondsRemaining === 0 ? "text-rose-200" : secondsRemaining <= 15 ? "text-amber-200" : "text-gray-200"}`}>{secondsRemaining === 0 ? "EXPIRED" : countdown(secondsRemaining)}</span>}
        </div>
      )}

      {intermissionSeconds !== undefined && (
        <div className="absolute bottom-[calc(8.8rem+env(safe-area-inset-bottom))] left-1/2 z-20 mt-1 -translate-x-1/2 translate-y-full rounded-xl border border-amber-200/20 bg-black/35 px-3 py-1.5 text-center text-[11px] text-amber-100 backdrop-blur sm:bottom-32">
          Leave or wait for the next hand · {countdown(intermissionSeconds)}
        </div>
      )}

      {table?.chain_status === "prepared" && onConfirmCreation && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 p-5 backdrop-blur-sm">
          <div className="max-w-sm rounded-2xl border border-amber-300/30 bg-[#152019] p-5 text-center shadow-2xl"><LockKeyhole className="mx-auto h-6 w-6 text-amber-200" /><h2 className="mt-3 font-semibold">Table creation is ready</h2><p className="mt-2 text-sm text-gray-300">Confirm the Aleo creation transaction to unlock this table.</p><button type="button" onClick={onConfirmCreation} disabled={busy} className="btn-primary mt-5 w-full disabled:opacity-40"><Check className="h-4 w-4" /> Confirm table creation</button></div>
        </div>
      )}

      <footer className="absolute inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0a100d]/90 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:px-6 sm:pb-4">
        {timeoutExpired ? <div className="mx-auto flex max-w-2xl items-center justify-center gap-3 rounded-xl border border-rose-400/35 bg-rose-400/10 px-4 py-3 text-sm text-rose-100"><span>Seat {currentTurnSeat ? currentTurnSeat.seat + 1 : "owner"} timed out. The server is advancing the hand…</span></div>
          : canAct ? <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 sm:gap-3">
            <div className="order-last flex w-full max-w-sm items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2 sm:order-none sm:w-[280px]"><span className="font-mono text-xs text-emerald-200">{selectedAmount}</span><input aria-label="Raise amount" className="min-w-0 flex-1 accent-emerald-400" type="range" min={wagerMinimum} max={wagerMaximum} value={selectedAmount} onChange={(event) => setAmount(Number(event.target.value))} /></div>
            {availableActions.map((action) => <button key={action} type="button" disabled={busy} onClick={() => onAction?.(action, action === "bet" || action === "raise" ? selectedAmount : undefined)} className={`${action === "bet" || action === "raise" ? "bg-emerald-300 text-[#062417] hover:bg-emerald-200" : "border border-white/15 bg-white/5 text-gray-100 hover:bg-white/10"} inline-flex min-w-[82px] items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition disabled:opacity-40`}>
              {action === "fold" ? <Flag className="h-3.5 w-3.5" /> : action === "check" || action === "call" ? <Check className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}{actionLabels[action]}{action === "call" ? ` ${callAmount}` : (action === "bet" || action === "raise") ? ` ${selectedAmount}` : ""}
            </button>)}
          </div>
          : <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 text-xs text-gray-400"><span>{ownSeat?.left ? "Cash-out completed for this seat" : ownSeat?.leaving ? "Leave requested; waiting for this hand to settle" : ownSeat ? (currentTurn ? `Waiting for Seat ${currentTurnSeat ? currentTurnSeat.seat + 1 : "?"} to act` : "Waiting for the next hand") : "Spectating this table"}</span>{onRefresh && <button type="button" onClick={onRefresh} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-2 text-gray-200 hover:bg-white/10 disabled:opacity-40"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>}</div>}
      </footer>
    </main>
  );
}
