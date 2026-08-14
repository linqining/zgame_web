import { ArrowUpRight, BookOpen, Code2, FlaskConical } from "lucide-react";
import { site } from "../lib/site";
import { Reveal, RevealItem, RevealStagger } from "./Reveal";

const resources = [
  {
    icon: Code2,
    name: "ZGame product",
    desc: "Aleo gateway, poker protocol, wallet bridge and player-facing integration work.",
    href: site.links.zgame,
    label: "github.com/linqining/zgame",
    accent: "text-mint-400",
  },
  {
    icon: FlaskConical,
    name: "Research lab",
    desc: "ZChain architecture, Stwo circuits, proving service and formal soundness work.",
    href: site.links.zchain,
    label: "github.com/linqining/zchain",
    accent: "text-amber-300",
  },
  {
    icon: BookOpen,
    name: "Protocol overview",
    desc: "The current product boundary, custody lifecycle, settlement model and limitations.",
    href: site.links.protocol,
    label: "Read in this site",
    accent: "text-aqua-400",
  },
];

export function Community() {
  return (
    <section id="build" className="section-pad relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-mint-500/30 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint-500/[0.06] blur-[150px]" />
      <div className="container-pad relative">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="eyebrow">Open development</span>
          <h2 className="heading-lg mt-5">Follow the product and the research separately.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-400">
            Product work moves through the Aleo integration. Experimental chain and proving work
            stays visible in the research repository without blurring the current deployment model.
          </p>
        </Reveal>

        <RevealStagger className="mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-3">
          {resources.map((resource) => (
            <RevealItem key={resource.name}>
              <a
                href={resource.href}
                target={resource.href.startsWith("http") ? "_blank" : undefined}
                rel={resource.href.startsWith("http") ? "noreferrer" : undefined}
                className="card group flex h-full flex-col p-7 transition-all duration-300 hover:-translate-y-1 hover:border-mint-500/35"
              >
                <resource.icon className={`h-8 w-8 ${resource.accent}`} />
                <h3 className="mt-5 text-lg font-bold text-white">{resource.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-400">{resource.desc}</p>
                <span className={`mt-6 inline-flex items-center gap-2 font-mono text-[11px] ${resource.accent}`}>
                  {resource.label} <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </a>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
