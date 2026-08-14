import { ArrowLeft, ArrowUpRight, CheckCircle2, FlaskConical, ShieldAlert } from "lucide-react";
import { site } from "../lib/site";

function back() {
  window.location.hash = "";
  window.scrollTo({ top: 0 });
}

const H = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <h2 id={id} className="mt-14 scroll-mt-24 text-2xl font-bold tracking-tight text-white sm:text-3xl">
    {children}
  </h2>
);
const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mt-8 text-lg font-bold text-white">{children}</h3>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-4 leading-relaxed text-gray-400">{children}</p>
);
const L = ({ children }: { children: React.ReactNode }) => (
  <li className="mt-2 leading-relaxed text-gray-400">{children}</li>
);
const Code = ({ children }: { children: React.ReactNode }) => (
  <pre className="mt-4 overflow-x-auto rounded-xl border border-ink-700 bg-ink-950 p-4 font-mono text-[13px] leading-relaxed text-mint-200/90">
    {children}
  </pre>
);

export function WhitepaperDoc() {
  return (
    <div className="min-h-screen bg-ink-950 pt-20">
      <div className="container-pad max-w-3xl pb-32">
        <button
          onClick={back}
          className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to site
        </button>

        <div className="border-b border-ink-800 pb-8">
          <span className="eyebrow">Protocol overview · Aleo active track</span>
          <h1 className="heading-lg mt-5">ZGame: private poker with verifiable settlement</h1>
          <p className="mt-4 font-mono text-sm text-gray-500">
            Product boundary · Wallet identity · Custody · Mental poker · Settlement · Research
          </p>
        </div>

        <P>
          <span className="font-semibold text-gray-200">Summary.</span> ZGame is a Texas Hold&apos;em
          stack that combines an encrypted mental-poker protocol with Aleo-native custody and
          settlement. Real-time turns use canonical off-chain state. Deposits, table locks,
          settlement approvals and withdrawals remain wallet-signed Aleo operations.
        </P>

        <div className="mt-6 rounded-2xl border border-mint-500/20 bg-mint-500/[0.06] p-5">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-mint-400" />
            <p className="text-sm leading-relaxed text-gray-300">
              Current product direction: Aleo is the deployment and custody track. ZChain and the
              Stwo proving stack are documented as research tracks and are not presented as browser
              product dependencies.
            </p>
          </div>
        </div>

        <H id="boundary">1. Product boundary</H>
        <P>The runtime boundary is intentionally narrow:</P>
        <Code>{`Aleo wallet -- signed one-time challenge --> zgame_aleo gateway
zgame_aleo -- authenticated loopback API --> proving service
proving service -- native settlement payload --> Aleo program`}</Code>
        <P>
          The browser never sends an authoritative caller identity or balance. It displays the
          canonical table snapshot returned by the backend and independently tracked custody state.
        </P>

        <H id="identity">2. Wallet and identity</H>
        <P>
          A player connects an Aleo wallet and signs a one-time challenge as exact UTF-8 bytes. The
          public gateway verifies that signature, creates a short-lived session, and derives the
          game identity from the verified Aleo address using a domain-separated hash.
        </P>
        <ul className="mt-2 list-disc pl-5 marker:text-mint-500/60">
          <L>The browser does not provide <code className="text-mint-300">caller_hex</code>.</L>
          <L>Player private keys remain inside the wallet extension.</L>
          <L>Authenticated actions are bound to the verified wallet session.</L>
        </ul>

        <H id="custody">3. Custody lifecycle</H>
        <P>The expected player sequence is:</P>
        <Code>{`connect → deposit → lock table → play → settlement proposal
        → approve exact digest → settle → withdraw`}</Code>
        <H3>Broadcast is not finality</H3>
        <P>
          After a wallet operation returns an <code className="text-mint-300">at1…</code> transaction
          ID, the gateway records it as reported. The proving service queries Aleo directly and marks
          it finalized only when the deployed program and expected function match. A player cannot
          join until the finalized table-lock mapping is visible.
        </P>

        <H id="mental-poker">4. Mental-poker protocol</H>
        <P>
          The deck is encrypted end to end. Players jointly transform it through proof-preserving
          phases so the table can progress without revealing card order or another player&apos;s private
          cards.
        </P>
        <Code>{`shuffle       VersionedShuffleProof · Bayer-Groth V2
remask        RemaskProof · DLEqProof
reveal        RevealTokenProof
reconstruct   ReconstructProof · ReconstructionDLEQProof
swap-out      SwapOutCardProof`}</Code>
        <P>
          The protocol types and proof bundle are shared with the browser projection so the UI does
          not invent game state from local interaction history.
        </P>

        <H id="settlement">5. Settlement integrity</H>
        <P>
          At the terminal hand boundary, the settlement proposal returns the exact digest, payout
          vector and fees. Every occupied player approves that digest through the Aleo custody
          program. The operator then submits the approved settlement arguments with its own wallet.
        </P>
        <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-5">
          <div className="flex gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <p className="text-sm leading-relaxed text-gray-300">
              Unanimous approval remains part of the current safety model while full Texas terminal
              and side-pot lifecycle constraints continue to be incorporated into the native circuit.
            </p>
          </div>
        </div>

        <H id="research">6. Research tracks</H>
        <H3>ZChain</H3>
        <P>
          ZChain explores a game-first Layer-1 design: Narwhal-Bullshark DAG consensus, dedicated
          GameTurn execution, an object model, rBPF contracts and chain-native game custody.
        </P>
        <H3>Stwo proving</H3>
        <P>
          The Stwo track explores Circle-STARK proving over M31, Texas Hold&apos;em AIR circuits, a custom
          zkVM path and aggregation. This work can inform future proving architecture without being
          required by the current Aleo browser integration.
        </P>

        <H id="limitations">7. Current limitations and status</H>
        <ul className="mt-2 list-disc pl-5 marker:text-mint-500/60">
          <L>The Aleo wallet adapter and player-facing experience are still being integrated.</L>
          <L>Broadcast transactions must not be treated as finalized custody.</L>
          <L>Unanimous settlement approval remains enabled during circuit hardening.</L>
          <L>ZChain and Stwo are research tracks, not production claims for the Aleo path.</L>
        </ul>

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          <a
            href={site.links.zgame}
            target="_blank"
            rel="noreferrer"
            className="card group p-5 transition-colors hover:border-mint-500/35"
          >
            <div className="font-mono text-[10px] uppercase tracking-wider text-mint-400">Product repository</div>
            <div className="mt-2 flex items-center justify-between font-semibold text-white">
              zgame <ArrowUpRight className="h-4 w-4 text-gray-500 group-hover:text-mint-400" />
            </div>
          </a>
          <a
            href={site.links.zchain}
            target="_blank"
            rel="noreferrer"
            className="card group p-5 transition-colors hover:border-amber-400/35"
          >
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-amber-300">
              <FlaskConical className="h-3.5 w-3.5" /> Research repository
            </div>
            <div className="mt-2 flex items-center justify-between font-semibold text-white">
              zchain + Stwo track <ArrowUpRight className="h-4 w-4 text-gray-500 group-hover:text-amber-300" />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
