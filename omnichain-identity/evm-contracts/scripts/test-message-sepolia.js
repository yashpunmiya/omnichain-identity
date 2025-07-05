const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  console.log("🧪 Testing Cross-Chain Message on Sepolia...");
  
  // Configuration
  const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const EVM_CONTRACT_ADDRESS = "0x429B3fc57dD1000eBd6eC9A77e7f3E0ABdD252fa";
  const TEST_SOLANA_ADDRESS = "2rGoi61G14p7JoR4Ag1oLgqSEjqJd8Ljr8RsUnHviRq2rqko3nJJpmHP4nfeJqbhsy4RPo9RqMFxGMQ9iKURKprg";
  
  // Create wallet
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log(`Using wallet: ${wallet.address}`);
  
  // Check balance
  const balance = await wallet.getBalance();
  console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH`);
  
  if (balance.lt(ethers.utils.parseEther("0.01"))) {
    console.log("❌ Insufficient balance for testing. Need at least 0.01 ETH");
    return;
  }

  // Contract ABI - just the functions we need
  const contractABI = [
    "function quoteLinkAddress(string memory _solanaAddress) external view returns (uint256)",
    "function linkAddress(string memory _solanaAddress) external payable"
  ];
  
  const contract = new ethers.Contract(EVM_CONTRACT_ADDRESS, contractABI, wallet);
  
  try {
    console.log("\n� Step 1: Getting quote for cross-chain message...");
    const quote = await contract.quoteLinkAddress(TEST_SOLANA_ADDRESS);
    console.log(`Quote: ${ethers.utils.formatEther(quote)} ETH`);
    
    console.log("\n📤 Step 2: Sending cross-chain message...");
    console.log(`Target Solana address: ${TEST_SOLANA_ADDRESS}`);
    
    const tx = await contract.linkAddress(TEST_SOLANA_ADDRESS, {
      value: quote,
      gasLimit: 300000
    });
    
    console.log(`📨 Transaction sent: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log(`📋 Transaction details:`);
    console.log(`  Hash: ${receipt.transactionHash}`);
    console.log(`  Block: ${receipt.blockNumber}`);
    console.log(`  Gas used: ${receipt.gasUsed.toString()}`);
    
    console.log("\n🎯 Next Steps:");
    console.log("1. Check LayerZero scan: https://testnet.layerzeroscan.com/");
    console.log(`2. Search for transaction: ${receipt.transactionHash}`);
    console.log("3. Verify message status changes from BLOCKED to DELIVERED");
    console.log("4. Check that destination OApp is found");
    
  } catch (error) {
    console.log("❌ Test failed:", error.message);
    if (error.reason) {
      console.log("Reason:", error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
