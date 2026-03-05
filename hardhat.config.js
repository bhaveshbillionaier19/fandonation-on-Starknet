


/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Creditcoin Testnet (Primary Deployment Network)
    creditcoinTestnet: {
      type: 'http',
      url: "https://rpc.cc3-testnet.creditcoin.network/",
      chainId: 102031,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};