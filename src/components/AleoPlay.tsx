import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, CircleDot, Copy, LayoutDashboard, LoaderCircle, LogOut, Plus, RefreshCw, Users, WalletCards } from "lucide-react";
import {
  ZgameAleoApi,
  type AleoProvingStatus,
  type AleoLobbyEvent,
  type AleoSession,
  type AleoTable,
  type AleoTableEvent,
} from "../aleo/api";
import { connectedAddress, walletOptions } from "../aleo/wallet";
import { PokerTablePreview } from "./PokerTablePreview";

const api = new ZgameAleoApi(import.meta.env.VITE_ZGAME_ALEO_API ?? "http://127.0.0.1:9011");
type ActionKind = "check" | "call" | "fold" | "bet" | "raise";
const SESSION_STORAGE_KEY = "zgame-aleo:browser-session:v1";
const LOBBY_TABLE_SLOTS = Array.from({ length: 6 }, (_, index) => `table-${String(index + 1).padStart(2, "0")}`);

type StoredSession = {
  walletId: string;
  session: AleoSession;
};

function mockPlayers(address: string) {
  if (!address.startsWith("mock:")) return address;
  const name = address.slice(5);
  const others = ["alice", "bob", "carol"].filter((player) => player !== name);
  return [address, ...others.map((player) => `mock:${player}`)].join(", ");
}

function short(value: string) {
  return value.length > 22 ? `${value.slice(0, 12)}…${value.slice(-6)}` : value;
}

function sortLobbyTables(tables: AleoTable[]) {
  return [...tables]
    .filter((table) => Number.isInteger(table.lobby_slot) && table.lobby_slot! >= 1 && table.lobby_slot! <= LOBBY_TABLE_SLOTS.length)
    .sort((left, right) => (left.lobby_slot ?? 0) - (right.lobby_slot ?? 0));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function savedTableKey(address: string) {
  return `zgame-aleo:last-table:${address}`;
}

function rememberedTableId(address: string) {
  return window.localStorage.getItem(savedTableKey(address))?.trim() || "";
}

function rememberTable(address: string, tableId: string) {
  window.localStorage.setItem(savedTableKey(address), tableId);
}

function loadStoredSession(): StoredSession | undefined {
  try {
    const stored = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return undefined;
    const value = JSON.parse(stored) as StoredSession;
    if (!value.walletId || !value.session?.address || !value.session.token || value.session.expiresAt <= Date.now() / 1000) {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return undefined;
    }
    return value;
  } catch {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return undefined;
  }
}

function storeSession(walletId: string, session: AleoSession) {
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ walletId, session }));
}

