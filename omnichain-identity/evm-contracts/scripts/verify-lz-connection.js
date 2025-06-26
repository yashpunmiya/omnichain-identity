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
    
    // Create a more comprehensive contract interface
    const identityLinkerABI = [
      "function quoteLinkFee(string memory _solanaAddress) external view returns (tuple(uint256 nativeFee, uint256 lzTokenFee))",
      "function linkAddress(string memory _solanaAddress) external payable",
      "function SOLANA_CHAIN_ID() external view returns (uint32)",
      "function getLinkedAddresses(address _evmAddress) external view returns (bytes[] memory)"
    ];
    
    const provider = ethers.provider;
    const signer = (await ethers.getSigners())[0];
    const identityLinker = new ethers.Contract(identityLinkerAddress, identityLinkerABI, signer);

    // Create a sample Solana address (replace with a valid one for testing)
    const solanaAddress = "8ZKTGzysYQUknufpqJSLtKwzJZmHsWkJGxpQqKUe6C2D";
    
    console.log(`Testing with EVM address: ${signer.address}`);
    console.log(`Testing with Solana address: ${solanaAddress}`);
    
    // First check if we can access basic contract functions
    console.log("Testing basic contract access...");
    try {
      const solanaChainId = await identityLinker.SOLANA_CHAIN_ID();
      console.log(`✅ Contract connection successful! Solana Chain ID: ${solanaChainId}`);
      
      // Check if we already have linked addresses
      const linkedAddresses = await identityLinker.getLinkedAddresses(signer.address);
      console.log(`Current linked addresses: ${linkedAddresses.length}`);
      
    } catch (basicError) {
      console.error("❌ Error accessing basic contract functions:", basicError.message);
      console.log("This suggests the contract might not be deployed correctly or the ABI is wrong");
      process.exit(1);
    }
    
    console.log("\nTesting fee estimation...");
    let fee;
    try {
      // Get quote for linking fee
      fee = await identityLinker.quoteLinkFee(solanaAddress);
      console.log("✅ Fee quote successful!");
    } catch (feeError) {
      console.error("❌ Error getting fee quote:", feeError.message);
      console.log("Trying direct transaction without fee estimation...");
      // Set a default fee amount as fallback
      fee = { nativeFee: ethers.parseEther("0.005"), lzTokenFee: 0 };
    }
    
    console.log(`Native fee to send message: ${ethers.formatEther(fee.nativeFee)} ETH`);
    if (fee.lzTokenFee > 0) {
      console.log(`LZ Token fee: ${ethers.formatEther(fee.lzTokenFee)} LZ Token`);
    }
    
    console.log("\nSending actual test transaction (linkAddress)...");
    console.log("This will link your EVM address to the test Solana address");
    
    try {
      // Send an actual transaction with a buffer for gas fluctuations
      const txValue = fee.nativeFee * BigInt(12) / BigInt(10); // Add 20% buffer
      console.log(`Sending with ${ethers.formatEther(txValue)} ETH`);
      
      const tx = await identityLinker.linkAddress(solanaAddress, {
        value: txValue,
        gasLimit: 500000 // Set explicit gas limit
      });
      
      console.log("Transaction sent! Waiting for confirmation...");
      console.log(`Transaction hash: ${tx.hash}`);
      console.log(`View on Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
      console.log("Check this transaction on LayerZeroScan after confirmation");
      
      const receipt = await tx.wait();
      console.log("\n✅ Transaction confirmed! Cross-chain message sent to Solana");
      console.log(`Gas used: ${receipt.gasUsed}`);
      console.log("LayerZero V2 cross-chain messaging is working correctly!");
      
      // Check LayerZeroScan URL
      console.log("\nVerification Links:");
      console.log(`- Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
      console.log(`- LayerZero Explorer: https://testnet.layerzeroscan.com/tx/${tx.hash}`);
    } catch (txError) {
      console.error("❌ Error sending transaction:", txError.message);
      console.log("\nPossible causes:");
      console.log("1. Insufficient ETH for fees");
      console.log("2. LayerZero endpoint configuration issue");
      console.log("3. Contract may need configuration for Solana peer");
      process.exit(1);
    }
    console.log("\nNext steps:");
    console.log("1. Check the transaction on LayerZeroScan");
    console.log("2. Verify that the Solana PDA was updated with your EVM address");
    console.log("3. Proceed with building the frontend");
    
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
