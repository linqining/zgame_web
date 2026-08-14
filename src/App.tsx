import { useEffect, useState } from "react";
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Intro } from "./components/Intro";
import { AleoFlow } from "./components/AleoFlow";
import { TrustModel } from "./components/TrustModel";
import { GamesSection } from "./components/GamesSection";
import { ZkSection } from "./components/ZkSection";
import { ResearchSection } from "./components/ResearchSection";
import { Roadmap } from "./components/Roadmap";
import { Whitepaper } from "./components/Whitepaper";
import { WhitepaperDoc } from "./components/WhitepaperDoc";
import { Community } from "./components/Community";
import { Footer } from "./components/Footer";

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHashRoute();
  const isWhitepaper = hash.startsWith("#/protocol") || hash.startsWith("#/whitepaper");

  if (isWhitepaper) {
    return (
      <>
        <Nav />
        <WhitepaperDoc />
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Intro />
        <AleoFlow />
        <TrustModel />
        <GamesSection />
        <ZkSection />
        <ResearchSection />
        <Roadmap />
        <Whitepaper />
        <Community />
      </main>
      <Footer />
    </>
  );
}
