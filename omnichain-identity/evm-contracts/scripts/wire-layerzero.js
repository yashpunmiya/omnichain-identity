const hre = require("hardhat");

async function main() {
  console.log("🔧 Applying LayerZero V2 Configuration...");
  
  const network = hre.network.name;
  console.log(`Network: ${network}`);
  
  try {
    // Initialize LayerZero configuration
    console.log("\n📋 Step 1: Initializing OApp configuration...");
    await hre.run("lz:oapp:config:init", {
      oappConfig: "layerzero.config.ts"
    });
    
    // Wire the OApp configuration
    console.log("\n🔌 Step 2: Wiring OApp configuration...");
    await hre.run("lz:oapp:wire", {
      oappConfig: "layerzero.config.ts"
    });
    
    console.log("\n✅ LayerZero configuration applied successfully!");
    console.log("\n📊 You can verify the configuration with:");
    console.log("npx hardhat lz:oapp:config:get --oapp-config layerzero.config.ts");
    
  } catch (error) {
    console.error("❌ Configuration failed:", error);
    console.log("\n🔍 Troubleshooting tips:");
    console.log("1. Make sure your contracts are deployed");
    console.log("2. Check your network configuration in hardhat.config.js");
    console.log("3. Verify your LayerZero config file is correct");
    console.log("4. Ensure you have sufficient gas/ETH for transactions");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
