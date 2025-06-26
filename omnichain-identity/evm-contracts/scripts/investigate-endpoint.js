const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    console.log("🔍 Investigating LayerZero V2 endpoint and Solana support...");
    
    const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const endpointAddress = process.env.LZ_ETHEREUM_ENDPOINT;
    console.log("Endpoint:", endpointAddress);
    
    // Check if endpoint exists and is accessible
    const code = await provider.getCode(endpointAddress);
    console.log("Endpoint has code:", code !== "0x");
    
    // Try different chain IDs that might be supported
    const testChainIds = [
        { name: "Solana Devnet", id: 30168 },
        { name: "Solana Mainnet", id: 30101 },
        { name: "Ethereum", id: 30101 },
        { name: "Polygon", id: 30109 },
        { name: "BSC", id: 30102 }
    ];
    
    const endpointABI = [
        "function defaultSendLibrary(uint32 eid) external view returns (address lib)",
        "function isSupportedEid(uint32 eid) external view returns (bool supported)"
    ];
    
    const endpoint = new ethers.Contract(endpointAddress, endpointABI, wallet);
    
    console.log("\n🔍 Testing different chain IDs...");
    
    for (const chain of testChainIds) {
        try {
            console.log(`\nTesting ${chain.name} (${chain.id}):`);
            
            // Check if endpoint ID is supported
            try {
                const isSupported = await endpoint.isSupportedEid(chain.id);
                console.log(`  Supported: ${isSupported}`);
            } catch (e) {
                console.log(`  Supported check failed: ${e.message.substring(0, 50)}...`);
            }
            
            // Try to get default send library
            try {
                const sendLib = await endpoint.defaultSendLibrary(chain.id);
                console.log(`  Default Send Library: ${sendLib}`);
                if (sendLib !== ethers.ZeroAddress) {
                    console.log(`  ✅ ${chain.name} has configured libraries!`);
                }
            } catch (e) {
                console.log(`  Default library check failed: ${e.message.substring(0, 50)}...`);
            }
            
        } catch (error) {
            console.log(`  ❌ ${chain.name}: ${error.message.substring(0, 50)}...`);
        }
    }
    
    console.log("\n📚 LayerZero V2 Chain IDs Reference:");
    console.log("- Ethereum: 30101");
    console.log("- BSC: 30102"); 
    console.log("- Avalanche: 30106");
    console.log("- Polygon: 30109");
    console.log("- Arbitrum: 30110");
    console.log("- Optimism: 30111");
    console.log("- Solana: 30168 (if supported)");
    
    console.log("\n🔍 Checking LayerZero documentation for Solana support...");
    console.log("The issue might be:");
    console.log("1. Solana devnet (30168) not supported on Sepolia testnet");
    console.log("2. Need to use different endpoint for Solana");
    console.log("3. Solana support might be limited to mainnet");
    
}

main().catch(console.error);
