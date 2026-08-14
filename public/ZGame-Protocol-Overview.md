# ZGame Protocol Overview

**Active product track: Aleo**  
**Research tracks: ZChain and Stwo proving**

## 1. Product boundary

ZGame is a Texas Hold'em stack that combines an encrypted mental-poker protocol with Aleo-native custody and settlement. Real-time turns use canonical off-chain state. Deposits, table locks, settlement approvals and withdrawals remain wallet-signed Aleo operations.

```text
Aleo wallet -- signed one-time challenge --> zgame_aleo gateway
zgame_aleo -- authenticated loopback API --> proving service
proving service -- native settlement payload --> Aleo program
```

The browser is an interface, not the source of truth. It never supplies an authoritative caller identity or balance.

## 2. Wallet and identity

The player signs a one-time challenge as exact UTF-8 bytes. The public gateway verifies the signature, creates a short-lived session, and derives game identity from the verified Aleo address using a domain-separated hash.

- The browser does not provide `caller_hex`.
- Player private keys remain inside the wallet extension.
- Authenticated actions are bound to the verified wallet session.

## 3. Custody lifecycle

```text
connect → deposit → lock table → play → settlement proposal
        → approve exact digest → settle → withdraw
```

After a wallet operation returns an `at1...` transaction ID, the gateway records it as reported. The proving service queries Aleo directly and marks it finalized only when the deployed program and expected function match. A player cannot join until the finalized table-lock mapping is visible.

Broadcast is not finality.

## 4. Mental-poker protocol

The deck remains encrypted across the multiplayer shuffle. Players jointly transform it through proof-preserving phases so the game can progress without revealing card order or another player's private cards.

| Phase | Proof |
| --- | --- |
| shuffle | VersionedShuffleProof · Bayer-Groth V2 |
| remask | RemaskProof · DLEqProof |
| reveal | RevealTokenProof |
| reconstruct | ReconstructProof · ReconstructionDLEQProof |
| swap-out | SwapOutCardProof |

The UI projects canonical protocol state through the shared poker schema rather than inferring state from local interaction history.

## 5. Settlement integrity

At the terminal hand boundary, the settlement proposal returns the exact digest, payout vector and fees. Every occupied player approves that digest through the Aleo custody program. The operator then submits the approved settlement arguments with its own wallet.

Unanimous approval remains part of the current safety model while complete Texas terminal and side-pot lifecycle constraints continue to be incorporated into the native circuit.

## 6. Research tracks

### ZChain

ZChain explores a game-first Layer-1 design: Narwhal-Bullshark DAG consensus, dedicated GameTurn execution, an object model, rBPF contracts and chain-native game custody.

### Stwo proving

The Stwo track explores Circle-STARK proving over M31, Texas Hold'em AIR circuits, a custom zkVM path and proof aggregation. This work can inform future proving architecture without being required by the current Aleo browser integration.

## 7. Current status and limitations

- Aleo is the active deployment and custody track.
- The player-facing Aleo wallet adapter and product experience are being integrated.
- Broadcast transactions must not be treated as finalized custody.
- Unanimous settlement approval remains enabled during circuit hardening.
- ZChain and Stwo are research tracks, not production claims for the Aleo path.

## Repositories

- Product: <https://github.com/linqining/zgame>
- Research: <https://github.com/linqining/zchain>
