import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Copy, LoaderCircle, LogOut, RefreshCw, WalletCards } from "lucide-react";
import {
  ZgameAleoApi,
  type AleoJob,
  type AleoProvingStatus,
  type AleoSession,
  type AleoTable,
} from "../aleo/api";
import { initializeProtocolPlayer } from "../aleo/protocol";
import { connectedAddress, transactionIdFromWalletResult, walletOptions } from "../aleo/wallet";
import { PokerTablePreview } from "./PokerTablePreview";

const api = new ZgameAleoApi(import.meta.env.VITE_ZGAME_ALEO_API ?? "http://127.0.0.1:9011");
type ActionKind = "check" | "call" | "fold" | "bet" | "raise";

function mockPlayers(address: string) {
  if (!address.startsWith("mock:")) return address;
  const name = address.slice(5);
  const others = ["alice", "bob", "carol"].filter((player) => player !== name);
  return [address, ...others.map((player) => `mock:${player}`)].join(", ");
}

function short(value: string) {
  return value.length > 22 ? `${value.slice(0, 12)}…${value.slice(-6)}` : value;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function AleoPlay() {
  const wallets = useMemo(walletOptions, []);
  const [walletId, setWalletId] = useState(wallets.find((wallet) => wallet.installed)?.id ?? "");
  const [walletAddress, setWalletAddress] = useState("");
  const [session, setSession] = useState<AleoSession>();
  const [protocolKey, setProtocolKey] = useState("");
  const [proving, setProving] = useState<AleoProvingStatus>();
  const [players, setPlayers] = useState("");
  const [table, setTable] = useState<AleoTable>();
  const [tableId, setTableId] = useState("");
  const [joinTableId, setJoinTableId] = useState("");
  const [status, setStatus] = useState("Connect an Aleo wallet to start a private table");
  const [busy, setBusy] = useState(false);

  const selectedWallet = () => {
    const selected = wallets.find((wallet) => wallet.id === walletId);
    if (!selected) throw new Error("Select an Aleo wallet first");
    if (!selected.installed) throw new Error(`${selected.name} is not installed`);
    return selected.wallet;
  };

  async function connect() {
    setBusy(true);
    setStatus("Connecting wallet…");
    try {
      const wallet = selectedWallet();
      const address = connectedAddress(await wallet.connect());
      setWalletAddress(address);
      setStatus("Signing one-time login challenge…");
      const nextSession = await api.authenticate(wallet, address);
      await api.currentSession(nextSession);
      setStatus("Initializing Aleo protocol player…");
      const protocol = await initializeProtocolPlayer(wallet, address);
      const provingStatus = await api.provingStatus(nextSession);
      setSession(nextSession);
      setProtocolKey(protocol.publicKeyHex);
      setProving(provingStatus);
      setPlayers((current) => current || mockPlayers(address));
      setStatus("Wallet, session and protocol player ready");
    } catch (error) {
      setStatus(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    try {
      const wallet = selectedWallet();
      await wallet.disconnect?.();
    } catch {
      // Wallet disconnect is best-effort; clearing the local session is enough.
    }
    setSession(undefined);
    setTable(undefined);
    setTableId("");
    setWalletAddress("");
    setProtocolKey("");
    setProving(undefined);
    setStatus("Wallet disconnected");
  }

  async function createTable() {
    if (!session) {
      setStatus("Connect an Aleo wallet first");
      return;
    }
    const addresses = players.split(",").map((value) => value.trim()).filter(Boolean);
    if (addresses.length !== 3 || new Set(addresses).size !== 3) {
      setStatus("Enter exactly three unique Aleo addresses, including the connected wallet");
      return;
    }
    setBusy(true);
    setStatus("Preparing Aleo table…");
    try {
      const next = await api.createTable(session, addresses);
      setTable(next);
      setTableId(next.id);
      if (next.creation_call) {
        setStatus("Confirm the table creation transaction in your wallet…");
        const transactionId = transactionIdFromWalletResult(await selectedWallet().execute({
          program: next.creation_call.program,
          function: next.creation_call.function,
          inputs: next.creation_call.inputs,
        }));
        const submitted = await api.submitTableCreation(session, next.id, transactionId);
        setTable(submitted.table);
        setStatus(`Creation broadcast ${short(transactionId)} · waiting for Testnet finality`);
        void trackTableCreation(session, next.id);
      } else {
        setStatus("Table created; the current-turn wallet can sign an action");
      }
    } catch (error) {
      setStatus(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function trackTableCreation(activeSession: AleoSession, activeTableId: string) {
    for (let attempt = 0; attempt < 900; attempt += 1) {
      try {
        const creation = await api.tableCreation(activeSession, activeTableId);
        setTable(creation.table);
        if (creation.status === "confirmed") {
          setStatus(`Aleo table confirmed${creation.block_height ? ` at block ${creation.block_height}` : ""}`);
          return;
        }
      } catch (error) {
        setStatus(errorMessage(error));
        return;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 1000));
    }
    setStatus("Table creation is still confirming; refresh when ready");
  }

  async function refreshTable() {
    if (!session || !tableId) return;
    setBusy(true);
    try {
      const next = await api.table(session, tableId);
      setTable(next);
      setStatus("Authoritative table state refreshed");
    } catch (error) {
      setStatus(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function joinExistingTable() {
    if (!session) {
      setStatus("Connect an Aleo wallet first");
      return;
    }
    const requestedId = joinTableId.trim();
    if (!requestedId) {
      setStatus("Enter a table ID to join");
      return;
    }
    setBusy(true);
    setStatus("Loading the canonical Aleo table…");
    try {
      const next = await api.table(session, requestedId);
      setTable(next);
      setTableId(next.id);
      const seated = next.seats.some((seat) => seat.address === session.address);
      setStatus(seated ? "Wallet seat confirmed; waiting for the current turn" : "Table loaded, but this wallet is not one of its seats");
    } catch (error) {
      setStatus(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function copyTableId() {
    if (!table) return;
    try {
      await navigator.clipboard.writeText(table.id);
      setStatus("Full table ID copied");
    } catch {
      setStatus(table.id);
    }
  }

  async function play(kind: ActionKind, amount?: number) {
    if (!session || !table) return;
    setBusy(true);
    setStatus(`Previewing and signing ${kind}…`);
    try {
      const result = await api.submitAction(session, selectedWallet(), table.id, kind, amount);
      setTable(result.table);
      setStatus(`Action queued in Aleo job ${short(result.job_id)} · ${result.status}`);
      void trackJob(session, table.id, result.job_id, result.table.chain_status === "mock");
    } catch (error) {
      setStatus(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function trackJob(activeSession: AleoSession, activeTableId: string, initialJobId: string, mockFinality: boolean) {
    const labels: Record<string, string> = {
      accepted: "Waiting for proof worker",
      proving: "Generating Varuna proof",
      proved: "Proof complete; preparing Aleo transaction",
      prepared: "Transaction persisted; broadcasting",
      submitted: "Transaction broadcast; waiting for finality",
      finalized: mockFinality ? "Local simulation complete" : "Testnet confirmed",
      retryablefailure: "Proof retry scheduled",
      permanentfailure: "Action proof failed permanently",
    };
    const seen = new Set<string>();
    let jobId = initialJobId;
    while (!seen.has(jobId)) {
      seen.add(jobId);
      let finalized = false;
      for (let attempt = 0; attempt < 900; attempt += 1) {
        try {
          const job: AleoJob = await api.job(activeSession, jobId);
          setStatus(`${labels[job.status] ?? job.status}${job.transaction_id ? ` · ${short(job.transaction_id)}` : ""}`);
          if (job.status === "finalized") {
            finalized = true;
            break;
          }
          if (job.status === "permanentfailure") {
            setStatus(job.error ?? "Action proof failed permanently");
            return;
          }
        } catch (error) {
          setStatus(errorMessage(error));
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
      }
      if (!finalized) {
        setStatus(`Aleo job ${short(jobId)} is still processing; refresh later`);
        return;
      }
      try {
        const nextTable = await api.table(activeSession, activeTableId);
        setTable(nextTable);
        if (!nextTable.last_job || nextTable.last_job === jobId || seen.has(nextTable.last_job)) {
          setStatus(mockFinality ? "Local simulation complete" : "Testnet confirmed");
          return;
        }
        jobId = nextTable.last_job;
        setStatus(`Following Aleo transition ${short(jobId)}…`);
      } catch (error) {
        setStatus(errorMessage(error));
        return;
      }
    }
  }

  return (
    <main className="min-h-screen bg-ink-950 pb-24 pt-28">
      <div className="container-pad">
        <a href="#top" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to ZGame</a>
        <div className="mb-10 max-w-3xl">
          <span className="eyebrow">Aleo testnet · native Varuna</span>
          <h1 className="heading-lg mt-5">Play private poker on Aleo</h1>
          <p className="mt-4 text-lg leading-relaxed text-gray-400">Connect a wallet, create a three-player table, and sign each action. The table below is rendered from the authoritative `zgame_aleo` coordinator state.</p>
        </div>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.36fr)_minmax(0,0.64fr)]">
          <div className="card h-fit p-5 sm:p-6">
            <div className="flex items-center gap-3"><WalletCards className="h-5 w-5 text-mint-400" /><h2 className="text-lg font-semibold text-white">Wallet session</h2></div>
            <label className="mt-6 block text-xs font-mono uppercase tracking-wider text-gray-500" htmlFor="play-wallet">Aleo wallet</label>
            <select id="play-wallet" value={walletId} onChange={(event) => setWalletId(event.target.value)} className="mt-2 w-full rounded-xl border border-ink-600 bg-ink-900 px-3 py-3 text-sm text-gray-100 outline-none focus:border-mint-400">
              <option value="">Select a wallet</option>
              {wallets.map((wallet) => <option key={wallet.id} value={wallet.id} disabled={!wallet.installed}>{wallet.name}{wallet.installed ? "" : " (not installed)"}</option>)}
            </select>
            {!session ? (
              <button type="button" disabled={busy || !walletId} onClick={() => void connect()} className="btn-primary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-40"><WalletCards className="h-4 w-4" /> {busy ? "Connecting…" : "Connect and initialize"}</button>
            ) : (
              <button type="button" disabled={busy} onClick={() => void disconnect()} className="btn-ghost mt-3 w-full"><LogOut className="h-4 w-4" /> Disconnect</button>
            )}
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-ink-700 bg-ink-900/70 p-3 text-xs text-gray-400"><span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-mint-400" /><span>{status}</span></div>
            {session && <dl className="mt-5 space-y-3 text-xs"><div><dt className="font-mono uppercase tracking-wider text-gray-600">Wallet</dt><dd className="mt-1 break-all text-gray-200">{walletAddress}</dd></div><div><dt className="font-mono uppercase tracking-wider text-gray-600">Protocol key</dt><dd className="mt-1 break-all font-mono text-gray-400">{short(protocolKey)}</dd></div><div><dt className="font-mono uppercase tracking-wider text-gray-600">Proving service</dt><dd className="mt-1 text-gray-200">{proving?.enabled ? `${proving.workers.length} worker${proving.workers.length === 1 ? "" : "s"} online` : "Local deployment worker not configured"}</dd></div></dl>}
          </div>

          <div className="card p-5 sm:p-6">
            {!session ? <div className="flex min-h-[420px] flex-col items-center justify-center text-center"><LoaderCircle className="h-8 w-8 text-mint-400/60" /><h2 className="mt-4 text-lg font-semibold text-white">Connect a wallet to open a table</h2><p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">The table UI becomes live after the Aleo session is authenticated.</p></div> : !table ? <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3"><WalletCards className="h-5 w-5 text-mint-400" /><h2 className="text-lg font-semibold text-white">Enter an existing table</h2></div>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">A table creator gives the other wallets its ID. Loading it confirms whether this wallet is one of the three Aleo seats.</p>
                <label className="mt-5 block text-xs font-mono uppercase tracking-wider text-gray-500" htmlFor="join-table-id">Table ID</label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row"><input id="join-table-id" value={joinTableId} onChange={(event) => setJoinTableId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-ink-600 bg-ink-900 px-3 py-3 font-mono text-xs text-gray-100 outline-none focus:border-mint-400" placeholder="51c3…" /><button type="button" disabled={busy || !joinTableId.trim()} onClick={() => void joinExistingTable()} className="btn-ghost sm:shrink-0"><WalletCards className="h-4 w-4" /> {busy ? "Loading…" : "Enter table"}</button></div>
              </div>
              <div className="border-t border-ink-700/70 pt-7">
                <div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-mint-400" /><h2 className="text-lg font-semibold text-white">Create a three-player table</h2></div>
                <label className="mt-5 block text-xs font-mono uppercase tracking-wider text-gray-500" htmlFor="play-players">Player addresses</label><textarea id="play-players" rows={3} value={players} onChange={(event) => setPlayers(event.target.value)} className="mt-2 w-full resize-none rounded-xl border border-ink-600 bg-ink-900 px-3 py-3 font-mono text-xs text-gray-100 outline-none focus:border-mint-400" placeholder="aleo1…, aleo1…, aleo1…" /><button type="button" disabled={busy} onClick={() => void createTable()} className="btn-primary mt-3"><CheckCircle2 className="h-4 w-4" /> {busy ? "Preparing…" : "Create table"}</button><p className="mt-4 text-xs leading-relaxed text-gray-500">Exactly three unique addresses are required. On Testnet, your wallet will ask you to confirm `create_table_v1`; those three addresses become the canonical seats.</p>
              </div>
            </div> : <><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">Live coordinator payload</div><h2 className="mt-1 text-lg font-semibold text-white">Table {short(table.id)}</h2><div className="mt-2 flex max-w-full items-center gap-2"><code className="min-w-0 break-all font-mono text-[10px] text-gray-500">{table.id}</code><button type="button" onClick={() => void copyTableId()} className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-ink-700 hover:text-white" title="Copy full table ID" aria-label="Copy full table ID"><Copy className="h-3.5 w-3.5" /></button></div><div className="mt-2 text-xs text-gray-400">{(() => { const seat = table.seats.find((candidate) => candidate.address === session.address); return seat ? `Wallet seated at Seat ${seat.seat + 1} · stack ${seat.stack}` : "This wallet is not seated at this table"; })()}</div></div><button type="button" disabled={busy} onClick={() => void refreshTable()} className="btn-ghost !px-3 !py-2 text-xs"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button></div><PokerTablePreview table={table} currentAddress={session.address} busy={busy} status={status} onAction={(kind, amount) => void play(kind, amount)} /></>}
          </div>
        </section>
      </div>
    </main>
  );
}
