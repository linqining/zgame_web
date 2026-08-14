import { EyeOff, Gauge, ShieldCheck, Wallet } from "lucide-react";
import { Reveal, RevealItem, RevealStagger } from "./Reveal";

const principles = [
  {
    icon: EyeOff,
    title: "Private by design",
    desc: "The deck stays encrypted through shuffle, reveal and reconstruction. A player sees only the cards the protocol allows.",
  },
  {
    icon: Wallet,
    title: "Wallet-controlled funds",
    desc: "Deposits, table locks, settlement approvals and withdrawals remain Aleo wallet-signed operations.",
  },
  {
    icon: ShieldCheck,
    title: "Proof-bound payouts",
    desc: "The settlement proposal binds the final digest, payout vector and fees before players approve it.",
  },
  {
    icon: Gauge,
    title: "Fast play, fewer prompts",
    desc: "Poker actions run off-chain against canonical state, avoiding a wallet confirmation for every fold, call or raise.",
  },
];

const tech = [
  "Aleo Wallet",
  "Aleo Program",
  "Finalized Table Lock",
  "Varuna Settlement",
  "Mental Poker",
  "Bayer-Groth V2",
  "BLS12-381",
  "Proof Digest",
  "Wallet Approval",
  "Canonical Borsh State",
  "ZChain Research",
  "Stwo Research",
];

export function Intro() {
  return (
    <section id="product" className="relative border-y border-ink-800/80 bg-ink-900/40 py-20 sm:py-24">
      <div className="container-pad">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="eyebrow">Why ZGame</span>
          <h2 className="heading-lg mt-5">
            Private gameplay without surrendering <span className="text-mint-400">settlement control</span>.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-400">
            The browser is an interface, not the source of truth. Identity comes from a signed Aleo
            challenge, funds come from finalized custody state, and settlement requires approval of
            the exact result being submitted.
          </p>
        </Reveal>

        <RevealStagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {principles.map((item) => (
            <RevealItem key={item.title}>
              <div className="card group h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:border-mint-500/35">
                <div className="inline-flex rounded-xl border border-mint-500/20 bg-mint-500/[0.08] p-3 text-mint-400">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{item.desc}</p>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>

      <div className="relative mt-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink-950 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink-950 to-transparent" />
        <div className="flex w-max animate-marquee gap-4 motion-reduce:animate-none">
          {[...tech, ...tech].map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="whitespace-nowrap rounded-full border border-ink-700 bg-ink-850/70 px-5 py-2 font-mono text-sm text-gray-400"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
