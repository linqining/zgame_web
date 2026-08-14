import initWasm, { AleoWasmClientPlayer } from 'client-wasm-aleo';
import wasmUrl from 'client-wasm-aleo/client_wasm_aleo_bg.wasm?url';
import type { AleoWallet } from './wallet';

let initialized: Promise<unknown> | undefined;

function hex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function protocolSeedMaterial(statement: string, signature: string): string {
  return [statement, `signature=${signature}`].join('\n');
}

export async function initializeProtocolPlayer(
  wallet: AleoWallet,
  address: string,
): Promise<{ player: AleoWasmClientPlayer; publicKeyHex: string }> {
  initialized ??= initWasm({ module_or_path: wasmUrl });
  await initialized;
  const statement = [
    'zgame-aleo/protocol-seed-v1',
    `address=${address}`,
    `origin=${window.location.origin}`,
    'nonce=protocol-key',
  ].join('\n');
  const signature = await wallet.signMessage(new TextEncoder().encode(statement));
  const seedMaterial = protocolSeedMaterial(statement, signature);
  const seed = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(seedMaterial)));
  const player = new AleoWasmClientPlayer(seed);
  return { player, publicKeyHex: player.public_key_hex() };
}
