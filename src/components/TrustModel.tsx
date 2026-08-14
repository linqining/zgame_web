import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Fingerprint, KeyRound, Radio, ShieldAlert, WalletCards } from "lucide-react";
import { Reveal, RevealItem, RevealStagger } from "./Reveal";

const truths = [
  {
    icon: KeyRound,
    title: "Identity comes from the wallet",
    desc: "A signed one-time challenge establishes the Aleo address. The browser never supplies its own caller identity.",
    tag: "wallet signature",
  },
  {
    icon: WalletCards,
    title: "Buy-in comes from finalized custody",
    desc: "The gateway and proving service independently check the Aleo table-lock mapping before a player can join.",
    tag: "finalized table_lock",
  },
  {
    icon: Fingerprint,
    title: "Settlement comes from an exact digest",
    desc: "Payouts and fees are bound to the proposed digest, then approved by every occupied player before submission.",
    tag: "proof-bound approval",
  },
];

const states = [
  { label: "Broadcast", detail: "Wallet returned at1…", color: "bg-gray-600", text: "text-gray-400" },
  { label: "Reported", detail: "Gateway is tracking it", color: "bg-amber-400", text: "text-amber-300" },
  { label: "Verified", detail: "Program + function match", color: "bg-aqua-400", text: "text-aqua-300" },
  { label: "Finalized", detail: "Safe to use as custody", color: "bg-mint-400", text: "text-mint-300" },
];

export function TrustModel() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="safety" className="section-pad relative overflow-hidden bg-ink-900/40">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[700px] -translate-x-1/2 rounded-full bg-aqua-400/[0.05] blur-[150px]" />
      <div className="container-pad relative">
        <div className="grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <Reveal>
              <span className="eyebrow">Funds safety</span>
              <h2 className="heading-lg mt-5">The browser is not the source of truth.</h2>
              <p className="mt-5 text-lg leading-relaxed text-gray-400">
                ZGame treats UI state as a projection. Identity is wallet-derived, custody is read
                from Aleo, and a settlement is accepted only when its exact digest is approved.
              </p>
            </Reveal>

            <RevealStagger className="mt-8 space-y-3" stagger={0.08}>
              {truths.map((truth) => (
                <RevealItem key={truth.title}>
                  <div className="card flex gap-4 p-5">
                    <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-mint-500/20 bg-mint-500/[0.08] text-mint-400">
                      <truth.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{truth.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-gray-400">{truth.desc}</p>
                      <span className="mt-2 inline-block font-mono text-[10px] uppercase tracking-wider text-mint-400/75">
                        {truth.tag}
                      </span>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>

          <Reveal delay={0.12}>
            <div className="card relative overflow-hidden p-6 sm:p-8">
              <div className="absolute inset-0 bg-grid opacity-30" />
              <div className="relative flex items-center justify-between border-b border-ink-700/70 pb-5">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-gray-500">Custody observer</div>
                  <div className="mt-1 text-lg font-bold text-white">Aleo transaction finality</div>
                </div>
                <Radio className="h-5 w-5 text-mint-400" />
              </div>

              <div className="relative mt-7 space-y-3">
                <div className="absolute bottom-5 left-[15px] top-5 w-px bg-gradient-to-b from-gray-600 via-amber-400/60 to-mint-400/60" />
                {states.map((state, index) => (
                  <motion.div
                    key={state.label}
                    initial={{ opacity: 0.55 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: reduceMotion ? 0 : index * 0.16 }}
                    className="relative flex items-center gap-4 rounded-xl border border-ink-700/80 bg-ink-950/75 p-4"
                  >
                    <span className={`relative z-10 h-8 w-8 shrink-0 rounded-full border-[7px] border-ink-950 ${state.color}`} />
                    <div className="min-w-0 flex-1">
                      <div className={`font-semibold ${state.text}`}>{state.label}</div>
                      <div className="mt-0.5 text-xs text-gray-500">{state.detail}</div>
                    </div>
                    {index === states.length - 1 ? (
                      <CheckCircle2 className="h-5 w-5 text-mint-400" />
                    ) : (
                      <span className="font-mono text-[9px] uppercase tracking-wider text-gray-600">pending trust</span>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="relative mt-6 flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-sm leading-relaxed text-gray-300">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                A broadcast transaction is never displayed as spendable custody until the deployed
                Aleo program and expected function have been independently verified.
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
