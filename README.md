# Fan Funding Platform on Creditcoin

A decentralized fan funding platform built on Creditcoin where creators can mint NFTs and receive direct funding from their supporters.

## 🚀 Deployed Contract

- **Network**: Creditcoin Testnet
- **Contract Address**: `0x7F7955562E2674ae9eC9A8c9EF30d41eFf2bb4a0`
- **Chain ID**: 102031
- **RPC URL**: https://rpc.cc3-testnet.creditcoin.network/
- **Block Explorer**: https://creditcoin-testnet.blockscout.com/

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS, RainbowKit
- **Smart Contracts**: Solidity 0.8.20, Hardhat
- **Blockchain**: Creditcoin Testnet
- **Storage**: IPFS via Pinata

## 📦 Installation

```bash
npm install --legacy-peer-deps
```

## 🔧 Development

```bash
npm run dev
```

## 🌐 Deployment

The app is deployed on Vercel. Environment variables needed:
- `NEXT_PUBLIC_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_NETWORK`
- `NEXT_PUBLIC_RPC_URL`
- `NEXT_PUBLIC_PINATA_JWT`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
