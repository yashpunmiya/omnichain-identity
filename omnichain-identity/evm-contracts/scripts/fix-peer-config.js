const { ethers } = require("ethers");
require("dotenv").config();

/**
 * SET PEER CONFIGURATION - CRITICAL FIX
 * This script sets the correct Solana program as peer in the EVM contract
 */

async function main() {
    console.log("🔧 Setting Correct Peer Configuration");
    console.log("====================================");
    
    // Configuration
    const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const contractAddress = process.env.IDENTITY_LINKER_ADDRESS; // Use from .env
    const solanaProgram = process.env.SOLANA_PROGRAM_ADDRESS; // Use from .env
    const solanaEid = parseInt(process.env.SOLANA_EID); // Use from .env
    
    console.log("📋 Configuration:");
    console.log("  EVM Contract:", contractAddress);
    console.log("  Solana Program:", solanaProgram);
    console.log("  Solana EID:", solanaEid);
    
    // Create wallet
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log("🔑 Using wallet:", wallet.address);
    
    // Contract ABI for setPeer
    const contractABI = [
        "function setPeer(uint32 _eid, bytes32 _peer) external",
        "function peers(uint32) external view returns (bytes32)",
        "function owner() external view returns (address)"
    ];
    
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);
    
    try {
        // Check current owner
        const owner = await contract.owner();
        console.log("📋 Contract owner:", owner);
        
        if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
            console.log("❌ Wallet is not the contract owner!");
            console.log("💡 Current owner:", owner);
            console.log("💡 Your wallet:", wallet.address);
            return;
        }
        
        // Convert Solana program address to bytes32
        // Solana addresses are base58, need to decode to bytes32
        const bs58 = require('bs58');
        const solanaBytes = bs58.default ? bs58.default.decode(solanaProgram) : bs58.decode(solanaProgram);
        
        // Pad to 32 bytes (Solana addresses are 32 bytes)
        const solanaBytes32 = ethers.utils.hexZeroPad(ethers.utils.hexlify(solanaBytes), 32);
        
        console.log("🔄 Converting Solana address:");
        console.log("  Base58:", solanaProgram);
        console.log("  Bytes32:", solanaBytes32);
        
        // Check current peer
        try {
            const currentPeer = await contract.peers(solanaEid);
            console.log("📋 Current peer for EID", solanaEid + ":", currentPeer);
            
            if (currentPeer === solanaBytes32) {
                console.log("✅ Peer already correctly configured!");
                return;
            }
        } catch (error) {
            console.log("⚠️  Could not read current peer configuration");
        }
        
        // Set the peer
        console.log("🔧 Setting peer configuration...");
        
        const tx = await contract.setPeer(solanaEid, solanaBytes32, {
            gasLimit: 200000
        });
        
        console.log("📨 Transaction sent:", tx.hash);
        console.log("⏳ Waiting for confirmation...");
        
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            console.log("✅ Peer configuration successful!");
            console.log("📋 Transaction details:");
            console.log("  Hash:", receipt.transactionHash);
            console.log("  Block:", receipt.blockNumber);
            console.log("  Gas used:", receipt.gasUsed.toString());
            
            // Verify the setting
            const newPeer = await contract.peers(solanaEid);
            console.log("🔍 Verification - New peer:", newPeer);
            
            if (newPeer === solanaBytes32) {
                console.log("🎉 SUCCESS! Peer correctly configured!");
                console.log("");
                console.log("🎯 Next Steps:");
                console.log("1. Send a new cross-chain message");
                console.log("2. Monitor LayerZero scan for DELIVERED status");
                console.log("3. The message should now work correctly");
            } else {
                console.log("❌ Verification failed - peer not set correctly");
            }
            
        } else {
            console.log("❌ Transaction failed!");
        }
        
    } catch (error) {
        console.error("❌ Error setting peer:", error.message);
        
        if (error.message.includes("revert")) {
            console.log("💡 Common issues:");
            console.log("  - Wallet is not the contract owner");
            console.log("  - Contract address is incorrect");
            console.log("  - EID is not supported");
        }
    }
}

main().catch(console.error);
