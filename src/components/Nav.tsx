import { useEffect, useState } from "react";
import { Menu, X, Activity, BookOpen } from "lucide-react";
import { navLinks, site } from "../lib/site";
import { LogoMark } from "./Logo";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-ink-700/70 bg-ink-950/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="container-pad flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-lg font-extrabold tracking-tight text-white">
            Z<span className="text-mint-400">Game</span>
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <a href={site.links.protocol} className="btn-ghost px-4 py-2 text-xs">
            <BookOpen className="h-3.5 w-3.5" />
            Protocol
          </a>
          <a href={site.links.status} className="btn-primary px-4 py-2 text-xs">
            <Activity className="h-4 w-4" />
            Development status
          </a>
        </div>

        <button
          className="rounded-lg p-2 text-gray-300 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-ink-700/70 bg-ink-950/95 px-5 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-ink-800 hover:text-white"
              >
                {l.label}
              </a>
            ))}
            <a
              href={site.links.protocol}
              className="btn-primary mt-2 w-full"
            >
              Read protocol overview
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