export function AleoPlay() {
  const wallets = useMemo(walletOptions, []);
  const [walletId, setWalletId] = useState(wallets.find((wallet) => wallet.installed)?.id ?? "");
  const [walletAddress, setWalletAddress] = useState("");
  const [session, setSession] = useState<AleoSession>();
  const [proving, setProving] = useState<AleoProvingStatus>();
  const [provingError, setProvingError] = useState("");
  const [players, setPlayers] = useState("");
  const [table, setTable] = useState<AleoTable>();
  const [lobbyTables, setLobbyTables] = useState<AleoTable[]>([]);
  const [lobbyLoading, setLobbyLoading] = useState(false);
  const [tableId, setTableId] = useState("");
  const [joinTableId, setJoinTableId] = useState("");
  const [lobbySlot, setLobbySlot] = useState(1);
  const [status, setStatus] = useState("Connect an Aleo wallet to start a private table");
  const [busy, setBusy] = useState(false);
  const [realtimeState, setRealtimeState] = useState<"offline" | "connecting" | "live">("offline");
  const [serverTimeOffsetSeconds, setServerTimeOffsetSeconds] = useState(0);
  const creationTracking = useRef(new Set<string>());
  const restoredSession = useRef(false);
  // A closing WebSocket can still have a buffered table event. This identity
  // makes leaving the table authoritative from the browser's perspective.
  const activeTableId = useRef("");

  const selectedWallet = () => {
    const selected = wallets.find((wallet) => wallet.id === walletId);
    if (!selected) throw new Error("Select an Aleo wallet first");
    if (!selected.installed) throw new Error(`${selected.name} is not installed`);
    return selected.wallet;
  };

  async function refreshLobby(activeSession: AleoSession, announce = false) {
    setLobbyLoading(true);
    try {
      const next = await api.tables(activeSession);
      setLobbyTables(sortLobbyTables(next));
      if (announce) setStatus(`${next.length} table${next.length === 1 ? "" : "s"} available in the lobby`);
    } catch (error) {
      setStatus(errorMessage(error));
    } finally {
      setLobbyLoading(false);
    }
  }

  function upsertLobbyTable(next: AleoTable) {
    setLobbyTables((current) => sortLobbyTables([next, ...current.filter((candidate) => candidate.id !== next.id)]));
  }

  function applyTableSnapshot(next: AleoTable) {
    setTable((current) => {
      if (!current || current.id !== next.id) return next;
      if (next.hand_id < current.hand_id) return current;
      if (next.hand_id === current.hand_id && next.call_seq < current.call_seq) return current;
      return next;
    });
    upsertLobbyTable(next);
  }

  function updateServerClock(serverTime?: number) {
    if (serverTime === undefined) return;
    setServerTimeOffsetSeconds(serverTime - Math.floor(Date.now() / 1000));
  }

  async function restoreSavedTable(activeSession: AleoSession): Promise<boolean> {
    const savedTableId = rememberedTableId(activeSession.address);
    if (!savedTableId) return false;
    setStatus("Restoring your last table…");
    try {
      const savedTable = await api.table(activeSession, savedTableId);
      setTable(savedTable);
      setTableId(savedTable.id);
      rememberTable(activeSession.address, savedTable.id);
      if (savedTable.chain_status === "submitted") {
        setStatus("Saved table creation was broadcast; waiting for Testnet finality…");
        void trackTableCreation(activeSession, savedTable.id);
      } else {
        setStatus("Restored your saved Aleo table");
      }
      return true;
    } catch {
      window.localStorage.removeItem(savedTableKey(activeSession.address));
      return false;
    }
  }

  useEffect(() => {
    if (restoredSession.current) return;
    restoredSession.current = true;
    const stored = loadStoredSession();
    if (!stored) return;
    void (async () => {
      try {
        await api.currentSession(stored.session);
        setWalletId(stored.walletId);
        setWalletAddress(stored.session.address);
        setSession(stored.session);
        const [provingResult, restoredTable] = await Promise.all([
          api.provingStatus(stored.session).then((value) => ({ ok: true as const, value })).catch((error) => ({ ok: false as const, error })),
          restoreSavedTable(stored.session),
        ]);
        if (provingResult.ok) {
          setProving(provingResult.value);
          setProvingError("");
        } else {
          setProving(undefined);
          setProvingError(errorMessage(provingResult.error));
        }
        setPlayers((current) => current || mockPlayers(stored.session.address));
        void refreshLobby(stored.session);
        if (!restoredTable) setStatus(provingResult.ok ? "Wallet session restored" : "Wallet session restored, but the game backend mode could not be loaded");
      } catch {
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    })();
  }, []);

  useEffect(() => {
    if (!session || !tableId) {
      setRealtimeState("offline");
      return;
    }
    let closed = false;
    let socket: WebSocket | undefined;
    let retry: number | undefined;
    let attempt = 0;
    const scheduleReconnect = () => {
      if (closed) return;
      if (session.expiresAt <= Date.now() / 1000) {
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
        setSession(undefined);
        setTable(undefined);
        setTableId("");
        setRealtimeState("offline");
        setStatus("Wallet session expired; reconnect to continue");
        return;
      }
      const delay = Math.min(30_000, 1_000 * (2 ** attempt)) + Math.floor(Math.random() * 500);
      attempt = Math.min(attempt + 1, 5);
      retry = window.setTimeout(connect, delay);
    };
    const connect = () => {
      if (closed) return;
      setRealtimeState("connecting");
      socket = api.tableEvents(session, tableId);
      socket.onopen = () => {
        if (!closed) {
          attempt = 0;
          setRealtimeState("live");
        }
      };
      socket.onmessage = (message) => {
        if (closed || activeTableId.current !== tableId) return;
        try {
          const event = JSON.parse(message.data) as AleoTableEvent;
          updateServerClock(event.server_time);
          if ((event.event === "connected" || event.event === "table") && event.table?.id === tableId) {
            applyTableSnapshot(event.table);
          } else if (event.event === "error" && event.error) {
            setStatus(event.error);
          }
        } catch {
          // Ignore malformed transient messages and keep the last valid state.
        }
      };
      socket.onclose = () => {
        if (closed) return;
        setRealtimeState("offline");
        scheduleReconnect();
      };
      socket.onerror = () => socket?.close();
    };
    connect();
    return () => {
      closed = true;
      if (retry) window.clearTimeout(retry);
      socket?.close();
    };
  }, [session, tableId]);

  useEffect(() => {
    if (!session) return;
    let closed = false;
    let socket: WebSocket | undefined;
    let retry: number | undefined;
    let attempt = 0;
    const connectLobby = () => {
      if (closed || session.expiresAt <= Date.now() / 1000) return;
      socket = api.lobbyEvents(session);
      socket.onopen = () => { attempt = 0; };
      socket.onmessage = (message) => {
        if (closed) return;
        try {
          const event = JSON.parse(message.data) as AleoLobbyEvent;
          updateServerClock(event.server_time);
          if ((event.event === "connected" || event.event === "lobby") && event.tables) {
            setLobbyTables(sortLobbyTables(event.tables));
          }
        } catch {
          // Keep the last valid lobby snapshot.
        }
      };
      socket.onclose = () => {
        if (closed || session.expiresAt <= Date.now() / 1000) return;
        const delay = Math.min(30_000, 1_000 * (2 ** attempt)) + Math.floor(Math.random() * 500);
        attempt = Math.min(attempt + 1, 5);
        retry = window.setTimeout(connectLobby, delay);
      };
      socket.onerror = () => socket?.close();
    };
    connectLobby();
    return () => {
      closed = true;
      if (retry) window.clearTimeout(retry);
      socket?.close();
    };
  }, [session]);

  useEffect(() => {
    activeTableId.current = tableId;
  }, [tableId]);

  useEffect(() => {
    if (!session) {
      document.title = "ZGame — Private Poker on Aleo";
      return;
    }
    const seat = table?.seats.find((candidate) => candidate.address === session.address);
    const role = seat ? `Seat ${seat.seat + 1}` : "Spectator";
    const turn = table?.current_turn === session.address ? " · YOUR TURN" : "";
    document.title = `ZGame · ${role} · ${short(session.address)}${turn}`;
  }, [session, table]);

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
      setSession(nextSession);
      storeSession(walletId, nextSession);
      setPlayers((current) => current || mockPlayers(address));
      void refreshLobby(nextSession);
      const [provingResult, restoredTable] = await Promise.all([
        api.provingStatus(nextSession).then((value) => ({ ok: true as const, value })).catch((error) => ({ ok: false as const, error })),
        restoreSavedTable(nextSession),
      ]);
      if (provingResult.ok) {
        setProving(provingResult.value);
        setProvingError("");
      } else {
        setProving(undefined);
        setProvingError(errorMessage(provingResult.error));
      }
      if (restoredTable) return;
      setStatus(provingResult.ok ? "Wallet, session and protocol player ready" : "Wallet authenticated, but the game backend mode could not be loaded");
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
    setProving(undefined);
    setProvingError("");
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
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
      const next = await api.createTable(session, addresses, lobbySlot);
      setTable(next);
      upsertLobbyTable(next);
      setTableId(next.id);
      rememberTable(session.address, next.id);
      if (next.creation_call) {
        await submitTableCreationByExecutor(session, next);
      } else {
        setStatus("Table created; the current-turn wallet can sign an action");
      }
    } catch (error) {
      setStatus(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function submitTableCreationByExecutor(activeSession: AleoSession, activeTable: AleoTable) {
    if (!activeTable.creation_call) return;
    setStatus("Server executor is signing and broadcasting the table creation transaction…");
    const submitted = await api.submitTableCreationByExecutor(activeSession, activeTable.id);
    setTable(submitted.table);
    upsertLobbyTable(submitted.table);
    setStatus(`Creation broadcast ${short(submitted.transaction_id ?? "")} · waiting for Testnet finality`);
    void trackTableCreation(activeSession, activeTable.id);
  }

  async function confirmTableCreation() {
    if (!session || !table) return;
    setBusy(true);
    try {
      await submitTableCreationByExecutor(session, table);
    } catch (error) {
      setStatus(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function trackTableCreation(activeSession: AleoSession, activeTableId: string) {
    if (creationTracking.current.has(activeTableId)) return;
    creationTracking.current.add(activeTableId);
    try {
      for (let attempt = 0; attempt < 900; attempt += 1) {
        try {
          const creation = await api.tableCreation(activeSession, activeTableId);
          setTable((current) => current?.id === activeTableId ? creation.table : current);
          upsertLobbyTable(creation.table);
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
    } finally {
      creationTracking.current.delete(activeTableId);
    }
  }

  async function refreshTable() {
    if (!session || !tableId) return;
    setBusy(true);
    try {
      const next = await api.table(session, tableId);
      setTable(next);
      upsertLobbyTable(next);
      if (next.chain_status === "submitted") {
        setStatus("Table creation was broadcast; waiting for Testnet finality…");
        void trackTableCreation(session, next.id);
        return;
      }
      setStatus("Authoritative table state refreshed");
    } catch (error) {
      setStatus(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function openTable(requested: string) {
    if (!session) {
      setStatus("Connect an Aleo wallet first");
      return;
    }
    const requestedId = requested.trim();
    if (!requestedId) {
      setStatus("Enter a table ID to join");
      return;
    }
    setBusy(true);
    setStatus("Opening table…");
    try {
      const next = await api.table(session, requestedId);
      setTable(next);
      upsertLobbyTable(next);
      setTableId(next.id);
      rememberTable(session.address, next.id);
      const seated = next.seats.some((seat) => seat.address === session.address);
      if (!seated) {
        setStatus("Table loaded, but this wallet is not one of its seats");
      } else if (next.creation_call) {
        setStatus("This table is waiting for its Aleo creation transaction");
        await submitTableCreationByExecutor(session, next);
      } else if (next.chain_status === "submitted") {
        setStatus("Table creation was broadcast; waiting for Testnet finality…");
        void trackTableCreation(session, next.id);
      } else {
        setStatus("Wallet seat confirmed; waiting for the current turn");
      }
    } catch (error) {
      setStatus(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function joinExistingTable() {
    await openTable(joinTableId);
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

  function changeTable() {
    activeTableId.current = "";
    if (session) window.localStorage.removeItem(savedTableKey(session.address));
    setTable(undefined);
    setTableId("");
    setStatus("Back in the lobby");
    if (session) void refreshLobby(session);
  }

  async function play(kind: ActionKind, amount?: number) {
    if (!session || !table) return;
    setBusy(true);
    try {
      if (!proving) {
        throw new Error(provingError || "The game backend mode is unavailable; refresh after the server is ready");
      }
      if (proving.gameplay_mode !== "server") {
        throw new Error("The backend is configured for proof-per-action gameplay; enable server gameplay before playing");
      }
      setStatus(`Submitting ${kind} to the game server…`);
      const result = await api.serverAction(session, table.id, kind, amount);
      applyTableSnapshot(result.table);
      setStatus(`Server action applied · ${result.status}`);
    } catch (error) {
      setStatus(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function leaveTable() {
    if (!session || !table) return;
    setBusy(true);
    const leavingTableId = table.id;
    setStatus("Leave requested; returning to the lobby while Aleo cash-out runs in the background…");
    try {
      const result = await api.leaveTable(session, leavingTableId);
      window.localStorage.removeItem(savedTableKey(session.address));
      const amount = result.leave.amount;
      activeTableId.current = "";
      setTable(undefined);
      setTableId("");
      setStatus(amount === undefined
        ? "Leave requested; cash-out will finalize after this hand"
        : `Cash-out ${amount} chips requested · Aleo receipt is ${result.leave.status}`);
      void refreshLobby(session);
    } catch (error) {
      setStatus(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  // A seated table intentionally takes over the viewport, matching the
  // established Secret Poker play scene. Lobby and wallet management remain
  // available through the floating Lobby control rather than competing with
  // the active table for screen space.
  if (session && table) {
    return (
      <PokerTablePreview
        table={table}
        currentAddress={session.address}
        busy={busy}
        status={status}
        liveState={realtimeState}
        turnTimeoutSeconds={proving?.server_turn_timeout_seconds ?? 20}
        serverTimeOffsetSeconds={serverTimeOffsetSeconds}
        onAction={(kind, amount) => void play(kind, amount)}
        onConfirmCreation={() => void confirmTableCreation()}
        onRefresh={() => void refreshTable()}
        onLobby={changeTable}
        onLeave={() => void leaveTable()}
      />
    );
  }

  return (
    <main className="min-h-screen bg-ink-950 pb-24 pt-28">
      <div className="container-pad">
        <a href="#top" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to ZGame</a>
        <div className="mb-10 max-w-3xl">
          <span className="eyebrow">Aleo testnet · native Varuna</span>
          <h1 className="heading-lg mt-5">Play private poker on Aleo</h1>
          <p className="mt-4 text-lg leading-relaxed text-gray-400">Connect a wallet and create a three-player table. The default buy-in is 1 ALEO (1,000 chips); buy-in/genesis and final settlement use Aleo, while betting actions stay in the authoritative `zgame_aleo` server state.</p>
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
            {provingError && <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">Game backend mode unavailable: {provingError}</div>}
            {session && <dl className="mt-5 space-y-3 text-xs"><div><dt className="font-mono uppercase tracking-wider text-gray-600">Wallet</dt><dd className="mt-1 break-all text-gray-200">{walletAddress}</dd></div><div><dt className="font-mono uppercase tracking-wider text-gray-600">Gameplay</dt><dd className="mt-1 text-gray-200">Server-authoritative</dd></div><div><dt className="font-mono uppercase tracking-wider text-gray-600">Live sync</dt><dd className={`mt-1 font-semibold ${realtimeState === "live" ? "text-mint-300" : "text-amber-200"}`}>{realtimeState === "live" ? "WebSocket connected" : realtimeState === "connecting" ? "Connecting…" : "Waiting for a table"}</dd></div><div><dt className="font-mono uppercase tracking-wider text-gray-600">Gameplay proofs</dt><dd className="mt-1 text-gray-200">{proving?.gameplay_mode === "server" ? "Not used — actions stay off-chain" : "Backend mode unavailable"}</dd></div></dl>}
          </div>

          <div className="card p-5 sm:p-6">
            {!session ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center"><LoaderCircle className="h-8 w-8 text-mint-400/60" /><h2 className="mt-4 text-lg font-semibold text-white">Connect a wallet to enter the lobby</h2><p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">The lobby always provides six stable table slots.</p></div>
            ) : !table ? (
              <div className="space-y-8">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><LayoutDashboard className="h-5 w-5 text-mint-400" /><div><h2 className="text-lg font-semibold text-white">Poker lobby</h2><p className="mt-1 text-sm text-gray-500">Six fixed slots show the current live table assignments.</p></div></div><button type="button" disabled={lobbyLoading || busy} onClick={() => void refreshLobby(session, true)} className="btn-ghost !px-3 !py-2 text-xs"><RefreshCw className={`h-3.5 w-3.5 ${lobbyLoading ? "animate-spin" : ""}`} /> Refresh</button></div>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {lobbyLoading ? <div className="col-span-full flex min-h-32 items-center justify-center text-sm text-gray-500"><LoaderCircle className="mr-2 h-4 w-4 animate-spin text-mint-400" /> Loading tables…</div> : LOBBY_TABLE_SLOTS.map((slot, index) => { const lobbyTable = lobbyTables.find((candidate) => candidate.lobby_slot === index + 1); const activeSeats = lobbyTable?.seats.filter((seat) => Boolean(seat.address)); const seated = activeSeats?.some((seat) => seat.address === session.address); return <button key={slot} type="button" disabled={busy || !lobbyTable} onClick={() => lobbyTable && void openTable(lobbyTable.id)} className="group rounded-2xl border border-ink-700 bg-ink-900/70 p-4 text-left transition hover:border-mint-400/60 hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-60"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-500">Table {slot.replace("table-", "")}</div><div className="mt-2 text-sm font-semibold text-white">{lobbyTable ? `Hand #${lobbyTable.hand_id} · pot ${lobbyTable.pot}` : "Waiting for a table"}</div></div><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${lobbyTable ? (lobbyTable.chain_status === "confirmed" || lobbyTable.chain_status === "mock" ? "bg-mint-500/15 text-mint-300" : "bg-amber-300/10 text-amber-200") : "bg-ink-700 text-gray-500"}`}>{lobbyTable ? (lobbyTable.chain_status === "confirmed" || lobbyTable.chain_status === "mock" ? "Open" : lobbyTable.chain_status) : "Empty"}</span></div><div className="mt-4 flex items-center justify-between gap-3 text-xs text-gray-400"><span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-mint-400" /> {lobbyTable ? `${activeSeats?.length ?? 0}/3 seated` : "0/3 seated"}</span><span>{lobbyTable ? (seated ? "Your seat" : "Spectate") : "Create or open by ID"}</span></div><div className="mt-3 truncate font-mono text-[10px] text-gray-500">{lobbyTable?.current_turn ? `${short(lobbyTable.current_turn)} to act` : lobbyTable ? "Waiting for next hand" : "No active table"}</div></button>; })}
                  </div>
                </div>
                <details className="rounded-2xl border border-ink-700 bg-ink-900/50 p-4"><summary className="cursor-pointer text-sm font-semibold text-gray-200">Open a table by ID</summary><label className="mt-4 block text-xs font-mono uppercase tracking-wider text-gray-500" htmlFor="join-table-id">Table ID</label><div className="mt-2 flex flex-col gap-2 sm:flex-row"><input id="join-table-id" value={joinTableId} onChange={(event) => setJoinTableId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-ink-600 bg-ink-900 px-3 py-3 font-mono text-xs text-gray-100 outline-none focus:border-mint-400" placeholder="51c3…" /><button type="button" disabled={busy || !joinTableId.trim()} onClick={() => void joinExistingTable()} className="btn-ghost sm:shrink-0"><WalletCards className="h-4 w-4" /> Open</button></div></details>
                <div className="border-t border-ink-700/70 pt-7"><div className="flex items-center gap-3"><Plus className="h-5 w-5 text-mint-400" /><h2 className="text-lg font-semibold text-white">Create a three-player table</h2></div><label className="mt-5 block text-xs font-mono uppercase tracking-wider text-gray-500" htmlFor="play-lobby-slot">Fixed lobby table</label><select id="play-lobby-slot" value={lobbySlot} onChange={(event) => setLobbySlot(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-ink-600 bg-ink-900 px-3 py-3 text-sm text-gray-100 outline-none focus:border-mint-400">{LOBBY_TABLE_SLOTS.map((slot, index) => <option key={slot} value={index + 1}>Table {slot.replace("table-", "")}</option>)}</select><label className="mt-5 block text-xs font-mono uppercase tracking-wider text-gray-500" htmlFor="play-players">Player addresses</label><textarea id="play-players" rows={3} value={players} onChange={(event) => setPlayers(event.target.value)} className="mt-2 w-full resize-none rounded-xl border border-ink-600 bg-ink-900 px-3 py-3 font-mono text-xs text-gray-100 outline-none focus:border-mint-400" placeholder="aleo1…, aleo1…, aleo1…" /><button type="button" disabled={busy} onClick={() => void createTable()} className="btn-primary mt-3"><CheckCircle2 className="h-4 w-4" /> {busy ? "Preparing…" : "Create table"}</button><p className="mt-4 text-xs leading-relaxed text-gray-500">Exactly three unique addresses are required. The table is added to this lobby immediately; only buy-in/genesis and final settlement cross the chain boundary.</p></div>
              </div>
            ) : <><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">Live table state · {realtimeState === "live" ? "WebSocket live" : "reconnecting"}</div><h2 className="mt-1 text-lg font-semibold text-white">Table {short(table.id)}</h2><div className="mt-2 flex max-w-full items-center gap-2"><code className="min-w-0 break-all font-mono text-[10px] text-gray-500">{table.id}</code><button type="button" onClick={() => void copyTableId()} className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-ink-700 hover:text-white" title="Copy full table ID" aria-label="Copy full table ID"><Copy className="h-3.5 w-3.5" /></button></div><div className="mt-2 text-xs text-gray-400">{(() => { const seat = table.seats.find((candidate) => candidate.address === session.address); return seat ? <span className="font-semibold text-mint-300">This browser is Seat {seat.seat + 1} · {short(session.address)} · stack {seat.stack}</span> : "This wallet is not seated at this table"; })()}</div></div><div className="flex gap-2"><button type="button" onClick={changeTable} className="btn-ghost !px-3 !py-2 text-xs"><LayoutDashboard className="h-3.5 w-3.5" /> Lobby</button><button type="button" disabled={busy} onClick={() => void refreshTable()} className="btn-ghost !px-3 !py-2 text-xs"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button></div></div><PokerTablePreview table={table} currentAddress={session.address} busy={busy} status={status} turnTimeoutSeconds={proving?.server_turn_timeout_seconds ?? 20} onAction={(kind, amount) => void play(kind, amount)} onConfirmCreation={() => void confirmTableCreation()} onRefresh={() => void refreshTable()} /></>}
          </div>
        </section>
      </div>
    </main>
  );
}
