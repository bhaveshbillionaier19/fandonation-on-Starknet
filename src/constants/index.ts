export const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/demo";

export const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL || "https://sepolia.starkscan.co";

export const STRK_TOKEN_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

import contractAbiData from "./contractAbi.json";

export const contractAbi = contractAbiData;

export const strkAbi = [
  {
    name: "approve",
    type: "function",
    inputs: [
      { name: "spender", type: "core::starknet::contract_address::ContractAddress" },
      { name: "amount", type: "core::integer::u256" },
    ],
    outputs: [{ type: "core::bool" }],
    state_mutability: "external",
  },
];
