# ZChain: A Zero-Knowledge Layer-1 for On-Chain Games

**Whitepaper v1.0**

## Abstract

ZChain is a self-developed Layer-1 blockchain purpose-built for high-throughput, adversarial, hidden-information games. It pairs a mempool-less Narwhal-Bullshark DAG consensus with a three-layer trust model, a gas-free GameTurn channel, and a Stwo Circle-STARK proving stack — including a custom RISC-V zkVM and 21 hand-written method AIRs for Texas Hold'em. The result is provably-fair gameplay at 100,000+ off-chain transactions per second, settling to L1 with cryptographic certainty.

## 1. Vision & Problem

Real-time games — poker, trading, concealed-information duels — fail on general-purpose chains. Latency is too high, per-turn gas destroys the experience, and operators cannot prove a deal was fair. Existing "game chains" bolt a proving service onto an EVM and still inherit its throughput ceiling and fee model.

ZChain starts from the game and works backward. Its design goals:

- **Gas-free gameplay**, with buy-in collateral deterring abuse.
- **Off-chain execution with on-chain settlement** under zero-knowledge proofs.
- **Progressive trust minimization**: BFT, then witness fallback, then pure cryptography.
- **High throughput and low latency** via a DAG + compact block relay.
- **Multi-curve wallets** and upgradeable, governable contracts.

## 2. Architecture Overview

ZChain is a Cargo workspace with five crates and a node binary. The chain core (`poker_l1`) depends on a custom zkVM (`poker_zkvm`), shared VM primitives (`vm-common`), Texas Hold'em AIR circuits (`poker_texas_air`), and an air-gapped proving service (`proving_service`). The game protocol types and mental-poker shuffle live in an external `poker_protocol` crate.

Module map:

- `object_model` — Object / ObjectID / Sparse Merkle Tree / ObjectStore
- `signature` — tagged pubkey, secp256k1 + ed25519, low-s enforcement
- `transaction` — 4 lanes: Public / GameTurn / CheckpointAnchor / ForceSync
- `block` — BlockHeader, dual-channel tx_root, time consensus
- `consensus` — Narwhal-Bullshark DAG, Bullshark order, slashing, VRF
- `storage` — RocksDB, pruning, historical data requests
- `vm` — rBPF VM, syscalls, gas metering, upgradeable contracts
- `offline` — OffChain mode, ZK verifier registry, checkpoint / check-in
- `network` — gossipsub, compact block relay, peer exchange
- `node` — roles: validator / full / archive / light
- `rpc` — JSON-RPC 2.0, auth, sliding-window rate limiting
- `bridge` — wrapped-asset minting, nonce-protected verification
- `governance` — parameter proposals, timelock, sensitive-key quorum
- `sync / indexer` — fast & snap sync, on-chain event indexing

## 3. The Layer-1

### Consensus

ZChain uses Narwhal-Bullshark: Narwhal provides data availability through a DAG of vertices, while Bullshark provides ordering via commit certificates. Because data propagation is decoupled from consensus ordering, validators emit vertices in parallel and throughput scales with network bandwidth. There is no mempool — transactions are packed directly into the next vertex within a 100 ms buffer window. Finality is a 2/3 stake-weighted quorum, around 3 seconds.

### Networking

Vertices are first broadcast as compact blocks using short IDs; missing transactions are requested on demand, with fallback to full broadcast on collision. Peer exchange (PEX) supports discovery over the TCP transport. A dual-channel tx_root separates public and game traffic at the block level.

### Virtual machine

Contracts execute in a resource-metered rBPF VM with an upgrade capability (UpgradeCap). It exposes BLS12-381 G1/G2 pairing precompiles with subgroup checks and RFC 9380 hash-to-curve, alongside gas tables and a syscall surface including a (currently dormant) on-chain zk_verify.

## 4. Three-Layer Trust Model

The central innovation is progressive trust minimization. Each action is routed to the cheapest trust assumption that is still safe; trust drops and performance rises as you go down the stack, and any failed layer degrades safely to the one beneath it.

- **Layer 1 — Public channel.** Full BFT consensus (>= 2/3 honest validators). ~1,000 tx/s, ~3 s finality, normal gas. Used for transfers, contracts, settlement, fallback, and slashing.
- **Layer 2 — Game channel.** A single assigned validator packs turns, witnessed by replicas. Trust: honest assigned validator OR >= 4 honest witnesses (3-of-5 fallback). ~1,000 tx/s, gas-free. Used for real-time actions like fold / check / call / raise.
- **Layer 3 — Off-chain.** No trust assumption beyond ZK soundness. 100,000+ tx/s with millisecond latency; cost is settled at check-in. Used for off-chain play and Stwo proof settlement.

