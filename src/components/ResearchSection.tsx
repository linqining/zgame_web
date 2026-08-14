import { ArrowUpRight, Boxes, FlaskConical, GitBranch, Microscope, Network, Orbit } from "lucide-react";
import { site } from "../lib/site";
import { Reveal, RevealItem, RevealStagger } from "./Reveal";

const tracks = [
  {
    name: "ZChain",
    icon: Network,
    color: "mint",
    status: "Research track",
    title: "A game-first Layer-1 architecture",
    desc: "Research into a purpose-built game chain with Narwhal-Bullshark DAG consensus, dedicated GameTurn lanes, an object model and an rBPF VM.",
    points: ["DAG consensus", "Game-specific execution lanes", "Native custody research"],
    href: site.links.zchain,
  },
  {
    name: "Stwo proving",
    icon: Orbit,
    color: "amber",
    status: "Research track",
    title: "Application-specific proof systems",
    desc: "Research into Circle-STARK proving over M31, hand-written Texas Hold'em AIRs, a custom zkVM path and proof aggregation.",
    points: ["Texas Hold'em AIR", "M31 / FRI", "Recursive aggregation research"],
    href: site.links.zchain,
  },
];

const accent: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  mint: {
    border: "border-mint-500/30",
    bg: "bg-mint-500/[0.08]",
    text: "text-mint-300",
    dot: "bg-mint-400",
  },
  amber: {
    border: "border-amber-400/30",
    bg: "bg-amber-400/[0.08]",
    text: "text-amber-300",
    dot: "bg-amber-400",
  },
};

export function ResearchSection() {
  return (
    <section id="research" className="section-pad relative overflow-hidden bg-ink-900/40">
      <div className="pointer-events-none absolute inset-0 bg-dots opacity-35" />
      <div className="container-pad relative">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_.8fr]">
          <Reveal>
            <span className="eyebrow">
              <FlaskConical className="h-3.5 w-3.5" /> Research lab
            </span>
            <h2 className="heading-lg mt-5">Aleo ships the product. ZChain and Stwo explore what comes next.</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-lg leading-relaxed text-gray-400">
              These tracks inform the architecture, but they are deliberately separated from the
              current Aleo custody path. The browser product does not depend on ZChain consensus or
              the Stwo research stack.
            </p>
          </Reveal>
        </div>

        <RevealStagger className="mt-14 grid gap-5 lg:grid-cols-2">
          {tracks.map((track) => {
            const a = accent[track.color];
            return (
              <RevealItem key={track.name}>
                <article className={`card group h-full overflow-hidden border ${a.border}`}>
                  <div className="p-7 sm:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div className={`inline-flex rounded-2xl border ${a.border} ${a.bg} p-3.5 ${a.text}`}>
                        <track.icon className="h-7 w-7" />
                      </div>
                      <span className={`inline-flex items-center gap-2 rounded-full border ${a.border} ${a.bg} px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider ${a.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${a.dot}`} />
                        {track.status}
                      </span>
                    </div>

                    <div className="mt-7 font-mono text-xs uppercase tracking-[0.18em] text-gray-500">{track.name}</div>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight text-white">{track.title}</h3>
                    <p className="mt-4 leading-relaxed text-gray-400">{track.desc}</p>

                    <div className="mt-6 grid gap-2 sm:grid-cols-3">
                      {track.points.map((point) => (
                        <div key={point} className="rounded-xl border border-ink-700 bg-ink-900/65 px-3 py-3 text-xs font-medium text-gray-300">
                          {point}
                        </div>
                      ))}
                    </div>

                    <a
                      href={track.href}
                      target="_blank"
                      rel="noreferrer"
                      className={`mt-7 inline-flex items-center gap-2 text-sm font-semibold ${a.text}`}
                    >
                      Explore the research repository <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                </article>
              </RevealItem>
            );
          })}
        </RevealStagger>

        <Reveal className="mt-6">
          <div className="grid gap-3 rounded-2xl border border-ink-700 bg-ink-950/55 p-5 text-sm text-gray-400 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <Boxes className="h-4 w-4 text-mint-400" /> Product boundary stays explicit
            </div>
            <div className="flex items-center gap-3">
              <GitBranch className="h-4 w-4 text-amber-300" /> Research can evolve independently
            </div>
            <div className="flex items-center gap-3">
              <Microscope className="h-4 w-4 text-aqua-400" /> Claims track implemented code
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
