const { ethers } = require("ethers");
require("dotenv").config();

/**
 * CORRECT LAYERZERO V2 MESSAGE TEST
 * Test the actual linkAddress function with proper parameters
 */

async function main() {
    console.log("🧪 Corrected LayerZero V2 Message Test");
    
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const contractAddress = process.env.IDENTITY_LINKER_ADDRESS;
    const solanaChainId = 40168;
    
    console.log("📋 Test Details:");
    console.log("Contract:", contractAddress);
    console.log("Solana Chain ID:", solanaChainId);
    console.log("Wallet:", wallet.address);
    
    // Correct contract ABI based on the actual contract
    const contractABI = [
        "function linkAddress(string memory _solanaAddress) external payable",
        "function quoteLinkAddress(string memory _solanaAddress) external view returns (uint256)",
        "function owner() external view returns (address)",
        "function SOLANA_CHAIN_ID() external view returns (uint32)",
        "function peers(uint32) external view returns (bytes32)",
        "function getLinkedAddresses(address _evmAddress) external view returns (bytes[] memory)"
    ];
    
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);
    
    try {
        console.log("\n📋 Step 1: Basic Contract Check...");
        
        const owner = await contract.owner();
        console.log("✅ Contract Owner:", owner);
        console.log("✅ Is Owner:", owner.toLowerCase() === wallet.address.toLowerCase());
        
        const chainId = await contract.SOLANA_CHAIN_ID();
        console.log("✅ Contract Solana Chain ID:", chainId.toString());
        
        const peer = await contract.peers(solanaChainId);
        console.log("✅ Peer:", peer);
        
        console.log("\n📋 Step 2: Fee Quote Test...");
        
        const testSolanaAddress = "44c11KMgD9u2wH7eAgQDNBnGefyJy8k6r3vtHtMC4e2N";
        console.log("Test Solana Address:", testSolanaAddress);
        
        try {
            // Try calling the quote function to get the fee
            const fee = await contract.quoteLinkAddress(testSolanaAddress);
            console.log("✅ Fee Quote Successful:", ethers.formatEther(fee), "ETH");
            
            console.log("\n📋 Step 3: Test Message Send...");
            
            // Get current balance
            const balance = await provider.getBalance(wallet.address);
            console.log("Current Balance:", ethers.formatEther(balance), "ETH");
            
            if (balance > fee + ethers.parseEther("0.001")) {
                console.log("💸 Attempting to send cross-chain message...");
                
                const tx = await contract.linkAddress(
                    testSolanaAddress,
                    { 
                        value: fee + ethers.parseEther("0.0001"), // Add a bit extra for gas
                        gasLimit: 500000 
                    }
                );
                
                console.log("📡 Transaction submitted:", tx.hash);
                console.log("⏳ Waiting for confirmation...");
                
                const receipt = await tx.wait();
                console.log("✅ Transaction confirmed! Block:", receipt.blockNumber);
                console.log("⛽ Gas used:", receipt.gasUsed.toString());
                
                // Look for LayerZero events
                if (receipt.logs && receipt.logs.length > 0) {
                    console.log("\n📋 Transaction Events:");
                    receipt.logs.forEach((log, index) => {
                        console.log(`Event ${index + 1}:`, log.topics[0]);
                        if (log.data && log.data !== "0x") {
                            console.log(`  Data:`, log.data);
                        }
                    });
                }
                
                console.log("\n📋 Step 4: Verify Link was Stored...");
                
                try {
                    const linkedAddresses = await contract.getLinkedAddresses(wallet.address);
                    console.log("✅ Linked Addresses Count:", linkedAddresses.length);
                    
                    linkedAddresses.forEach((addr, index) => {
                        const addressString = ethers.toUtf8String(addr);
                        console.log(`   ${index + 1}: ${addressString}`);
                    });
                } catch (linkError) {
                    console.log("❌ Failed to get linked addresses:", linkError.message);
                }
                
                console.log("\n🎉 Cross-chain message sent successfully!");
                console.log("🔍 Check LayerZeroScan for message delivery:");
                console.log(`   https://layerzeroscan.com/tx/${tx.hash}`);
                
            } else {
                console.log("❌ Insufficient balance for transaction");
                console.log("   Required:", ethers.formatEther(fee + ethers.parseEther("0.001")), "ETH");
                console.log("   Available:", ethers.formatEther(balance), "ETH");
            }
            
        } catch (quoteError) {
            console.log("❌ Fee Quote Failed:", quoteError.message);
            
            // If the quote function doesn't exist, let's try to manually estimate
            console.log("\n🔍 Manual Fee Estimation...");
            
            try {
                // Try to estimate gas for the linkAddress function
                const gasEstimate = await contract.linkAddress.estimateGas(testSolanaAddress, {
                    value: ethers.parseEther("0.01") // Estimate with 0.01 ETH
                });
                console.log("✅ Gas Estimate:", gasEstimate.toString());
                
                // Try to send with estimated gas and some ETH for LayerZero fees
                const tx = await contract.linkAddress(
                    testSolanaAddress,
                    { 
                        value: ethers.parseEther("0.01"), // 0.01 ETH should be enough for LayerZero fees
                        gasLimit: gasEstimate + 100000n // Add buffer to gas estimate
                    }
                );
                
                console.log("📡 Transaction submitted:", tx.hash);
                const receipt = await tx.wait();
                console.log("✅ Transaction confirmed! Block:", receipt.blockNumber);
                
            } catch (sendError) {
                console.log("❌ Send Failed:", sendError.message);
                
                if (sendError.reason) {
                    console.log("Error Reason:", sendError.reason);
                }
                
                if (sendError.data) {
                    console.log("Error Data:", sendError.data);
                    
                    // Try to decode the error
                    try {
                        const errorDecoded = contract.interface.parseError(sendError.data);
                        console.log("Decoded Error:", errorDecoded);
                    } catch (decodeError) {
                        console.log("Could not decode error data");
                    }
                }
            }
        }
        
    } catch (error) {
        console.error("❌ Test failed:", error.message);
        
        if (error.data) {
            console.log("Raw Error Data:", error.data);
        }
        
        if (error.reason) {
            console.log("Error Reason:", error.reason);
        }
        
        console.log("\n💡 Troubleshooting Tips:");
        console.log("1. Check that the contract ABI matches the deployed contract");
        console.log("2. Verify LayerZero options are properly formatted");
        console.log("3. Ensure peer is correctly configured on both sides");
        console.log("4. Check if Solana program is ready to receive messages");
    }
}

main().catch(console.error);
