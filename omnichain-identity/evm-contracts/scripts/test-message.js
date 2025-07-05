const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing Cross-Chain Message with Current Config...");
  
  const EVM_CONTRACT_ADDRESS = "0x429B3fc57dD1000eBd6eC9A77e7f3E0ABdD252fa";
  const TEST_SOLANA_ADDRESS = "2rGoi61G14p7JoR4Ag1oLgqSEjqJd8Ljr8RsUnHviRq2rqko3nJJpmHP4nfeJqbhsy4RPo9RqMFxGMQ9iKURKprg"; // Example Solana address
  
  const [signer] = await hre.ethers.getSigners();
  console.log(`Using signer: ${signer.address}`);
  
  // Check signer balance
  const balance = await signer.getBalance();
  console.log(`Balance: ${hre.ethers.utils.formatEther(balance)} ETH`);
  
  if (balance.lt(hre.ethers.utils.parseEther("0.01"))) {
    console.log("❌ Insufficient balance for testing. Need at least 0.01 ETH");
    return;
  }
  
  const contractFactory = await hre.ethers.getContractFactory("OmnichainIdentityLinker");
  const contract = contractFactory.attach(EVM_CONTRACT_ADDRESS);
  
  try {
    console.log("\n📊 Step 1: Getting quote for cross-chain message...");
    
    // Get quote for linking
    const quote = await contract.quoteLinkAddress(TEST_SOLANA_ADDRESS);
    console.log(`💰 Fee required: ${hre.ethers.utils.formatEther(quote)} ETH`);
    
    // Add some buffer to the fee
    const feeWithBuffer = quote.mul(150).div(100); // 50% buffer
    console.log(`💰 Fee with buffer: ${hre.ethers.utils.formatEther(feeWithBuffer)} ETH`);
    
    if (balance.lt(feeWithBuffer)) {
      console.log("❌ Insufficient balance for the quoted fee");
      return;
    }
    
    console.log("\n📨 Step 2: Sending test identity link...");
    console.log(`Linking ${signer.address} → ${TEST_SOLANA_ADDRESS}`);
    
    // Send the actual transaction
    const linkTx = await contract.linkAddress(TEST_SOLANA_ADDRESS, {
      value: feeWithBuffer,
      gasLimit: 500000 // Set a reasonable gas limit
    });
    
    console.log(`🚀 Transaction sent: ${linkTx.hash}`);
    console.log(`📡 Waiting for confirmation...`);
    
    const receipt = await linkTx.wait();
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
    console.log(`💰 Gas used: ${receipt.gasUsed.toString()}`);
    
    // Parse events
    if (receipt.logs && receipt.logs.length > 0) {
      console.log(`📋 Events emitted: ${receipt.logs.length}`);
      
      // Try to parse our contract events
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed.name === 'IdentityLinked') {
            console.log(`🔗 Identity Linked Event:`);
            console.log(`   EVM Address: ${parsed.args.evmAddress}`);
            console.log(`   Solana Address: ${hre.ethers.utils.toUtf8String(parsed.args.solanaAddress)}`);
            console.log(`   Timestamp: ${parsed.args.timestamp}`);
          }
        } catch (error) {
          // Log from different contract, skip
        }
      }
    }
    
    console.log("\n🔍 Step 3: Check LayerZero scan...");
    console.log(`Visit: https://layerzeroscan.com/tx/${linkTx.hash}`);
    console.log("🎯 Expected Status Change: BLOCKED → DELIVERED");
    console.log("⏰ This may take a few minutes to process...");
    
    console.log("\n📈 Step 4: Verify linked addresses...");
    const linkedAddresses = await contract.getLinkedAddresses(signer.address);
    console.log(`📊 Linked addresses count: ${linkedAddresses.length}`);
    
    if (linkedAddresses.length > 0) {
      console.log("📋 Linked addresses:");
      for (let i = 0; i < linkedAddresses.length; i++) {
        const addr = hre.ethers.utils.toUtf8String(linkedAddresses[i]);
        console.log(`   ${i + 1}. ${addr}`);
      }
    }
    
    console.log("\n🎉 Test completed successfully!");
    console.log("✅ Message sent to LayerZero network");
    console.log("📊 Monitor the LayerZero scan link above for delivery status");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    
    if (error.message.includes('insufficient funds')) {
      console.log("\n💸 Solution: Add more ETH to your wallet");
    } else if (error.message.includes('execution reverted')) {
      console.log("\n⚠️  Solution: Check LayerZero configuration");
      console.log("The configuration might still be incomplete");
    } else if (error.message.includes('nonce')) {
      console.log("\n🔄 Solution: Wait a moment and try again (nonce issue)");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
