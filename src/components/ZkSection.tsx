import { CheckCircle2, FileCheck2, Fingerprint, Server, Users } from "lucide-react";
import { Reveal, RevealItem, RevealStagger } from "./Reveal";

const pipeline = [
  {
    icon: Server,
    step: "01",
    title: "Canonical hand state",
    desc: "The proving service consumes the server-authoritative table journal rather than trusting a UI-local projection.",
  },
  {
    icon: FileCheck2,
    step: "02",
    title: "Settlement proposal",
    desc: "The terminal boundary produces the exact digest, payout vector and fee commitment intended for settlement.",
  },
  {
    icon: Users,
    step: "03",
    title: "Unanimous approval",
    desc: "Every occupied player signs approval of that same proof-bound digest with an Aleo wallet transaction.",
  },
  {
    icon: CheckCircle2,
    step: "04",
    title: "Aleo settlement",
    desc: "The operator submits the approved arguments and the custody program becomes the final settlement authority.",
  },
];

const guarantees = [
  { k: "Identity", v: "Derived from a verified Aleo address, never caller data supplied by the browser" },
  { k: "Custody", v: "A finalized table-lock mapping is required before an off-chain stack exists" },
  { k: "Proposal", v: "Digest, payouts and fees are returned together at the terminal boundary" },
  { k: "Approval", v: "Every occupied player approves the exact settlement digest" },
  { k: "Keys", v: "Player private keys remain inside their wallet extension" },
  { k: "Research boundary", v: "Stwo proving remains a separate research track from the Aleo browser path" },
];

export function ZkSection() {
  return (
    <section id="technology" className="section-pad relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-25" />
      <div className="container-pad relative">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="eyebrow">
            <Fingerprint className="h-3.5 w-3.5" /> Settlement integrity
          </span>
          <h2 className="heading-lg mt-5">Proof-bound where it matters. Explicit about what is still being hardened.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-400">
            The current Aleo path combines a native terminal settlement payload with unanimous
            approval of the exact digest. That approval remains part of the safety model while full
            Texas lifecycle and side-pot constraints continue to be incorporated.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {pipeline.map((item, index) => (
            <Reveal key={item.step} delay={index * 0.07}>
              <div className="card h-full p-6">
                <div className="flex items-center justify-between">
                  <div className="inline-flex rounded-xl border border-aqua-400/20 bg-aqua-400/[0.07] p-3 text-aqua-400">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-2xl font-bold text-ink-600">{item.step}</span>
                </div>
                <h3 className="mt-5 text-base font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <RevealStagger className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {guarantees.map((item) => (
            <RevealItem key={item.k}>
              <div className="card h-full p-5 transition-colors duration-200 hover:border-mint-500/35">
                <div className="font-mono text-[10px] uppercase tracking-wider text-mint-400/75">{item.k}</div>
                <div className="mt-2 text-sm font-medium leading-relaxed text-gray-200">{item.v}</div>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
