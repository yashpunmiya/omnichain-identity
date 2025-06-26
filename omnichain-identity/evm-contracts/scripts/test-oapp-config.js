const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("Testing OApp configuration...");
    
    const [signer] = await ethers.getSigners();
    console.log("Using signer:", signer.address);
    
    // Get our contract
    const OmnichainIdentityLinker = await ethers.getContractFactory("OmnichainIdentityLinker");
    const contract = OmnichainIdentityLinker.attach(process.env.IDENTITY_LINKER_ADDRESS);
    
    try {
        // Check if contract is properly configured
        const solanaChainId = await contract.SOLANA_CHAIN_ID();
        console.log("Solana Chain ID:", solanaChainId.toString());
        
        // Check if peer is set
        const peer = await contract.peers(solanaChainId);
        console.log("Peer for Solana:", peer);
        
        // Check endpoint
        const endpoint = await contract.endpoint();
        console.log("Endpoint:", endpoint);
        
        // Test basic functionality
        const linkCount = await contract.getLinkedAddressesCount(signer.address);
        console.log("Current linked addresses count:", linkCount.toString());
        
        console.log("✅ Basic contract checks passed");
        
    } catch (error) {
        console.error("❌ Contract test failed:", error.message);
    }
}

main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});
