import type { AleoWallet } from './wallet';

export type AleoSession = {
  address: string;
  token: string;
  expiresAt: number;
};

export type AleoProvingStatus = {
  enabled: boolean;
  gameplay_mode: 'server' | 'proof';
  server_turn_timeout_seconds?: number;
  workers: Array<{
    relation: string;
    state: string;
    completed: number;
    failed: number;
    last_job?: string;
    last_error?: string;
  }>;
  submission?: {
    state: string;
    prepared: number;
    broadcast: number;
    finalized: number;
    failed: number;
    last_job?: string;
    last_transaction?: string;
    last_error?: string;
  };
};

export type AleoTable = {
  id: string;
  phase: 'betting' | 'reveal' | 'ready' | 'showdown_ready' | 'terminal';
  hand_id: number;
  call_seq: number;
  street: number;
  current_turn: string | null;
  current_bet: number;
  min_raise: number;
  pot: number;
  community: number[];
  hole_cards?: [number, number];
  seats: Array<{
    seat: number;
    address: string;
    stack: number;
    bet: number;
    total_bet: number;
    folded: boolean;
    all_in: boolean;
    leaving: boolean;
    left: boolean;
  }>;
  available_actions: Array<'check' | 'call' | 'fold' | 'bet' | 'raise'>;
  last_job?: string;
  chain_status: 'mock' | 'prepared' | 'submitted' | 'confirmed';
  creation_call?: {
    program: string;
    function: string;
    inputs: string[];
  };
  settlement?: {
    hand_id: number;
    winner_mask: number;
    gross_pot: number;
    payouts: number[];
    status: 'pending' | 'submitted' | 'confirmed' | 'failed';
    transaction_id?: string;
    error?: string;
  };
  leaves: AleoLeave[];
  turn_started_at: number;
};

export type AleoLeave = {
  seat: number;
  address: string;
  requested_hand_id: number;
  amount?: number;
  status: 'requested' | 'ready' | 'pending' | 'submitted' | 'confirmed' | 'failed';
  transaction_id?: string;
  error?: string;
};

export type AleoTableEvent = {
  event: 'connected' | 'table' | 'heartbeat' | 'error';
  table?: AleoTable;
  error?: string;
  server_time?: number;
  server_turn_timeout_seconds?: number;
};

export type AleoLobbyEvent = {
  event: 'connected' | 'lobby' | 'heartbeat' | 'error';
  tables?: AleoTable[];
  error?: string;
  server_time?: number;
};

export type AleoTableCreation = {
  status: 'prepared' | 'submitted' | 'confirmed';
  transaction_id?: string;
  block_height?: number;
  table: AleoTable;
};

export type AleoJob = {
  job_id: string;
  relation: string;
  status: string;
  error?: string;
  transaction_id?: string;
  finalized_block_height?: number;
};

export function hexBytes(value: string): Uint8Array {
  if (!/^(?:[0-9a-fA-F]{2})*$/.test(value)) {
    throw new Error('Aleo action message is not valid hexadecimal');
  }
  return Uint8Array.from(value.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16));
}

type Challenge = {
  address: string;
  nonce: string;
  statement: string;
  expires_at: number;
};

export class ZgameAleoApi {
  constructor(private readonly baseUrl: string) {}

