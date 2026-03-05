# StarkNet Sepolia — Deployment Guide

Everything you need to declare, deploy, and interact with NFTDonation on StarkNet Sepolia.

---

## What's Already Done

The following are **already installed and ready** on your machine:

| Tool | Version | Location |
|---|---|---|
| **scarb** | 2.16.0 | `~/scarb-install/scarb-v2.16.0-x86_64-pc-windows-msvc/bin/scarb.exe` |
| **starkli** | 0.4.2 | `~/starkli-install/starkli.exe` |
| **Account** | Argent X | `~/.starkli-wallets/deployer/account.json` |
| **Keystore** | Created | `~/.starkli-wallets/deployer/keystore.json` (password: `deployer123`) |
| **Contract** | Compiled ✅ | `starknet/target/dev/nft_donation_NFTDonation.contract_class.json` |

---

## Step 0: Set PATH (run this first in every terminal session)

```bash
export PATH="$HOME/scarb-install/scarb-v2.16.0-x86_64-pc-windows-msvc/bin:$HOME/starkli-install:$PATH"
export STARKNET_KEYSTORE_PASSWORD="deployer123"
```

Verify:
```bash
scarb --version    # should show 2.16.0
starkli --version  # should show 0.4.2
```

---

## Step 1: Build (already done, but if you change the contract)

```bash
cd "c:/Users/HP/Desktop/intern/fandonation on starknet/fandonation-on-creditcoin/starknet"
scarb build
```

Artifacts go to `target/dev/`.

---

## Step 2: Get Sepolia ETH for Gas

1. Go to https://starknet-faucet.vercel.app/
2. Paste your address: `0x038F9bD3bf1257ae8127c426DC4bF4A7Ea5d904A845578E77A7DAC3034BdBE79`
3. Request **Sepolia STRK** (you need STRK for gas on v3 transactions)

---

## Step 3: Declare the Contract

```bash
cd "c:/Users/HP/Desktop/intern/fandonation on starknet/fandonation-on-creditcoin/starknet"

starkli declare target/dev/nft_donation_NFTDonation.contract_class.json \
  --casm-file target/dev/nft_donation_NFTDonation.compiled_contract_class.json \
  --account ~/.starkli-wallets/deployer/account.json \
  --keystore ~/.starkli-wallets/deployer/keystore.json \
  --rpc "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/demo"
```

