const { ethers } = require("ethers");
require("dotenv").config();

/**
 * SIMPLE PEER SETUP
 * Set up peer configuration without hardhat dependencies
 */

async function main() {
    console.log("🔗 Setting up Solana peer for new contract");
    
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const contractAddress = process.env.IDENTITY_LINKER_ADDRESS;
    const solanaChainId = 40168;
    const solanaProgramId = "DDyBRUnarV5xAdTn3XmjbhEGuiinCBRL"; // Solana program ID
    
    console.log("📋 Configuration:");
    console.log("New Contract:", contractAddress);
    console.log("Solana Chain ID:", solanaChainId);
    console.log("Solana Program ID:", solanaProgramId);
    console.log("Wallet:", wallet.address);
    
    // Contract ABI for setPeer
    const contractABI = [
        "function setPeer(uint32 _eid, bytes32 _peer) external",
        "function peers(uint32) external view returns (bytes32)",
        "function owner() external view returns (address)"
    ];
    
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);
    
    try {
        console.log("\n📋 Step 1: Verify contract ownership...");
        const owner = await contract.owner();
        console.log("✅ Contract Owner:", owner);
        console.log("✅ Is Owner:", owner.toLowerCase() === wallet.address.toLowerCase());
        
        console.log("\n📋 Step 2: Convert Solana program ID to bytes32...");
        // For Solana addresses longer than 32 chars, we need to use zeroPadValue
        const peerBytes32 = ethers.zeroPadValue(ethers.toUtf8Bytes(solanaProgramId), 32);
        console.log("✅ Peer (bytes32):", peerBytes32);
        
        console.log("\n📋 Step 3: Set peer...");
        const tx = await contract.setPeer(solanaChainId, peerBytes32, {
            gasLimit: 100000
        });
        
        console.log("📡 Transaction submitted:", tx.hash);
        console.log("⏳ Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed! Block:", receipt.blockNumber);
        
        console.log("\n📋 Step 4: Verify peer is set...");
        const peer = await contract.peers(solanaChainId);
        console.log("✅ Current Peer:", peer);
        
        // Decode to verify
        const decodedPeer = ethers.toUtf8String(peer).replace(/\0/g, ''); // Remove null bytes
        console.log("✅ Decoded Peer:", decodedPeer);
        
        console.log("\n🎉 Peer setup completed successfully!");
        
    } catch (error) {
        console.error("❌ Peer setup failed:", error.message);
        
        if (error.reason) {
            console.log("Error Reason:", error.reason);
        }
        
        if (error.data) {
            console.log("Error Data:", error.data);
        }
    }
}

main().catch(console.error);
