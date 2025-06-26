const hre = require("hardhat");
const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
  // Get the network name
  const networkName = hre.network.name;
  console.log(`Setting up Solana peer on ${networkName}...`);

  // Get the contract address from env
  const identityLinkerAddress = process.env.IDENTITY_LINKER_ADDRESS;
  if (!identityLinkerAddress) {
    console.error("❌ Error: IDENTITY_LINKER_ADDRESS not set in .env file");
    console.log("Please set IDENTITY_LINKER_ADDRESS=your_deployed_contract_address in .env");
    process.exit(1);
  }

  // Get the Solana OApp address
  const solanaOAppAddress = process.env.SOLANA_OAPP_ADDRESS;
  if (!solanaOAppAddress) {
    console.error("❌ Error: SOLANA_OAPP_ADDRESS not set in .env file");
    console.log("Please set SOLANA_OAPP_ADDRESS=your_solana_oapp_address in .env");
    process.exit(1);
  }

  console.log(`Using OmnichainIdentityLinker contract: ${identityLinkerAddress}`);
  console.log(`Setting up peer for Solana OApp: ${solanaOAppAddress}`);
  
  // Create contract instance with the necessary functions
  const identityLinkerABI = [
    "function SOLANA_CHAIN_ID() external view returns (uint32)",
    "function setPeer(uint32 _eid, bytes32 _peer) external",
    "function getPeer(uint32 _eid) external view returns (bytes32)",
    "function peers(uint32 _eid) external view returns (bytes32)"
  ];
  
  const signer = (await ethers.getSigners())[0];
  const identityLinker = new ethers.Contract(identityLinkerAddress, identityLinkerABI, signer);

  // Get the Solana Chain ID from the contract
  const SOLANA_CHAIN_ID = await identityLinker.SOLANA_CHAIN_ID();
  console.log(`Solana Chain ID from contract: ${SOLANA_CHAIN_ID}`);

  // For LayerZero V2, we need to create a proper bytes32 representation
  // Using simple string representation
  
  console.log("Converting Solana address to bytes32...");
  let solanaAddressBytes;
  
  try {
    // Convert the string to a proper bytes32 format
    // First convert to UTF-8 bytes
    const solanaAddressUtf8 = ethers.toUtf8Bytes(solanaOAppAddress);
    console.log(`UTF-8 bytes length: ${solanaAddressUtf8.length}`);
    
    // Create a new bytes32 array (all zeros)
    const bytes32 = new Uint8Array(32);
    
    // Copy our address bytes into the first part of bytes32
    // Only copy up to 32 bytes
    const bytesToCopy = Math.min(solanaAddressUtf8.length, 32);
    for(let i = 0; i < bytesToCopy; i++) {
      bytes32[i] = solanaAddressUtf8[i];
    }
    
    // Convert to hex string
    solanaAddressBytes = '0x' + Array.from(bytes32)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    console.log(`Solana OApp as bytes32: ${solanaAddressBytes}`);
  } catch (error) {
    console.error("Error encoding Solana address:", error);
    process.exit(1);
  }
  
  // Check if peer is already set
  const currentPeer = await identityLinker.peers(SOLANA_CHAIN_ID);
  if (currentPeer !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
    console.log(`Peer already set for Solana: ${currentPeer}`);
    if (currentPeer === solanaAddressBytes) {
      console.log("✅ Peer is correctly configured!");
      return;
    } else {
      console.log("⚠️ Peer is set to a different value. Updating...");
    }
  }
  
  // Set peer
  console.log(`Setting peer for chain ID ${SOLANA_CHAIN_ID} to ${solanaAddressBytes}...`);
  const tx = await identityLinker.setPeer(SOLANA_CHAIN_ID, solanaAddressBytes);
  
  console.log(`Transaction sent! Hash: ${tx.hash}`);
  console.log(`View on Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
  
  await tx.wait();
  console.log("✅ Peer set successfully!");
  
  // Verify peer was set correctly
  const updatedPeer = await identityLinker.peers(SOLANA_CHAIN_ID);
  console.log(`Updated peer value: ${updatedPeer}`);
  
  if (updatedPeer === solanaAddressBytes) {
    console.log("✅ Verification successful! Peer is correctly configured.");
    console.log("\nNow you can try sending messages to Solana using verify-lz-connection.js");
  } else {
    console.error("❌ Verification failed! Peer value does not match.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
