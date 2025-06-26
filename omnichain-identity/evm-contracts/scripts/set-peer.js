// set-peer.js
// This script sets the peer for your OmnichainIdentityLinker contract
const hre = require("hardhat");
require('dotenv').config();

async function main() {
  // Get the network name
  const networkName = hre.network.name;
  console.log(`Setting LayerZero peer on ${networkName}...`);

  try {
    // Get the deployed OmnichainIdentityLinker contract address
    const identityLinkerAddress = process.env.IDENTITY_LINKER_ADDRESS;
    if (!identityLinkerAddress) {
      console.error("❌ Error: IDENTITY_LINKER_ADDRESS not set in .env file");
      console.log("Please set IDENTITY_LINKER_ADDRESS=your_deployed_contract_address in .env");
      process.exit(1);
    }
    
    console.log(`Using OmnichainIdentityLinker contract: ${identityLinkerAddress}`);
    
    // Get Solana program address from .env
    const solanaOAppAddress = process.env.SOLANA_OAPP_ADDRESS;
    if (!solanaOAppAddress) {
      console.error("❌ Error: SOLANA_OAPP_ADDRESS not set in .env file");
      console.log("Please set SOLANA_OAPP_ADDRESS=your_solana_program_address in .env");
      process.exit(1);
    }
    
    console.log(`Setting peer to Solana OApp: ${solanaOAppAddress}`);
    
    // Create contract instance with setPeer function
    const identityLinkerABI = [
      "function setPeer(uint32 _eid, bytes32 _peer) external",
      "function getPeer(uint32 _eid) external view returns (bytes32)"
    ];
    
    const signer = (await ethers.getSigners())[0];
    console.log(`Using signer address: ${signer.address}`);
    
    const identityLinker = new ethers.Contract(
      identityLinkerAddress, 
      identityLinkerABI, 
      signer
    );
    
    // Solana chain ID for LayerZero V2
    const SOLANA_CHAIN_ID = 30168;
    
    // Convert the Solana address to bytes32 format - different approach
    // In reality, this encoding might need to be adjusted based on how
    // the Solana OApp expects to receive the peer data
    
    // For now, we'll just pad the base58 address with zeroes to make a bytes32
    const solanaAddressBytes = Buffer.from(solanaOAppAddress);
    const paddedBytes = Buffer.concat([
      solanaAddressBytes,
      Buffer.alloc(32 - solanaAddressBytes.length, 0)
    ]);
    
    const peer = '0x' + paddedBytes.toString('hex');
    console.log(`Formatted peer value: ${peer}`);
    
    // Check if peer is already set
    try {
      const existingPeer = await identityLinker.getPeer(SOLANA_CHAIN_ID);
      console.log(`Current peer for Solana: ${existingPeer}`);
      
      if (existingPeer !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
        console.log("⚠️ Peer is already set. Do you want to update it?");
        console.log("If yes, continue. If no, press Ctrl+C to cancel.");
        // Add a small delay to allow the user to cancel
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.log("Could not check existing peer, continuing with setting it...");
    }
    
    // Set the peer
    console.log(`Setting peer for chain ID ${SOLANA_CHAIN_ID}...`);
    const tx = await identityLinker.setPeer(SOLANA_CHAIN_ID, peer);
    
    console.log(`Transaction sent! Hash: ${tx.hash}`);
    console.log("Waiting for confirmation...");
    
    await tx.wait();
    console.log("✅ Peer set successfully!");
    
    // Verify that the peer was set
    const verifyPeer = await identityLinker.getPeer(SOLANA_CHAIN_ID);
    console.log(`Verified peer value: ${verifyPeer}`);
    
    console.log("\nNext steps:");
    console.log("1. Run verify-lz-connection.js to test sending a message from EVM to Solana");
    console.log("2. Check your Solana PDA for the linked address using the check-identity-account.ts script");
    
  } catch (error) {
    console.error("❌ Error setting peer:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
