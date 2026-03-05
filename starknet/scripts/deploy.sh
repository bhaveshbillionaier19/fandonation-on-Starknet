#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# StarkNet Sepolia — Declare & Deploy NFTDonation Contract
# ═══════════════════════════════════════════════════════════════
#
# Prerequisites:
#   1. Install scarb:  curl -L https://get.scarb.dev | bash
#   2. Install starkli: curl https://get.starkli.sh | sh && starkliup
#   3. Export your Argent X account (see DEPLOYMENT_GUIDE.md)
#
# Usage:
#   chmod +x scripts/deploy.sh
#   ./scripts/deploy.sh
# ═══════════════════════════════════════════════════════════════

set -e

# ─── Configuration ───
ACCOUNT_ADDRESS="${STARKNET_ACCOUNT_ADDRESS:-0x038F9bD3bf1257ae8127c426DC4bF4A7Ea5d904A845578E77A7DAC3034BdBE79}"
RPC_URL="${STARKNET_RPC_URL:-https://starknet-sepolia.public.blastapi.io}"
ACCOUNT_FILE="${STARKNET_ACCOUNT_FILE:-~/.starkli-wallets/deployer/account.json}"
KEYSTORE_FILE="${STARKNET_KEYSTORE_FILE:-~/.starkli-wallets/deployer/keystore.json}"

echo "═══════════════════════════════════════════════════════════"
echo "  NFTDonation — StarkNet Sepolia Deployment"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ─── Step 1: Build ───
echo "📦 Step 1: Building contract with Scarb..."
cd "$(dirname "$0")/.."
scarb build
echo "✅ Build complete. Artifacts in target/dev/"
echo ""

# ─── Step 2: Declare ───
CONTRACT_CLASS="target/dev/nft_donation_NFTDonation.contract_class.json"

if [ ! -f "$CONTRACT_CLASS" ]; then
    echo "❌ Contract class file not found at $CONTRACT_CLASS"
    echo "   Make sure 'scarb build' completed successfully."
    exit 1
fi

echo "📝 Step 2: Declaring contract class on Sepolia..."
echo "   RPC:     $RPC_URL"
echo "   Account: $ACCOUNT_ADDRESS"
echo ""

DECLARE_OUTPUT=$(starkli declare "$CONTRACT_CLASS" \
    --account "$ACCOUNT_FILE" \
    --keystore "$KEYSTORE_FILE" \
    --rpc "$RPC_URL" \
    2>&1)

echo "$DECLARE_OUTPUT"

# Extract class hash
CLASS_HASH=$(echo "$DECLARE_OUTPUT" | grep -oP '0x[0-9a-fA-F]+' | tail -1)

if [ -z "$CLASS_HASH" ]; then
    echo "❌ Failed to extract class hash from declaration output."
    echo "   If the class was already declared, find the hash on Starkscan."
    read -p "Enter class hash manually: " CLASS_HASH
fi

echo ""
echo "✅ Class Hash: $CLASS_HASH"
echo ""

# ─── Step 3: Deploy ───
echo "🚀 Step 3: Deploying contract..."
echo "   (No constructor arguments needed)"
echo ""

DEPLOY_OUTPUT=$(starkli deploy "$CLASS_HASH" \
    --account "$ACCOUNT_FILE" \
    --keystore "$KEYSTORE_FILE" \
    --rpc "$RPC_URL" \
    2>&1)

echo "$DEPLOY_OUTPUT"

# Extract contract address
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oP '0x[0-9a-fA-F]+' | tail -1)

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ Deployment Complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  Class Hash:       $CLASS_HASH"
echo "  Contract Address: $CONTRACT_ADDRESS"
echo ""
echo "  Explorer: https://sepolia.starkscan.co/contract/$CONTRACT_ADDRESS"
echo ""
echo "═══════════════════════════════════════════════════════════"