Escape hatches operate in both directions: a censored Layer-2 turn falls back to the L1 public channel; a stalled off-chain operator is forced into a checkpoint or check-in by any participant via force_checkpoint / force_checkin transactions.

## 5. Gas-Free GameTurn

In-game actions travel a dedicated GameTurn lane. The protocol hard-constrains turn ordering, validates buy-in collateral, and routes through the assigned validator. Because these transactions are spec-limited, they carry no gas — yet they retain BFT-class safety through the witness fallback. This is what makes a poker hand feel instant while remaining settleable on-chain.

## 6. ZK Proving Stack

ZChain's proving layer is based on Stwo — Circle-STARK with AIR and FRI over the M31 field. It is distributed across three crates and is written from the field up rather than wrapping a third-party prover.

### Custom zkVM

`poker_zkvm` is a RISC-V zkVM whose trace is generated natively over M31 (4 x 8-bit limbs). It includes AIRs for CPU steps, memory reads/writes, Poseidon, SHA-256, and range checks, plus a recursive proof path.

### Texas Hold'em AIRs

`poker_texas_air` compiles Texas Hold'em methods into 21 hand-written AIR circuits — 6 lifecycle, 8 actions, 2 funds, and 5 crypto — each proven per method and verified natively into a VerifiedChain receipt. A descriptor-only aggregator stages aggregation ahead of full recursive composition.

### Proving service

An air-gapped axum HTTP service is the sole consumer of the AIR crate. It ingests Borsh `ProveTask`s dispatched by the chain, runs per-method Stwo proofs with immediate native verification, and returns signed receipts. The on-chain zk_verify syscall is wired and fail-closed, pending activation.

## 7. Mental-Poker Games

ZChain's flagship game is Texas Hold'em built on mental poker. The deck is encrypted end-to-end with ElGamal; no party — including the operator — can read a card they were not dealt. Each transition carries a zero-knowledge proof:

| Game phase | Proof |
| --- | --- |
| registration | PKOwnershipProof |
| shuffle | VersionedShuffleProof (Bayer-Groth V2) |
| join / mask | RemaskProof + DLEqProof<RemaskKind> |
| leave | LeaveProof + DLEqProof<LeaveKind> |
| reveal | RevealTokenProof |
| reconstruct | ReconstructProof + ReconstructionDLEQProof |
| swap-out | SwapOutCardProof |

The shuffle argument runs over BLS12-381 while Stwo executes on M31; the circuit records a foreign shuffle-verify call and the host returns the constrained result. A game-phase state machine governs betting rounds (Preflop -> Flop -> Turn -> River -> Showdown) and parallel multi-player submit phases (Shuffle / RevealToken / Reconstruct / LeaveProof), each with independent on-chain timeout safety. The mental-poker proof systems are accompanied by a Lean 4 + Mathlib formalisation, including a counterexample to the legacy reconstruction relation and a repaired V3 with machine-checked soundness.

## 8. Tokenomics

The native token is **ZCN**, a UTXO coin. ZCN exists only as live UTXOs, in contract and staking escrow, or in treasury; `Account.balance` is deliberately excluded from native supply. A singleton TreasuryCap commits to outstanding, minted, and burned supply, and a global reconciliation spans every custody domain so issuance and burns always balance.

- Validators bond ZCN into escrow; misbehavior is slashed and burned.
- Game funds are locked as buy-in collateral and released at settlement.
- Public-lane transactions default to free resource metering; gas meters block resources.

## 9. Security & Audits

The chain core has passed two security-audit passes covering 28 findings, with 1,600+ tests across 20 modules. Hardened subsystems include real commit-certificate signature verification, ECVRF-secp256k1-SHA256-TAI leader selection, slashing evidence with full vertex/certificate payloads, a real multi-validator BFT loop with a 2/3 quorum, and UTXO-conserving staking settlement. Known frontiers — libp2p/DHT discovery, on-chain zk_verify activation, and recursive proof composition — are tracked on the roadmap.

## 10. Roadmap

- **Core chain:** DAG consensus, object model, rBPF VM, multi-validator BFT.
- **Hardened economics:** ZCN UTXO economy, staking, VRF, bridge, governance, sync, indexer.
- **ZK proving stack:** Stwo zkVM, 21 method AIR, proving service, mental-poker shuffle.
- **Decentralized proving:** on-chain zk_verify, recursive aggregation, libp2p transport, public testnet.

---

Join the community on Telegram, Discord, and Twitter / X.
