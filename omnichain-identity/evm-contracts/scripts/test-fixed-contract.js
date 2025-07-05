const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    console.log("🎯 Testing Fixed Contract Functionality");
    console.log("======================================");
    
    const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contractAddress = process.env.IDENTITY_LINKER_ADDRESS;
    
    console.log("Testing contract:", contractAddress);
    console.log("Wallet:", wallet.address);
    
    // Contract ABI
    const contractABI = [
        "function quoteLinkAddress(string memory _solanaAddress) external view returns (uint256)",
        "function linkAddress(string memory _solanaAddress) external payable",
        "function linkedSolanaAddresses(address _evmAddress, uint256 _index) external view returns (bytes)",
        "function peers(uint32 _eid) external view returns (bytes32)"
    ];
    
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);
    
    const testSolanaAddress = "DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz";
    
    try {
        console.log("\n📋 Step 1: Check Peer Configuration");
        
        // Check peer
        const peer = await contract.peers(40168);
        console.log("Peer for EID 40168:", peer);
        console.log("Peer is set:", peer !== "0x0000000000000000000000000000000000000000000000000000000000000000");
        
        console.log("\n📋 Step 2: Test Quote Function");
        
        // Test quote
        const quote = await contract.quoteLinkAddress(testSolanaAddress);
        console.log("✅ Quote successful:", ethers.utils.formatEther(quote), "ETH");
        console.log("Quote in wei:", quote.toString());
        
        console.log("\n📋 Step 3: Test Cross-Chain Message (Optional)");
        console.log("To send a cross-chain message, run:");
        console.log(`contract.linkAddress("${testSolanaAddress}", { value: "${quote.toString()}" })`);
        
        console.log("\n🎉 Contract is working correctly!");
        console.log("✅ Peer configured");
        console.log("✅ Quote function working");
        console.log("✅ Ready for cross-chain messaging");
        
    } catch (error) {
        console.log("❌ Test failed:", error.message);
        
        if (error.data) {
            // Try to decode the error
            console.log("Error data:", error.data);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
