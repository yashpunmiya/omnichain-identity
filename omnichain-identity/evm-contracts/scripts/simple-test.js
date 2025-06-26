const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    console.log("Simple LayerZero connection test...");
    
    // Set up provider
    const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log("Wallet address:", wallet.address);
    console.log("Contract address:", process.env.IDENTITY_LINKER_ADDRESS);
    
    // Simple contract ABI for testing
    const contractABI = [
        "function SOLANA_CHAIN_ID() view returns (uint32)",
        "function peers(uint32) view returns (bytes32)",
        "function endpoint() view returns (address)",
        "function quoteLinkFee(string memory _solanaAddress) view returns (tuple(uint256 nativeFee, uint256 lzTokenFee))"
    ];
    
    const contract = new ethers.Contract(process.env.IDENTITY_LINKER_ADDRESS, contractABI, wallet);
    
    try {
        const chainId = await contract.SOLANA_CHAIN_ID();
        console.log("✅ Solana Chain ID:", chainId.toString());
        
        const peer = await contract.peers(chainId);
        console.log("✅ Peer:", peer);
        
        const endpoint = await contract.endpoint();
        console.log("✅ Endpoint:", endpoint);
        
        // Try fee quote - this is where it fails
        console.log("Trying fee quote...");
        try {
            const fee = await contract.quoteLinkFee("8ZKTGzysYQUknufpqJSLtKwzJZmHsWkJGxpQqKUe6C2D");
            console.log("✅ Fee quote successful:", ethers.formatEther(fee.nativeFee), "ETH");
        } catch (feeError) {
            console.error("❌ Fee quote failed:", feeError.message);
            
            // Try to get more details about the error
            if (feeError.data) {
                console.log("Error data:", feeError.data);
            }
            
            // Check if it's a LayerZero specific error
            console.log("\nThis might be a LayerZero V2 configuration issue.");
            console.log("Common issues:");
            console.log("1. OApp not properly configured with LayerZero endpoint");
            console.log("2. Missing executor/verifier configuration");
            console.log("3. Insufficient gas for cross-chain message");
            console.log("4. Solana endpoint not reachable");
        }
        
    } catch (error) {
        console.error("❌ Contract connection failed:", error.message);
    }
}

main().catch(console.error);