> **Important**: Use `--casm-file` to pass the pre-compiled CASM file. This avoids the compiler version mismatch (starkli's built-in compiler is v2.11.4, but our contract was compiled with v2.16.0).

> **RPC endpoint**: Must use the **v0_8** Alchemy endpoint (not v0_7). BlastAPI and other free RPCs currently don't support the v3 transaction format that starkli v0.4.2 uses.

**Save the CLASS_HASH** from the output — you need it for deployment.

If it says "already declared", the class hash is still valid — just note it down.

---

## Step 4: Deploy the Contract

```bash
starkli deploy <CLASS_HASH> \
  --account ~/.starkli-wallets/deployer/account.json \
  --keystore ~/.starkli-wallets/deployer/keystore.json \
  --rpc "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/demo"
```

Replace `<CLASS_HASH>` with the hash from Step 3. No constructor arguments needed.

**Save the CONTRACT_ADDRESS** from the output.

---

## Step 5: Verify on Explorer

Open in browser:
```
https://sepolia.starkscan.co/contract/<CONTRACT_ADDRESS>
```

---

## Step 6: Interact with the Contract

### Read functions (free, no gas)

```bash
RPC="https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/demo"

# Total supply
starkli call <CONTRACT_ADDRESS> total_supply --rpc "$RPC"

# Token name
starkli call <CONTRACT_ADDRESS> name --rpc "$RPC"

# Owner of token 1
starkli call <CONTRACT_ADDRESS> owner_of 1 --rpc "$RPC"

# Token URI
starkli call <CONTRACT_ADDRESS> token_uri 1 --rpc "$RPC"

# Total donations for token 1
starkli call <CONTRACT_ADDRESS> total_donations 1 --rpc "$RPC"
```

### Write functions (costs gas)

```bash
ACCT=~/.starkli-wallets/deployer/account.json
KEY=~/.starkli-wallets/deployer/keystore.json
RPC="https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/demo"

# Mint an NFT
starkli invoke <CONTRACT_ADDRESS> mint_nft \
  str:"ipfs://QmYourMetadataHash" \
  --account "$ACCT" --keystore "$KEY" --rpc "$RPC"

# Donate STRK to token 1 (amount in wei)
# First approve the contract to spend your STRK:
STRK=0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d

starkli invoke "$STRK" approve \
  <CONTRACT_ADDRESS> u256:1000000000000000 \
  --account "$ACCT" --keystore "$KEY" --rpc "$RPC"

# Then donate:
starkli invoke <CONTRACT_ADDRESS> donate \
  u256:1 u256:1000000000000000 \
  --account "$ACCT" --keystore "$KEY" --rpc "$RPC"
```

---

## Step 7: Update .env.local

After deployment, update your `.env.local`:

```
NEXT_PUBLIC_STARKNET_CONTRACT_ADDRESS=<CONTRACT_ADDRESS>
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `scarb: command not found` | Run the `export PATH=...` from Step 0 |
| `data did not match any variant` | Use the Alchemy **v0_8** RPC URL (not v0_7, not BlastAPI) |
| `Mismatch compiled class hash` | Add `--casm-file target/dev/...compiled_contract_class.json` to declare |
| `insufficient balance` | Get STRK from https://starknet-faucet.vercel.app/ |
| Keystore password prompt | Set `export STARKNET_KEYSTORE_PASSWORD="deployer123"` |

---

## Frontend Integration (starknet.js)

### Install

```bash
npm install starknet get-starknet
```

### Connect Argent X + Mint + Donate

```typescript
import { connect } from "get-starknet";
import { Contract, RpcProvider } from "starknet";

const CONTRACT_ADDRESS = "<YOUR_DEPLOYED_ADDRESS>";
const RPC_URL = "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/demo";

const ABI = [
  {
    name: "INFTDonationImpl",
    type: "impl",
    interface_name: "nft_donation::nft_donation::INFTDonation",
  },
  {
    name: "nft_donation::nft_donation::INFTDonation",
    type: "interface",
    items: [
      {
        name: "mint_nft",
        type: "function",
        inputs: [{ name: "token_uri", type: "core::byte_array::ByteArray" }],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "external",
      },
      {
        name: "donate",
        type: "function",
        inputs: [
          { name: "token_id", type: "core::integer::u256" },
          { name: "amount", type: "core::integer::u256" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        name: "total_supply",
        type: "function",
        inputs: [],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
      {
        name: "owner_of",
        type: "function",
        inputs: [{ name: "token_id", type: "core::integer::u256" }],
        outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
        state_mutability: "view",
      },
      {
        name: "token_uri",
        type: "function",
        inputs: [{ name: "token_id", type: "core::integer::u256" }],
        outputs: [{ type: "core::byte_array::ByteArray" }],
        state_mutability: "view",
      },
      {
        name: "total_donations",
        type: "function",
        inputs: [{ name: "token_id", type: "core::integer::u256" }],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
      {
        name: "balance_of",
        type: "function",
        inputs: [{ name: "owner", type: "core::starknet::contract_address::ContractAddress" }],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
      {
        name: "name",
        type: "function",
        inputs: [],
        outputs: [{ type: "core::byte_array::ByteArray" }],
        state_mutability: "view",
      },
      {
        name: "symbol",
        type: "function",
        inputs: [],
        outputs: [{ type: "core::byte_array::ByteArray" }],
        state_mutability: "view",
      },
    ],
  },
];

// Connect wallet
async function connectWallet() {
  const starknet = await connect();
  if (!starknet) throw new Error("Install Argent X");
  await starknet.enable();
  return starknet.account;
}

// Read total supply
async function getTotalSupply() {
  const provider = new RpcProvider({ nodeUrl: RPC_URL });
  const contract = new Contract(ABI, CONTRACT_ADDRESS, provider);
  return await contract.total_supply();
}

// Mint NFT
async function mintNFT(tokenUri: string) {
  const account = await connectWallet();
  const contract = new Contract(ABI, CONTRACT_ADDRESS, account);
  const result = await contract.mint_nft(tokenUri);
  await account.waitForTransaction(result.transaction_hash);
  return result;
}

// Donate (approve STRK first, then call donate)
async function donate(tokenId: number, amount: string) {
  const account = await connectWallet();
  const STRK = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
  
  // Approve
  const strkContract = new Contract(
    [{ name: "approve", type: "function",
       inputs: [{ name: "spender", type: "core::starknet::contract_address::ContractAddress" },
                { name: "amount", type: "core::integer::u256" }],
       outputs: [{ type: "core::bool" }], state_mutability: "external" }],
    STRK, account
  );
  const approveTx = await strkContract.approve(CONTRACT_ADDRESS, amount);
  await account.waitForTransaction(approveTx.transaction_hash);

  // Donate
  const contract = new Contract(ABI, CONTRACT_ADDRESS, account);
  const donateTx = await contract.donate(tokenId, amount);
  await account.waitForTransaction(donateTx.transaction_hash);
  return donateTx;
}
```