  async authenticate(wallet: AleoWallet, address: string): Promise<AleoSession> {
    const challenge = await this.request<Challenge>('/api/aleo/auth/challenge', {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
    if (challenge.address !== address) {
      throw new Error('Aleo service challenge returned another wallet address');
    }
    const signature = await wallet.signMessage(new TextEncoder().encode(challenge.statement));
    const session = await this.request<{
      address: string;
      token: string;
      expires_at: number;
    }>('/api/aleo/auth/session', {
      method: 'POST',
      body: JSON.stringify({ address, nonce: challenge.nonce, signature }),
    });
    if (session.address !== address) {
      throw new Error('Aleo service session returned another wallet address');
    }
    return {
      address,
      token: session.token,
      expiresAt: session.expires_at,
    };
  }

  currentSession(session: AleoSession): Promise<{ address: string; expires_at: number }> {
    return this.request('/api/aleo/auth/me', {
      headers: { Authorization: `Bearer ${session.token}` },
    });
  }

  provingStatus(session: AleoSession): Promise<AleoProvingStatus> {
    return this.request('/api/aleo/proving', {
      headers: { Authorization: `Bearer ${session.token}` },
    });
  }

  tables(session: AleoSession): Promise<AleoTable[]> {
    return this.request('/api/aleo/tables', {
      headers: { Authorization: `Bearer ${session.token}` },
    });
  }

  createTable(session: AleoSession, players: string[]): Promise<AleoTable> {
    return this.request('/api/aleo/tables', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.token}` },
      body: JSON.stringify({ players }),
    });
  }

  table(session: AleoSession, tableId: string): Promise<AleoTable> {
    return this.request(`/api/aleo/tables/${encodeURIComponent(tableId)}`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
  }

  tableEvents(session: AleoSession, tableId: string): WebSocket {
    const endpoint = new URL(`/api/aleo/tables/${encodeURIComponent(tableId)}/events`, this.baseUrl);
    endpoint.protocol = endpoint.protocol === 'https:' ? 'wss:' : 'ws:';
    // The WebSocket API cannot attach Authorization headers. The session token
    // travels in a negotiated subprotocol instead of a URL query parameter.
    return new WebSocket(endpoint.toString(), ['zgame', session.token]);
  }

  lobbyEvents(session: AleoSession): WebSocket {
    const endpoint = new URL('/api/aleo/tables/events', this.baseUrl);
    endpoint.protocol = endpoint.protocol === 'https:' ? 'wss:' : 'ws:';
    return new WebSocket(endpoint.toString(), ['zgame', session.token]);
  }

  leaveTable(
    session: AleoSession,
    tableId: string,
  ): Promise<{ table_id: string; leave: AleoLeave; table: AleoTable }> {
    return this.request(`/api/aleo/tables/${encodeURIComponent(tableId)}/leave`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.token}` },
    });
  }

  submitTableCreationByExecutor(
    session: AleoSession,
    tableId: string,
  ): Promise<AleoTableCreation> {
    return this.request(`/api/aleo/tables/${encodeURIComponent(tableId)}/creation/executor`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.token}` },
    });
  }

  tableCreation(session: AleoSession, tableId: string): Promise<AleoTableCreation> {
    return this.request(`/api/aleo/tables/${encodeURIComponent(tableId)}/creation`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
  }

  async submitAction(
    session: AleoSession,
    wallet: AleoWallet,
    tableId: string,
    kind: 'check' | 'call' | 'fold' | 'bet' | 'raise',
    amount?: number,
  ): Promise<{ job_id: string; status: string; table: AleoTable }> {
    const preview = await this.request<{
      preview_id: string;
      relation: string;
      message_hex: string;
      expires_at: number;
    }>(`/api/aleo/tables/${encodeURIComponent(tableId)}/actions/preview`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.token}` },
      body: JSON.stringify({ kind, amount }),
    });
    const signature = await wallet.signMessage(hexBytes(preview.message_hex));
    return this.request(`/api/aleo/tables/${encodeURIComponent(tableId)}/actions/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.token}` },
      body: JSON.stringify({ preview_id: preview.preview_id, signature }),
    });
  }

  serverAction(
    session: AleoSession,
    tableId: string,
    kind: 'check' | 'call' | 'fold' | 'bet' | 'raise',
    amount?: number,
  ): Promise<{ job_id: string; status: string; table: AleoTable }> {
    return this.request(`/api/aleo/tables/${encodeURIComponent(tableId)}/actions/server`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.token}` },
      body: JSON.stringify({ kind, amount }),
    });
  }

  timeoutAction(
    session: AleoSession,
    tableId: string,
  ): Promise<{ job_id: string; status: string; table: AleoTable }> {
    return this.request(`/api/aleo/tables/${encodeURIComponent(tableId)}/actions/timeout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.token}` },
    });
  }

  job(session: AleoSession, jobId: string): Promise<AleoJob> {
    return this.request(`/api/aleo/jobs/${encodeURIComponent(jobId)}`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...init.headers },
    });
    const text = await response.text();
    if (!response.ok) {
      let message = text || `Aleo service request failed (${response.status})`;
      try {
        message = (JSON.parse(text) as { error?: string }).error || message;
      } catch {
        // Preserve a useful non-JSON server error.
      }
      throw new Error(message);
    }
    return JSON.parse(text) as T;
  }
}
