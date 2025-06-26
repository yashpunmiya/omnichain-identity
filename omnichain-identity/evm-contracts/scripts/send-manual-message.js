// send-manual-message.js
// This script sends a cross-chain message without trying to use the quoteLinkFee
const hre = require("hardhat");
const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
  // Get the network name
  const networkName = hre.network.name;
  console.log(`Sending message on ${networkName}...`);

  // Get the deployed OmnichainIdentityLinker contract address
  const identityLinkerAddress = process.env.IDENTITY_LINKER_ADDRESS;
  if (!identityLinkerAddress) {
    console.error("❌ Error: IDENTITY_LINKER_ADDRESS not set in .env file");
    console.log("Please set IDENTITY_LINKER_ADDRESS=your_deployed_contract_address in .env");
    process.exit(1);
  }
  
  console.log(`Using OmnichainIdentityLinker contract: ${identityLinkerAddress}`);
  
  // Create contract instance
  const identityLinkerABI = [
    "function SOLANA_CHAIN_ID() external view returns (uint32)",
    "function peers(uint32 _eid) external view returns (bytes32)",
    "function linkAddress(string memory _solanaAddress) external payable",
    "function getLinkedAddresses(address _evmAddress) external view returns (bytes[] memory)"
  ];
  
  const signer = (await ethers.getSigners())[0];
  console.log(`Using signer address: ${signer.address}`);
  
  const identityLinker = new ethers.Contract(
    identityLinkerAddress, 
    identityLinkerABI, 
    signer
  );

  // Get the Solana Chain ID from the contract
  const SOLANA_CHAIN_ID = await identityLinker.SOLANA_CHAIN_ID();
  console.log(`Solana Chain ID from contract: ${SOLANA_CHAIN_ID}`);

  // Check if peer is set
  const peer = await identityLinker.peers(SOLANA_CHAIN_ID);
  console.log(`Current peer for Solana: ${peer}`);
  
  if (peer === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    console.error("❌ Peer not set! Please run setup-solana-peer.js first");
    process.exit(1);
  }

  // Create a test Solana address - REPLACE THIS WITH YOUR ACTUAL SOLANA ADDRESS
  const solanaAddress = "8ZKTGzysYQUknufpqJSLtKwzJZmHsWkJGxpQqKUe6C2D";
  
  console.log(`\nSending link request for Solana address: ${solanaAddress}`);
  
  // We'll send a hardcoded amount for gas (0.02 ETH should be enough)
  const gasAmount = ethers.parseEther("0.02");
  console.log(`Sending with ${ethers.formatEther(gasAmount)} ETH for gas`);
  
  // Send the transaction
  console.log("\nSending transaction...");
  try {
    const tx = await identityLinker.linkAddress(solanaAddress, {
      value: gasAmount
    });
    
    console.log(`Transaction hash: ${tx.hash}`);
    console.log(`View on Etherscan: https://${networkName}.etherscan.io/tx/${tx.hash}`);
    console.log("Waiting for confirmation...");
    
    await tx.wait();
    console.log("\n✅ SUCCESS! Cross-chain message sent to Solana");
    
    console.log("\nChecking linked addresses...");
    const linkedAddresses = await identityLinker.getLinkedAddresses(signer.address);
    console.log(`Found ${linkedAddresses.length} linked addresses`);
    
    if (linkedAddresses.length > 0) {
      console.log("Linked addresses:");
      for (let i = 0; i < linkedAddresses.length; i++) {
        // Try to convert bytes to string
        try {
          const addrString = ethers.toUtf8String(linkedAddresses[i]);
          console.log(`  ${i + 1}. ${addrString}`);
        } catch (e) {
          console.log(`  ${i + 1}. ${linkedAddresses[i]}`);
        }
      }
    }
    
    console.log("\n🎉 CONGRATULATIONS! Your EVM to Solana message has been sent!");
    console.log("\nNext steps:");
    console.log("1. Check the transaction on LayerZeroScan:");
    console.log(`   https://testnet.layerzeroscan.com/tx/${tx.hash}`);
    console.log("2. Check your Solana identity account to verify the linkage:");
    console.log("   cd ../devtools/examples/oapp-solana");
    console.log(`   yarn run ts-node scripts/check-identity-account.ts ${solanaAddress}`);
    
  } catch (error) {
    console.error("\n❌ Error sending transaction:", error);
    console.log("\nPossible solutions:");
    console.log("1. Make sure you have enough ETH in your wallet");
    console.log("2. Try increasing the gas amount");
    console.log("3. Check the peer configuration");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
