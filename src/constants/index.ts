export const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/demo";

export const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL || "https://sepolia.starkscan.co";

export const STRK_TOKEN_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

export const contractAbi = [
  {
    name: "NFTDonationImpl",
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
        name: "total_supply",
        type: "function",
        inputs: [],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
      {
        name: "balance_of",
        type: "function",
        inputs: [
          { name: "owner", type: "core::starknet::contract_address::ContractAddress" },
        ],
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
