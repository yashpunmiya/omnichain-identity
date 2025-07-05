require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy");
require("@layerzerolabs/toolbox-hardhat");
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000000";
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || "https://ethereum-sepolia.blockpi.network/v1/rpc/public";
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || "https://polygon-mumbai.blockpi.network/v1/rpc/public";
const BSC_RPC_URL = process.env.BSC_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: ETHEREUM_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
    mumbai: {
      url: POLYGON_RPC_URL, 
      accounts: [PRIVATE_KEY],
    },
    bscTestnet: {
      url: BSC_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
    'solana-testnet': {
      url: 'https://api.devnet.solana.com',
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
