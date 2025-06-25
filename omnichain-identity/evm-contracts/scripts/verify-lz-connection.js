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
      lzEndpointAddress = process.env.LZ_ETHEREUM_ENDPOINT;
      break;
    case "polygon":
      lzEndpointAddress = process.env.LZ_POLYGON_ENDPOINT;
      break;
    case "bsc":
      lzEndpointAddress = process.env.LZ_BSC_ENDPOINT;
      break;
    default:
      console.error(`No LayerZero endpoint defined for network: ${networkName}`);
      process.exit(1);
  }

  console.log(`Using LayerZero endpoint: ${lzEndpointAddress}`);

  try {
    // Create a simple contract instance for the endpoint
    const endpointABI = [
      "function estimateFees(uint16 _dstChainId, address _userApplication, bytes calldata _payload, bool _payInZRO, bytes calldata _adapterParam) external view returns (uint256 nativeFee, uint256 zroFee)"
    ];

    const provider = ethers.provider;
    const endpoint = new ethers.Contract(lzEndpointAddress, endpointABI, provider);

    // Get a sample wallet address
    const [signer] = await ethers.getSigners();
    const evmAddress = signer.address;
    
    // Create a sample Solana address (replace with a valid one for testing)
    const solanaAddress = "8ZKTGzysYQUknufpqJSLtKwzJZmHsWkJGxpQqKUe6C2D";
    
    // Create a timestamp
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Create identity message payload in the CSV format: "evmAddress,solanaAddress,timestamp"
    const identityMessage = `${evmAddress},${solanaAddress},${timestamp}`;
    console.log("Testing identity message format:");
    console.log(identityMessage);
    
    // Convert to bytes
    const payload = ethers.toUtf8Bytes(identityMessage);
    
    // Solana chain ID
    const SOLANA_CHAIN_ID = 168; // Use the correct one for your environment
    
    // Estimate fees for sending a message to Solana
    const [nativeFee, zroFee] = await endpoint.estimateFees(
      SOLANA_CHAIN_ID,                      // Destination chain ID (Solana)
      "0x0000000000000000000000000000000000000000", // Placeholder address
      payload,                              // Message payload
      false,                                // Pay in ZRO
      "0x"                                  // Empty adapter params
    );

    console.log("✅ LayerZero connection verified!");
    console.log(`Native fee to send message: ${ethers.formatEther(nativeFee)} ETH`);
    console.log(`ZRO fee: ${ethers.formatEther(zroFee)} ZRO`);
    
    console.log("\nRecommendation: Send slightly more than the native fee when calling linkAddress()");
    
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
