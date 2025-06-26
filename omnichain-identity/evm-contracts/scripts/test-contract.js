// Install bs58 package for Solana address handling
const hre = require("hardhat");
const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("Testing connect to contract...");

  // Get the network name
  const networkName = hre.network.name;
  console.log(`Network: ${networkName}`);

  // Get the contract address from env
  const contractAddress = process.env.IDENTITY_LINKER_ADDRESS;
  console.log(`Contract address: ${contractAddress}`);

  // Create contract instance
  const oappABI = [
    "function setPeer(uint32 _eid, bytes32 _peer) external",
    "function peers(uint32 _eid) external view returns (bytes32)",
    "function SOLANA_CHAIN_ID() external view returns (uint32)"
  ];
  
  const signer = (await ethers.getSigners())[0];
  console.log(`Signer address: ${signer.address}`);
  
  // Get contract
  const contract = new ethers.Contract(contractAddress, oappABI, signer);

  try {
    // Verify we can call basic functions
    const solanaChainId = await contract.SOLANA_CHAIN_ID();
    console.log(`✅ Contract connection successful! Solana Chain ID: ${solanaChainId}`);
    
    // Try to read current peer (if any)
    try {
      const currentPeer = await contract.peers(solanaChainId);
      console.log(`Current peer for chain ${solanaChainId}: ${currentPeer}`);
    } catch (peerError) {
      console.error("Error reading peer:", peerError.message);
    }
    
    // For Solana peer registration, you need to use LayerZero's standard format
    // For LayerZero V2, we recommend using the LayerZero UI to set peers
    console.log("\nTo set the Solana peer, you need to use the LayerZero UI:");
    console.log("1. Go to https://testnet.layerzeroscan.com/");
    console.log("2. Find your OmnichainIdentityLinker contract");
    console.log("3. Connect wallet and use the 'Set Peer' function");
    console.log("4. Set EID: 30168 (Solana Testnet)");
    console.log(`5. Set peer address to your Solana program: ${process.env.SOLANA_OAPP_ADDRESS}`);
  } catch (error) {
    console.error("Error connecting to contract:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
