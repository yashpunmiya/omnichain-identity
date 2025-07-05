const { ethers } = require("ethers");
require("dotenv").config();

/**
 * CHECK PEER CONFIGURATION
 * This script verifies if the peer is properly set up
 */

async function main() {
    console.log("🔍 Checking Peer Configuration");
    
    const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    
    const contractAddress = process.env.IDENTITY_LINKER_ADDRESS;
    const solanaChainId = 40168;
    
    console.log("📋 Configuration Details:");
    console.log("Contract:", contractAddress);
    console.log("Solana Chain ID:", solanaChainId);
    
    // Enhanced contract ABI
    const contractABI = [
        "function peers(uint32) external view returns (bytes32)",
        "function isPeer(uint32 _eid, bytes32 _peer) external view returns (bool)",
        "function owner() external view returns (address)",
        "function SOLANA_CHAIN_ID() external view returns (uint32)"
    ];
    
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    
    try {
        console.log("\n📋 Step 1: Basic Contract Info...");
        
        const owner = await contract.owner();
        console.log("✅ Contract Owner:", owner);
        
        const contractSolanaId = await contract.SOLANA_CHAIN_ID();
        console.log("✅ Contract Solana Chain ID:", contractSolanaId.toString());
        
        console.log("\n📋 Step 2: Peer Configuration Check...");
        
        try {
            const peer = await contract.peers(solanaChainId);
            console.log("✅ Configured Peer:", peer);
            
            if (peer === "0x0000000000000000000000000000000000000000000000000000000000000000") {
                console.log("❌ NO PEER CONFIGURED! This is likely the issue.");
                console.log("💡 You need to set up the peer on the EVM side.");
                
                // Check if we have the Solana program address
                const expectedSolanaProgramId = "44c11KMgD9u2wH7eAgQDNBnGefyJy8k6r3vtHtMC4e2N"; // Example
                const peerBytes32 = ethers.zeroPadValue(ethers.getBytes(ethers.id(expectedSolanaProgramId)), 32);
                console.log("Expected Peer (bytes32):", peerBytes32);
                
            } else {
                console.log("✅ Peer is configured");
                
                // Test if peer is recognized
                const isPeerValid = await contract.isPeer(solanaChainId, peer);
                console.log("✅ Is Valid Peer:", isPeerValid);
            }
            
        } catch (peerError) {
            console.log("❌ Peer Check Error:", peerError.message);
        }
        
        console.log("\n📋 Step 3: LayerZero Endpoint Check...");
        
        const endpointAddress = process.env.LZ_ETHEREUM_ENDPOINT;
        const endpointABI = [
            "function isSupportedEid(uint32 _dstEid) external view returns (bool)"
        ];
        
        const endpoint = new ethers.Contract(endpointAddress, endpointABI, provider);
        
        try {
            const isSupported = await endpoint.isSupportedEid(solanaChainId);
            console.log("✅ Solana EID Supported by Endpoint:", isSupported);
        } catch (endpointError) {
            console.log("❌ Endpoint Check Error:", endpointError.message);
        }
        
    } catch (error) {
        console.error("❌ Check failed:", error.message);
        console.log("\n💡 This suggests the contract might not be properly deployed or there's an ABI mismatch");
    }
}

main().catch(console.error);
