import { Reveal } from "./Reveal";

const phases = [
  {
    phase: "Implemented",
    title: "Aleo product boundary",
    status: "done",
    items: [
      "Wallet challenge and session authentication",
      "Aleo credits deposit / lock / withdraw flow",
      "Independent custody transaction finality tracking",
      "Proof-bound settlement proposal and approval",
    ],
  },
  {
    phase: "Now",
    title: "Product integration",
    status: "active",
    items: [
      "Player-facing Aleo wallet adapter",
      "Table and custody state projection through shared schema",
      "End-to-end testnet operations and observability",
      "Clear broadcast / reported / finalized UX",
    ],
  },
  {
    phase: "Next",
    title: "Settlement hardening",
    status: "next",
    items: [
      "Complete Texas terminal and side-pot lifecycle constraints",
      "Expand adversarial and restart-safe integration tests",
      "Public test environment and table operations",
      "Developer-facing protocol integration guide",
    ],
  },
  {
    phase: "Research",
    title: "ZChain + Stwo",
    status: "research",
    items: [
      "Game-first L1 execution and consensus research",
      "Application-specific Stwo AIR circuits",
      "Custom zkVM and aggregation experiments",
      "Formal and implementation-level soundness work",
    ],
  },
];

const statusStyle: Record<string, { dot: string; text: string; label: string }> = {
  done: { dot: "bg-mint-400", text: "text-mint-300", label: "Implemented" },
  active: { dot: "bg-amber-400 animate-pulse-glow", text: "text-amber-300", label: "Active" },
  next: { dot: "bg-aqua-400", text: "text-aqua-300", label: "Next" },
  research: { dot: "bg-violet-400", text: "text-violet-300", label: "Research" },
};

export function Roadmap() {
  return (
    <section id="status" className="section-pad relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-dots opacity-30" />
      <div className="container-pad relative">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="eyebrow">Development status</span>
          <h2 className="heading-lg mt-5">Show the boundary. Ship the next piece.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-400">
            The Aleo path is the active product track. Research work remains visible without being
            presented as a dependency or a production guarantee.
          </p>
        </Reveal>

        <div className="mx-auto mt-14 max-w-4xl">
          <div className="relative">
            <div className="absolute left-[7px] top-2 h-full w-px bg-gradient-to-b from-mint-500/40 via-amber-400/35 to-transparent sm:left-[11px]" />
            <div className="space-y-6">
              {phases.map((phase, index) => {
                const style = statusStyle[phase.status];
                return (
                  <Reveal key={phase.phase} delay={index * 0.06}>
                    <div className="relative pl-8 sm:pl-10">
                      <div className={`absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-ink-950 ${style.dot}`} />
                      <div className="card p-6">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-mono text-xs uppercase tracking-wider text-gray-500">{phase.phase}</span>
                          <h3 className="text-lg font-bold text-white">{phase.title}</h3>
                          <span className={`ml-auto rounded-full bg-ink-800 px-2.5 py-1 text-xs font-semibold ${style.text}`}>
                            {style.label}
                          </span>
                        </div>
                        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                          {phase.items.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-gray-400">
                              <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${style.dot}`} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
