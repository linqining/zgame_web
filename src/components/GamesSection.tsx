import { EyeOff, RefreshCw, Hand, CheckCircle2, LockKeyhole, Play } from "lucide-react";
import { Reveal, RevealStagger, RevealItem } from "./Reveal";
import { PokerTablePreview } from "./PokerTablePreview";

const phases = [
  {
    icon: RefreshCw,
    name: "Shuffle",
    proof: "VersionedShuffleProof · Bayer-Groth V2",
    desc: "Each player re-shuffles the encrypted deck and posts a proof that the permutation and re-masking are correct, without revealing card order.",
  },
  {
    icon: LockKeyhole,
    name: "Remask / Join",
    proof: "RemaskProof · DLEqProof",
    desc: "Late joiners mask the deck; a discrete-log equality proof ties the new ciphertext to the same plaintext.",
  },
  {
    icon: EyeOff,
    name: "Reveal Token",
    proof: "RevealTokenProof",
    desc: "Players selectively reveal decryption tokens for public cards while private holes stay encrypted.",
  },
  {
    icon: Hand,
    name: "Reconstruct",
    proof: "ReconstructProof · SwapOutProof",
    desc: "Joint decryption reconstructs exactly the allowed cards, with per-slot membership enforced by ZK.",
  },
];

const otherGames = [
  { name: "Texas Hold'em", status: "Active build", desc: "The primary product track for the Aleo integration." },
  { name: "Mental-poker protocol", status: "Protocol", desc: "Reusable shuffle, remask, reveal and reconstruction primitives." },
  { name: "More hidden-info games", status: "Research", desc: "Future games can build on the same encrypted-deck foundation." },
];

export function GamesSection() {
  return (
    <section id="games" className="section-pad relative overflow-hidden">
      <div className="pointer-events-none absolute right-0 top-1/4 h-[360px] w-[420px] rounded-full bg-amber-500/[0.06] blur-[140px]" />
      <div className="container-pad relative">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <span className="eyebrow">Mental poker</span>
            <h2 className="heading-lg mt-5">
              Shuffle together. Reveal only <span className="text-mint-400">what the hand allows</span>.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-gray-400">
              ZGame&apos;s Texas Hold&apos;em protocol keeps the deck encrypted across the multiplayer
              shuffle. Each proof-preserving transition constrains what can change without exposing
              the card order or another player&apos;s hole cards.
            </p>

            <div className="mt-7 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-mint-400" /> Verifiable player shuffles
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-mint-400" /> Encrypted hole cards
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-mint-400" /> Exact settlement approvals
              </div>
            </div>

            <a href="#/play" className="btn-primary mt-8 w-fit">
              <Play className="h-4 w-4" />
              Play on Aleo
            </a>
          </Reveal>

          {/* Ported from zgame/client: the actual five-seat felt table and action HUD. */}
          <Reveal delay={0.12}>
            <PokerTablePreview />
          </Reveal>
        </div>

        {/* proof phases */}
        <RevealStagger className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {phases.map((p) => (
            <RevealItem key={p.name}>
              <div className="card h-full p-6">
                <div className="mb-4 inline-flex rounded-lg border border-ink-700 bg-ink-800 p-2.5 text-mint-400">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">{p.name}</h3>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-mint-400/80">
                  {p.proof}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-gray-400">{p.desc}</p>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>

        {/* game roster */}
        <Reveal className="mt-12">
          <div className="grid gap-3 sm:grid-cols-3">
            {otherGames.map((g) => (
              <div key={g.name} className="flex items-center justify-between rounded-xl border border-ink-700/80 bg-ink-850/60 p-5">
                <div>
                  <div className="font-semibold text-white">{g.name}</div>
                  <div className="mt-0.5 text-sm text-gray-400">{g.desc}</div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    g.status === "Active build"
                      ? "bg-mint-500/15 text-mint-300"
                      : g.status === "Research"
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-ink-700 text-gray-400"
                  }`}
                >
                  {g.status}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
