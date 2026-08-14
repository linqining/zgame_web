import { BookOpen, FlaskConical, Github } from "lucide-react";
import { navLinks, site } from "../lib/site";
import { LogoMark } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-ink-800 bg-ink-950">
      <div className="container-pad py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark />
              <span className="text-lg font-extrabold tracking-tight text-white">
                Z<span className="text-mint-400">Game</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-500">
              Private poker with Aleo-native custody, encrypted gameplay and player-approved settlement.
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href={site.links.zgame}
                target="_blank"
                rel="noreferrer"
                aria-label="ZGame GitHub"
                className="rounded-lg border border-ink-700 bg-ink-850 p-2.5 text-gray-400 transition-colors hover:border-mint-500/40 hover:text-mint-400"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href={site.links.zchain}
                target="_blank"
                rel="noreferrer"
                aria-label="ZChain research"
                className="rounded-lg border border-ink-700 bg-ink-850 p-2.5 text-gray-400 transition-colors hover:border-amber-400/40 hover:text-amber-300"
              >
                <FlaskConical className="h-4 w-4" />
              </a>
              <a
                href={site.links.protocol}
                aria-label="Protocol overview"
                className="rounded-lg border border-ink-700 bg-ink-850 p-2.5 text-gray-400 transition-colors hover:border-aqua-400/40 hover:text-aqua-400"
              >
                <BookOpen className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-gray-500">Explore</div>
            <ul className="mt-4 space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-sm text-gray-400 transition-colors hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-gray-500">Tracks</div>
            <ul className="mt-4 space-y-2.5 text-sm text-gray-400">
              <li><span className="text-mint-300">Active:</span> ZGame on Aleo</li>
              <li><span className="text-amber-300">Research:</span> ZChain</li>
              <li><span className="text-amber-300">Research:</span> Stwo proving</li>
              <li><a href={site.links.protocol} className="transition-colors hover:text-white">Protocol overview</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-ink-800 pt-8 text-sm text-gray-600 sm:flex-row">
          <p>© {new Date().getFullYear()} ZGame. Built for private, verifiable play.</p>
          <p className="font-mono text-xs">
            <span className="text-mint-400">Aleo active track</span> · ZChain + Stwo research
          </p>
        </div>
      </div>
    </footer>
  );
}
