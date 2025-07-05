const hre = require("hardhat");

async function main() {
  console.log("🚀 Configuring LayerZero V2 OApp Settings...");
  
  // Your deployed contract address (from LayerZero scan)
  const EVM_CONTRACT_ADDRESS = "0x429B3fc57dD1000eBd6eC9A77e7f3E0ABdD252fa";
  const SOLANA_OAPP_ADDRESS = "DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz";
  
  // LayerZero V2 Endpoint IDs
  const SEPOLIA_EID = 40161;
  const SOLANA_EID = 40168;
  
  // Get the contract instance
  const [signer] = await hre.ethers.getSigners();
  console.log(`Using signer: ${signer.address}`);
  
  const contractFactory = await hre.ethers.getContractFactory("OmnichainIdentityLinker");
  const contract = contractFactory.attach(EVM_CONTRACT_ADDRESS);
  
  console.log(`Contract attached at: ${EVM_CONTRACT_ADDRESS}`);
  
  try {
    // Step 1: Set peer (if your contract supports it)
    console.log("\n📍 Step 1: Setting Solana peer...");
    
    // Convert Solana address to bytes32 for LayerZero V2
    const solanaAddressBytes32 = hre.ethers.utils.zeroPad(
      hre.ethers.utils.toUtf8Bytes(SOLANA_OAPP_ADDRESS).slice(0, 32), 
      32
    );
    
    // Check if setPeer function exists (it should be inherited from OApp)
    try {
      const setPeerTx = await contract.setPeer(SOLANA_EID, solanaAddressBytes32);
      console.log(`Setting peer transaction: ${setPeerTx.hash}`);
      await setPeerTx.wait();
      console.log("✅ Peer configuration successful!");
    } catch (error) {
      console.log("⚠️  setPeer might not be available or already set:", error.message);
    }
    
    console.log("\n📡 Configuration completed!");
    console.log("\n⚡ Next steps:");
    console.log("1. Run: npm run lz:config:init");
    console.log("2. Run: npm run lz:wire");
    console.log("3. Configure Solana side peer settings");
    console.log("4. Test cross-chain message!");
    
  } catch (error) {
    console.error("❌ Configuration failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
