import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Fingerprint,
  LockKeyhole,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { ParticleField } from "./ParticleField";
import { site } from "../lib/site";

const promises = [
  { icon: Wallet, label: "Aleo-native custody" },
  { icon: LockKeyhole, label: "Encrypted hole cards" },
  { icon: Fingerprint, label: "Proof-bound payouts" },
  { icon: ShieldCheck, label: "Player-approved settlement" },
];

const players = [
  { label: "P1", className: "left-4 top-1/2 -translate-y-1/2" },
  { label: "P2", className: "right-4 top-1/2 -translate-y-1/2" },
  { label: "P3", className: "left-1/2 top-3 -translate-x-1/2" },
  { label: "P4", className: "bottom-3 left-1/2 -translate-x-1/2" },
];

function EncryptedCard({ delay, rotate }: { delay: number; rotate: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
      transition={{ duration: 4.8, delay, repeat: Infinity, ease: "easeInOut" }}
      style={{ rotate }}
      className="relative flex h-24 w-16 items-center justify-center overflow-hidden rounded-xl border border-mint-400/35 bg-gradient-to-br from-ink-700 to-ink-950 shadow-[0_18px_50px_-20px_rgba(52,211,153,0.8)]"
    >
      <div className="absolute inset-1.5 rounded-lg border border-mint-400/15 bg-grid opacity-50" />
      <LockKeyhole className="relative h-5 w-5 text-mint-300" />
    </motion.div>
  );
}

function ProofTable() {
  const reduceMotion = useReducedMotion();
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-10 rounded-full bg-mint-500/[0.09] blur-[90px]" />
      <div className="card relative overflow-hidden rounded-[28px] p-4 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between border-b border-ink-700/70 pb-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
              Hand settlement preview
            </div>
            <div className="mt-1 text-sm font-semibold text-white">Table #0001 · Hold&apos;em</div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-mint-500/25 bg-mint-500/10 px-3 py-1.5 text-xs font-semibold text-mint-300">
            <span className="h-1.5 w-1.5 rounded-full bg-mint-400 animate-pulse-glow" />
            Aleo active track
          </div>
        </div>

        <div className="relative mt-4 h-[330px] overflow-hidden rounded-2xl border border-ink-700/70 bg-[#08110d] sm:h-[360px]">
          <div className="absolute inset-0 bg-grid opacity-40" />
          <div className="absolute left-1/2 top-1/2 h-[215px] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-mint-500/25 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.13),rgba(6,9,10,0.75)_68%)] shadow-[inset_0_0_60px_rgba(16,185,129,0.08)]" />
          <div className="absolute left-1/2 top-1/2 h-[155px] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-dashed border-mint-400/20" />

          {players.map((player, index) => (
            <motion.div
              key={player.label}
              animate={reduceMotion ? undefined : { boxShadow: ["0 0 0 rgba(52,211,153,0)", "0 0 24px rgba(52,211,153,.25)", "0 0 0 rgba(52,211,153,0)"] }}
              transition={{ duration: 3.2, delay: index * 0.55, repeat: Infinity }}
              className={`absolute z-10 flex h-11 w-11 items-center justify-center rounded-full border border-ink-600 bg-ink-850 font-mono text-[11px] font-semibold text-gray-300 ${player.className}`}
            >
              {player.label}
            </motion.div>
          ))}

          <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2">
            <EncryptedCard delay={0} rotate={-6} />
            <EncryptedCard delay={0.7} rotate={5} />
          </div>

          <motion.div
            animate={reduceMotion ? undefined : { scale: [0.94, 1.04, 0.94], opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-1/2 top-[72%] z-10 -translate-x-1/2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-amber-300"
          >
            proof digest bound
          </motion.div>

          <div className="absolute bottom-0 left-0 right-0 border-t border-ink-700/60 bg-ink-950/75 px-4 py-3 backdrop-blur">
            <div className="relative flex items-center justify-between">
              <div className="absolute left-[8%] right-[8%] top-2 h-px bg-gradient-to-r from-mint-400/30 via-amber-400/50 to-mint-400/30" />
              {!reduceMotion && (
                <motion.span
                  animate={{ left: ["8%", "86%"] }}
                  transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-0.5 h-3 w-3 rounded-full border-2 border-ink-950 bg-amber-300 shadow-[0_0_18px_rgba(251,191,36,.8)]"
                />
              )}
              {["locked", "played", "approved", "finalized"].map((state, i) => (
                <div key={state} className="relative z-10 flex flex-col items-center gap-2">
                  <span className={`h-4 w-4 rounded-full border-2 border-ink-950 ${i === 3 ? "bg-mint-400" : "bg-ink-600"}`} />
                  <span className="font-mono text-[9px] uppercase tracking-wider text-gray-500">{state}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
          <div className="rounded-xl border border-ink-700 bg-ink-900/70 p-3">
            <div className="font-mono text-[9px] uppercase tracking-wider text-gray-600">Deck</div>
            <div className="mt-1 flex items-center gap-1.5 font-semibold text-gray-200">
              <LockKeyhole className="h-3.5 w-3.5 text-mint-400" /> Encrypted
            </div>
          </div>
          <div className="rounded-xl border border-ink-700 bg-ink-900/70 p-3">
            <div className="font-mono text-[9px] uppercase tracking-wider text-gray-600">Custody</div>
            <div className="mt-1 flex items-center gap-1.5 font-semibold text-gray-200">
              <Wallet className="h-3.5 w-3.5 text-mint-400" /> Aleo program
            </div>
          </div>
          <div className="col-span-2 rounded-xl border border-mint-500/20 bg-mint-500/[0.06] p-3 sm:col-span-1">
            <div className="font-mono text-[9px] uppercase tracking-wider text-gray-600">Settlement</div>
            <div className="mt-1 flex items-center gap-1.5 font-semibold text-mint-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> Player approved
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section id="top" className="relative flex min-h-[100svh] items-center overflow-hidden pb-20 pt-28 sm:pt-32">
      <div className="pointer-events-none absolute inset-0 bg-grid mask-fade-b opacity-50" />
      <ParticleField className="pointer-events-none absolute inset-0 h-full w-full opacity-35" />
      <div className="pointer-events-none absolute -top-40 left-1/3 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-mint-500/10 blur-[150px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[420px] w-[520px] rounded-full bg-amber-500/[0.08] blur-[140px]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink-950 to-transparent" />

      <div className="container-pad relative z-10">
        <div className="grid items-center gap-16 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <span className="eyebrow">
                <span className="h-1.5 w-1.5 rounded-full bg-mint-400 animate-pulse-glow" />
                Private poker · Aleo-native custody
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="heading-xl mt-7"
            >
              Play the hand.
              <br />
              <span className="bg-gradient-to-r from-mint-300 via-mint-400 to-amber-300 bg-clip-text text-transparent">
                Verify the outcome.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.14 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-gray-400"
            >
              ZGame keeps cards encrypted during play, anchors player funds in an Aleo program,
              and settles completed hands against a proof-bound payout digest. Players approve
              settlement with their own wallets—private keys never enter the game backend.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.22 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <a href="#flow" className="btn-primary w-full sm:w-auto">
                Explore the protocol
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href={site.links.protocol} className="btn-ghost w-full sm:w-auto">
                <BookOpen className="h-4 w-4" />
                Read the overview
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="mt-10 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-2"
            >
              {promises.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm text-gray-300">
                  <item.icon className="h-4 w-4 shrink-0 text-mint-400" />
                  {item.label}
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <ProofTable />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
