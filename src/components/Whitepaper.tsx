import { ArrowUpRight, BookOpen, Download, FileText } from "lucide-react";
import { Reveal } from "./Reveal";

const toc = [
  { n: "1", t: "Product boundary" },
  { n: "2", t: "Wallet and identity" },
  { n: "3", t: "Custody lifecycle" },
  { n: "4", t: "Mental-poker protocol" },
  { n: "5", t: "Settlement integrity" },
  { n: "6", t: "Research tracks" },
  { n: "7", t: "Current limitations" },
];

export function Whitepaper() {
  const openDoc = () => {
    window.location.hash = "#/protocol";
    window.scrollTo({ top: 0 });
  };

  return (
    <section id="docs" className="section-pad relative overflow-hidden bg-ink-900/40">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[320px] w-[760px] -translate-x-1/2 rounded-full bg-mint-500/[0.07] blur-[140px]" />
      <div className="container-pad relative">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="card overflow-hidden">
              <div className="grid gap-0 md:grid-cols-[1.25fr_.85fr]">
                <div className="p-8 sm:p-10">
                  <span className="eyebrow">
                    <BookOpen className="h-3.5 w-3.5" /> Protocol overview
                  </span>
                  <h2 className="heading-md mt-5">Read the product boundary before the cryptography.</h2>
                  <p className="mt-4 max-w-xl leading-relaxed text-gray-400">
                    The overview explains the Aleo wallet and custody path, the mental-poker state
                    machine, proof-bound settlement approvals, and the deliberate separation of
                    ZChain and Stwo research.
                  </p>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <button onClick={openDoc} className="btn-primary">
                      <FileText className="h-4 w-4" />
                      Read the overview
                    </button>
                    <a
                      href={`${import.meta.env.BASE_URL}ZGame-Protocol-Overview.md`}
                      download
                      className="btn-ghost"
                    >
                      <Download className="h-4 w-4" />
                      Download .md
                    </a>
                  </div>
                </div>

                <div className="border-t border-ink-700/70 bg-ink-950/35 p-8 sm:p-10 md:border-l md:border-t-0">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-gray-500">Contents</div>
                    <ArrowUpRight className="h-4 w-4 text-mint-400" />
                  </div>
                  <ol className="mt-5 space-y-3">
                    {toc.map((item) => (
                      <li key={item.n} className="flex items-center gap-3 text-sm">
                        <span className="font-mono text-mint-400/70">{item.n}</span>
                        <span className="text-gray-300">{item.t}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
