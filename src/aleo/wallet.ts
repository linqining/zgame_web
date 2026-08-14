import { Network } from '@provablehq/aleo-types';
import { DecryptPermission } from '@provablehq/aleo-wallet-adaptor-core';
import { LeoWalletAdapter } from '@provablehq/aleo-wallet-adaptor-leo';
import { ShieldWalletAdapter } from '@provablehq/aleo-wallet-adaptor-shield';

export type AleoExecuteRequest = {
  program: string;
  function: string;
  inputs: string[];
  feeMicrocredits?: number;
};

export type AleoWallet = {
  connect(): Promise<string | { address: string }>;
  disconnect?(): Promise<void>;
  signMessage(message: Uint8Array): Promise<string>;
  execute(request: AleoExecuteRequest): Promise<unknown>;
};

export type WalletOption = {
  id: string;
  name: string;
  installed: boolean;
  wallet: AleoWallet;
};

type ProvableAdapter = {
  name: string;
  readyState: string;
  connect(
    network: Network,
    permission: DecryptPermission,
    programs?: string[],
  ): Promise<{ address: string }>;
  disconnect(): Promise<void>;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
  executeTransaction(request: {
    program: string;
    function: string;
    inputs: string[];
    fee?: number;
    privateFee?: boolean;
  }): Promise<{ transactionId: string }>;
};

export function signatureString(value: unknown): string {
  if (typeof value === 'string' && value.length > 0) return value;
  if (value instanceof Uint8Array) {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(value);
    if (decoded.length > 0) return decoded;
  }
  if (Array.isArray(value) && value.every((byte) => Number.isInteger(byte))) {
    return signatureString(Uint8Array.from(value));
  }
  if (value && typeof value === 'object' && 'signature' in value) {
    return signatureString((value as { signature: unknown }).signature);
  }
  throw new Error('Aleo wallet did not return a textual snarkVM signature');
}

export function connectedAddress(value: string | { address: string }): string {
  const address = typeof value === 'string' ? value : value.address;
  if (!address || (!address.startsWith('aleo1') && !address.startsWith('mock:'))) {
    throw new Error('Wallet did not return an Aleo address');
  }
  return address;
}

export function transactionIdFromWalletResult(value: unknown): string {
  const candidate = typeof value === 'string'
    ? value
    : value && typeof value === 'object' && 'transactionId' in value
      ? (value as { transactionId: unknown }).transactionId
      : value && typeof value === 'object' && 'transaction_id' in value
        ? (value as { transaction_id: unknown }).transaction_id
        : undefined;
  if (typeof candidate !== 'string' || !candidate.startsWith('at1')) {
    throw new Error('Aleo wallet did not return a canonical transaction ID');
  }
  return candidate;
}

function framed(parts: Uint8Array[]): Uint8Array {
  const size = parts.reduce((total, part) => total + 8 + part.length, 0);
  const output = new Uint8Array(size);
  const view = new DataView(output.buffer);
  let offset = 0;
  for (const part of parts) {
    view.setBigUint64(offset, BigInt(part.length), true);
    offset += 8;
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

export async function mockActionSignature(address: string, message: Uint8Array): Promise<string> {
  const encoded = framed([
    new TextEncoder().encode('zgame-aleo/mock-action-signature-v1'),
    new TextEncoder().encode(address),
    message,
  ]);
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', encoded.buffer as ArrayBuffer),
  );
  const hex = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `mock-action-signature:${hex}`;
}

function adapterWallet(adapter: ProvableAdapter): AleoWallet {
  const custodyProgram = import.meta.env.VITE_ALEO_CUSTODY_PROGRAM_ID as string | undefined;
  const stateProgram = import.meta.env.VITE_ALEO_STATE_PROGRAM_ID as string | undefined
    ?? 'zgame_poker_state_v1.aleo';
  const programs = [...new Set([custodyProgram, stateProgram]
    .filter((program): program is string => typeof program === 'string' && !program.startsWith('mock.'))
  )];
  return {
    connect: () => adapter.connect(Network.TESTNET, DecryptPermission.NoDecrypt, programs.length ? programs : undefined),
    disconnect: () => adapter.disconnect(),
    signMessage: async (message) => signatureString(await adapter.signMessage(message)),
    execute: (request) => adapter.executeTransaction({
      program: request.program,
      function: request.function,
      inputs: request.inputs,
      fee: (request.feeMicrocredits ?? 1_000_000) / 1_000_000,
      privateFee: false,
    }),
  };
}

function mockWallet(): WalletOption | null {
  if (import.meta.env.VITE_ALEO_MOCK !== 'true') return null;
  const name = new URLSearchParams(window.location.search).get('mockWallet') || 'alice';
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(name)) return null;
  const address = `mock:${name}`;
  return {
    id: 'mock',
    name: `Local mock (${name})`,
    installed: true,
    wallet: {
      connect: async () => address,
      signMessage: async (message) => {
        const statement = new TextDecoder().decode(message);
        const nonce = statement.match(/^nonce=(.+)$/m)?.[1];
        return nonce ? `mock-signature:${nonce}` : mockActionSignature(address, message);
      },
      execute: async () => `at1mock${Date.now().toString(36)}`,
    },
  };
}

export function walletOptions(): WalletOption[] {
  const mock = mockWallet();
  if (mock) return [mock];
  const leo = new LeoWalletAdapter({ appName: 'ZGame Aleo' }) as unknown as ProvableAdapter;
  const shield = new ShieldWalletAdapter() as unknown as ProvableAdapter;
  return [
    { id: 'leo', name: leo.name, installed: leo.readyState === 'Installed', wallet: adapterWallet(leo) },
    { id: 'shield', name: shield.name, installed: shield.readyState === 'Installed', wallet: adapterWallet(shield) },
  ];
}
