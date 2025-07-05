const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    console.log("🔍 Diagnosing Contract Issues...");
    
    const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contractAddress = process.env.IDENTITY_LINKER_ADDRESS;
    
    console.log("Contract Address:", contractAddress);
    console.log("Wallet Address:", wallet.address);
    
    // Basic contract ABI to test function existence
    const contractABI = [
        "function owner() external view returns (address)",
        "function SOLANA_CHAIN_ID() external view returns (uint32)",
        "function peers(uint32) external view returns (bytes32)",
        "function endpoint() external view returns (address)",
        "function quoteLinkFee(string memory _solanaAddress) external view returns (tuple(uint256 nativeFee, uint256 zroFee))",
        "function quoteLinkAddress(string memory _solanaAddress) external view returns (uint256)"
    ];
    
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);
    
    try {
        console.log("\n📋 Basic Contract Info:");
        const owner = await contract.owner();
        console.log("✅ Owner:", owner);
        
        const chainId = await contract.SOLANA_CHAIN_ID();
        console.log("✅ Solana Chain ID:", chainId.toString());
        
        const peer = await contract.peers(40168);
        console.log("✅ Peer for EID 40168:", peer);
        
        const endpoint = await contract.endpoint();
        console.log("✅ Endpoint:", endpoint);
        
        console.log("\n📋 Testing Quote Functions:");
        const testAddress = "2rGoi61G14p7JoR4Ag1oLgqSEjqJd8Ljr8RsUnHviRq2rqko3nJJpmHP4nfeJqbhsy4RPo9RqMFxGMQ9iKURKprg";
        
        try {
            console.log("Testing quoteLinkFee...");
            const fee = await contract.quoteLinkFee(testAddress);
            console.log("✅ Quote Fee (native, zro):", fee.nativeFee.toString(), fee.zroFee.toString());
        } catch (error) {
            console.log("❌ quoteLinkFee failed:", error.message);
        }
        
        try {
            console.log("Testing quoteLinkAddress...");
            const simpleFee = await contract.quoteLinkAddress(testAddress);
            console.log("✅ Quote Address:", simpleFee.toString());
        } catch (error) {
            console.log("❌ quoteLinkAddress failed:", error.message);
            
            // Try to get more detailed error
            try {
                const result = await contract.callStatic.quoteLinkAddress(testAddress);
                console.log("Result:", result);
            } catch (detailError) {
                console.log("Detailed error:", detailError);
            }
        }
        
    } catch (error) {
        console.log("❌ Contract interaction failed:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
