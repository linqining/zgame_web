import {
  ArrowRight,
  CheckCircle2,
  Fingerprint,
  Gamepad2,
  LockKeyhole,
  Wallet,
} from "lucide-react";
import { Reveal, RevealItem, RevealStagger } from "./Reveal";

const steps = [
  {
    n: "01",
    icon: Wallet,
    title: "Connect",
    label: "Signed identity",
    desc: "The wallet signs a one-time challenge. The gateway derives game identity from the verified Aleo address.",
  },
  {
    n: "02",
    icon: LockKeyhole,
    title: "Lock",
    label: "Finalized custody",
    desc: "Credits are deposited and locked for a table. A broadcast transaction is never treated as a completed buy-in.",
  },
  {
    n: "03",
    icon: Gamepad2,
    title: "Play",
    label: "Canonical state",
    desc: "Authenticated actions update the shared poker state off-chain without asking the wallet to sign every turn.",
  },
  {
    n: "04",
    icon: Fingerprint,
    title: "Approve",
    label: "Exact proof digest",
    desc: "At the hand boundary, every occupied player approves the same digest, payout vector and fee commitment.",
  },
  {
    n: "05",
    icon: CheckCircle2,
    title: "Settle",
    label: "Aleo finality",
    desc: "The operator submits the approved settlement to the Aleo program; balances change only after chain confirmation.",
  },
];

export function AleoFlow() {
  return (
    <section id="flow" className="section-pad relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-mint-500/[0.06] blur-[160px]" />
      <div className="container-pad relative">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="eyebrow">A hand from wallet to finality</span>
          <h2 className="heading-lg mt-5">Five transitions. One verifiable outcome.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-400">
            ZGame separates real-time play from custody without confusing speed with trust. Each
            boundary has a clear signer, source of truth and failure state.
          </p>
        </Reveal>

        <div className="relative mt-14">
          <div className="pointer-events-none absolute left-[10%] right-[10%] top-12 hidden h-px bg-gradient-to-r from-mint-500/20 via-amber-400/45 to-mint-500/20 lg:block" />
          <RevealStagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-5" stagger={0.07}>
            {steps.map((step, index) => (
              <RevealItem key={step.n}>
                <div className="card group relative h-full p-5 transition-colors duration-300 hover:border-mint-500/35">
                  <div className="flex items-center justify-between">
                    <div className="relative z-10 inline-flex rounded-xl border border-mint-500/25 bg-ink-900 p-3 text-mint-400 shadow-[0_0_28px_-12px_rgba(52,211,153,.8)]">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xl font-bold text-ink-600">{step.n}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-white">{step.title}</h3>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-mint-400/80">
                    {step.label}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-gray-400">{step.desc}</p>
                  {index < steps.length - 1 && (
                    <ArrowRight className="absolute -right-3 top-11 z-20 hidden h-5 w-5 text-amber-300/70 lg:block" />
                  )}
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>

        <Reveal className="mx-auto mt-10 max-w-3xl">
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] px-5 py-4 text-sm text-gray-300 sm:flex-row sm:items-center sm:justify-between">
            <span>
              <strong className="text-amber-300">Important:</strong> an <span className="font-mono text-gray-200">at1…</span> transaction ID means broadcast, not finality.
            </span>
            <span className="shrink-0 font-mono text-xs uppercase tracking-wider text-mint-300">
              reported → verified → finalized
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
