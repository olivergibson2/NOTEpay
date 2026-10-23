# Pay — USDC Payments App

A USDC payments app on Arc Testnet. Connect your wallet to send USDC to any address, generate shareable payment request links, and browse your recent transaction history — all with sub-second finality and no separate gas token.

Built with [Arc Studio](https://studio.arc.io)

## Tech Stack

- React + TypeScript (Vite)
- wagmi v2 + ConnectKit (wallet connection)
- viem (Ethereum types and ABI utilities)
- framer-motion (animations)
- Tailwind CSS (styling)
- Arc Testnet / USDC (chain and token)

## Features

- **Send**: transfer USDC to any wallet address, with quick-amount chips, memo field, and live balance display
- **Request**: generate a shareable payment link pre-filled with your address, amount, and memo
- **History**: browse recent USDC Transfer events from the last 5,000 blocks

## Development

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- A browser wallet (MetaMask, Coinbase Wallet, etc.)

### Install

```bash
bun install
```

### Environment Variables

| Variable | Purpose |
|---|---|
| `RPC_PROXY_BASE_URL` | Arc Studio RPC proxy base URL (optional outside Arc Studio) |
| `RPC_PROXY_TOKEN` | Auth token for the RPC proxy (optional outside Arc Studio) |
| `RPC_PROXY_CHAINS` | Comma-separated list of proxied chain keys (optional outside Arc Studio) |

### Run

```bash
bun run dev
```

### Build

```bash
bun run build
```

### Type Check + Lint

```bash
bun run check
```

## Testnet Funding

Use the **"Get test USDC"** button in the Arc Studio sidebar to fund your wallet with testnet USDC. No external faucet needed.
