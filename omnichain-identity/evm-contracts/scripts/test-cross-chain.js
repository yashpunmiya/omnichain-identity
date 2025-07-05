const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing LayerZero V2 Configuration...");
  
  const EVM_CONTRACT_ADDRESS = "0x429B3fc57dD1000eBd6eC9A77e7f3E0ABdD252fa";
  const SOLANA_ADDRESS = "YourSolanaAddressHere"; // Replace with actual Solana address
  
  const [signer] = await hre.ethers.getSigners();
  console.log(`Using signer: ${signer.address}`);
  
  const contractFactory = await hre.ethers.getContractFactory("OmnichainIdentityLinker");
  const contract = contractFactory.attach(EVM_CONTRACT_ADDRESS);
  
  try {
    console.log("\n📊 Step 1: Getting quote for cross-chain message...");
    
    // Get quote for linking
    const quote = await contract.quoteLinkAddress(SOLANA_ADDRESS);
    console.log(`💰 Fee required: ${hre.ethers.formatEther(quote)} ETH`);
    
    console.log("\n📨 Step 2: Sending test identity link...");
    
    // Send the actual transaction
    const linkTx = await contract.linkAddress(SOLANA_ADDRESS, {
      value: quote
    });
    
    console.log(`🚀 Transaction sent: ${linkTx.hash}`);
    console.log(`📡 Waiting for confirmation...`);
    
    const receipt = await linkTx.wait();
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
    
    // Parse events
    const events = receipt.logs.filter(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === 'IdentityLinked';
      } catch {
        return false;
      }
    });
    
    if (events.length > 0) {
      const parsed = contract.interface.parseLog(events[0]);
      console.log(`🔗 Identity Linked Event:`);
      console.log(`   EVM Address: ${parsed.args.evmAddress}`);
      console.log(`   Solana Address: ${hre.ethers.toUtf8String(parsed.args.solanaAddress)}`);
      console.log(`   Timestamp: ${parsed.args.timestamp}`);
    }
    
    console.log("\n🔍 Step 3: Check LayerZero scan...");
    console.log(`Visit: https://layerzeroscan.com/tx/${linkTx.hash}`);
    console.log("Look for status change from BLOCKED to DELIVERED");
    
    console.log("\n📈 Step 4: Verify linked addresses...");
    const linkedAddresses = await contract.getLinkedAddresses(signer.address);
    console.log(`Linked addresses count: ${linkedAddresses.length}`);
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    
    if (error.message.includes('insufficient funds')) {
      console.log("\n💸 Solution: Add more ETH to your wallet");
    } else if (error.message.includes('execution reverted')) {
      console.log("\n⚠️  Solution: Check LayerZero configuration is complete");
      console.log("Run: npm run lz:wire");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
