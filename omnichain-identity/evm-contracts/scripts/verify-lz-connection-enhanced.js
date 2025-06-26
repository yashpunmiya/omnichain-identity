// verify-lz-connection-enhanced.js
const hre = require("hardhat");
const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
  // Get the network name
  const networkName = hre.network.name;
  console.log(`Verifying LayerZero connection on ${networkName}...`);

  // Get the correct LZ endpoint based on network
  let lzEndpointAddress;
  switch (networkName) {
    case "ethereum":
    case "sepolia":
      lzEndpointAddress = process.env.LZ_ETHEREUM_ENDPOINT;
      break;
    case "polygon":
    case "mumbai":
      lzEndpointAddress = process.env.LZ_POLYGON_ENDPOINT;
      break;
    case "bsc":
    case "bscTestnet":
      lzEndpointAddress = process.env.LZ_BSC_ENDPOINT;
      break;
    default:
      console.error(`No LayerZero endpoint defined for network: ${networkName}`);
      console.error("Supported networks: ethereum, sepolia, polygon, mumbai, bsc, bscTestnet");
      process.exit(1);
  }

  console.log(`Using LayerZero endpoint: ${lzEndpointAddress}`);

  try {
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
      "function quoteLinkFee(string memory _solanaAddress) external view returns (tuple(uint256 nativeFee, uint256 lzTokenFee))",
      "function linkAddress(string memory _solanaAddress) external payable",
      "function peers(uint32 _eid) external view returns (bytes32)",
      "function getLinkedAddresses(address _evmAddress) external view returns (bytes[] memory)",
      "function SOLANA_CHAIN_ID() external view returns (uint32)"
    ];
    
    const signer = (await ethers.getSigners())[0];
    const identityLinker = new ethers.Contract(identityLinkerAddress, identityLinkerABI, signer);

    // Create a sample Solana address (replace with your actual Solana address)
    const solanaAddress = "8ZKTGzysYQUknufpqJSLtKwzJZmHsWkJGxpQqKUe6C2D";
    
    console.log(`Testing with EVM address: ${signer.address}`);
    console.log(`Testing with Solana address: ${solanaAddress}`);

    // Try to get the Solana chain ID from the contract
    console.log("\nChecking basic contract connection...");
    let solanaChainId;
    try {
      solanaChainId = await identityLinker.SOLANA_CHAIN_ID();
      console.log(`✅ Contract connection successful! Solana Chain ID: ${solanaChainId}`);
    } catch (error) {
      console.error("❌ Error accessing contract:", error);
      console.error("Make sure the contract is deployed and the ABI matches.");
      process.exit(1);
    }

    // Check if the peer is set
    console.log(`\nChecking if peer is set for Solana chain ID ${solanaChainId}...`);
    try {
      const peer = await identityLinker.peers(solanaChainId);
      if (peer === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        console.log("❌ Peer not set! Run the set-peer.js script first:");
        console.log("npx hardhat run scripts/set-peer.js --network " + networkName);
        process.exit(1);
      } else {
        console.log(`✅ Peer is set to: ${peer}`);
      }
    } catch (error) {
      console.error("❌ Error checking peer:", error.message);
      console.log("Please run the set-peer.js script first.");
      process.exit(1);
    }

    // Check any existing linked addresses
    try {
      const linkedAddresses = await identityLinker.getLinkedAddresses(signer.address);
      console.log(`\nCurrently linked addresses: ${linkedAddresses.length}`);
      if (linkedAddresses.length > 0) {
        console.log("Linked Solana addresses:");
        for (let i = 0; i < linkedAddresses.length; i++) {
          console.log(`  - ${ethers.toUtf8String(linkedAddresses[i])}`);
        }
      }
    } catch (error) {
      console.log("Error checking linked addresses:", error.message);
      // Continue anyway, not critical
    }
    
    // Get quote for linking fee
    console.log("\nGetting quote for linking fee...");
    let fee;
    try {
      fee = await identityLinker.quoteLinkFee(solanaAddress);
      console.log("✅ LayerZero fee quote successful!");
      console.log(`Native fee to send message: ${ethers.formatEther(fee.nativeFee)} ETH`);
      console.log(`LZ Token fee: ${ethers.formatEther(fee.lzTokenFee)} LZ Token`);
    } catch (error) {
      console.error("❌ Error getting fee quote:", error.message);
      console.log("This might be due to missing peer configuration.");
      
      // Ask if want to continue
      console.log("\nWould you like to try setting the peer and try again? (Press Ctrl+C to cancel)");
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log("Running set-peer.js script...");
      try {
        // This is just instructional - can't actually run another script from here
        console.log("Please run:\nnpx hardhat run scripts/set-peer.js --network " + networkName);
        process.exit(1);
      } catch (error) {
        console.error("Failed to run set-peer script:", error.message);
        process.exit(1);
      }
    }
    
    console.log("\nSending test transaction (linkAddress)...");
    console.log("This will link your EVM address to the test Solana address");
    
    // Send an actual transaction
    try {
      const tx = await identityLinker.linkAddress(solanaAddress, {
        value: fee.nativeFee * BigInt(11) / BigInt(10) // Add 10% buffer for gas price fluctuation
      });
      
      console.log("Transaction sent! Waiting for confirmation...");
      console.log(`Transaction hash: ${tx.hash}`);
      console.log("Check this transaction on LayerZeroScan after confirmation");
      
      const receipt = await tx.wait();
      console.log("\n✅ Transaction confirmed! Cross-chain message sent to Solana");
      console.log("LayerZero V2 cross-chain messaging is working correctly!");
    } catch (error) {
      console.error("❌ Error sending transaction:", error.message);
      if (error.message.includes("insufficient funds")) {
        console.log("\nYou need to fund your wallet with more ETH to pay for gas and the LayerZero fee.");
      } else if (error.message.includes("user rejected")) {
        console.log("\nTransaction was rejected. Please try again.");
      } else {
        console.log("\nThere might be an issue with the contract configuration or network.");
      }
      process.exit(1);
    }

    console.log("\nNext steps:");
    console.log("1. Check the transaction on LayerZeroScan:");
    console.log(`   https://testnet.layerzeroscan.com/tx/${tx.hash}`);
    console.log("2. Verify that the Solana PDA was updated with your EVM address");
    console.log("3. Run the check-identity-account.ts script on Solana side");
    
  } catch (error) {
    console.error("❌ Error verifying LayerZero connection:", error);
    console.log("\nPossible solutions:");
    console.log("1. Check that the endpoint address in .env is correct");
    console.log("2. Ensure you have network connectivity to the RPC");
    console.log("3. Verify the LayerZero endpoint supports the network you're connecting to");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
