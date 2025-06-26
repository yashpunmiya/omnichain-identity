require("@nomicfoundation/hardhat-toolbox");
require("@layerzerolabs/toolbox-hardhat");
require('dotenv').config();

const { EndpointId } = require('@layerzerolabs/lz-definitions')

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000000";
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || "https://ethereum-goerli.publicnode.com";
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || "https://polygon-mumbai.blockpi.network/v1/rpc/public";
const BSC_RPC_URL = process.env.BSC_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      eid: EndpointId.SEPOLIA_V2_TESTNET,
      url: ETHEREUM_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
    mumbai: {
      eid: EndpointId.AMOY_V2_TESTNET,
      url: POLYGON_RPC_URL, 
      accounts: [PRIVATE_KEY],
    },
    bscTestnet: {
      eid: EndpointId.BSC_V2_TESTNET,
      url: BSC_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
    // Original network configs (keeping for compatibility)
    ethereum: {
      url: ETHEREUM_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
    polygon: {
      url: POLYGON_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
    bsc: {
      url: BSC_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
    hardhat: {
      // For testing
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
