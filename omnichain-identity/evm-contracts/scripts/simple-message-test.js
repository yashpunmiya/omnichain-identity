const { ethers } = require("ethers");
require("dotenv").config();

/**
 * SIMPLE LAYERZERO V2 MESSAGE TEST
 * Test basic cross-chain message sending to debug the issue
 */

async function main() {
    console.log("🧪 Simple LayerZero V2 Message Test");
    
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const contractAddress = process.env.IDENTITY_LINKER_ADDRESS;
    const solanaChainId = 40168;
    
    console.log("📋 Test Details:");
    console.log("Contract:", contractAddress);
    console.log("Solana Chain ID:", solanaChainId);
    console.log("Wallet:", wallet.address);
    
    // Simple contract ABI for testing
    const contractABI = [
        "function linkIdentity(string calldata evmAddress, string calldata solanaAddress) external payable",
        "function quoteLinkIdentity(string calldata evmAddress, string calldata solanaAddress) external view returns (uint256)",
        "function owner() external view returns (address)"
    ];
    
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);
    
    try {
        console.log("\n📋 Step 1: Basic Contract Check...");
        
        const owner = await contract.owner();
        console.log("✅ Contract Owner:", owner);
        console.log("✅ Is Owner:", owner.toLowerCase() === wallet.address.toLowerCase());
        
        console.log("\n📋 Step 2: Simple Fee Quote Test...");
        
        const testEvmAddress = wallet.address;
        const testSolanaAddress = "44c11KMgD9u2wH7eAgQDNBnGefyJy8k6r3vtHtMC4e2N";
        
        console.log("Test EVM Address:", testEvmAddress);
        console.log("Test Solana Address:", testSolanaAddress);
        
        // Try fee quote with try-catch to get exact error
        try {
            const fee = await contract.quoteLinkIdentity(testEvmAddress, testSolanaAddress);
            console.log("✅ Fee Quote Successful:", ethers.formatEther(fee), "ETH");
            
            console.log("\n📋 Step 3: Test Message Send...");
            
            // Get current balance
            const balance = await provider.getBalance(wallet.address);
            console.log("Current Balance:", ethers.formatEther(balance), "ETH");
            
            if (balance > fee + ethers.parseEther("0.001")) {
                console.log("💸 Attempting to send cross-chain message...");
                
                const tx = await contract.linkIdentity(
                    testEvmAddress, 
                    testSolanaAddress,
                    { 
                        value: fee,
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
                    });
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
            
            // Try to get more detailed error by calling the endpoint directly
            console.log("\n🔍 Debugging: Checking Endpoint Integration...");
            
            const endpointAddress = process.env.LZ_ETHEREUM_ENDPOINT;
            const endpointABI = [
                "function send(tuple(uint32 dstEid, bytes32 to, bytes message, bytes options, bytes composeMsg) params, address refundAddress) external payable returns (tuple(bytes32 guid, uint64 nonce, uint256 fee) receipt)",
                "function quote(tuple(uint32 dstEid, bytes32 to, bytes message, bytes options, bytes composeMsg) params, address payingFor) external view returns (uint256 fee)"
            ];
            
            const endpoint = new ethers.Contract(endpointAddress, endpointABI, provider);
            
            try {
                // Direct endpoint quote test
                const message = ethers.AbiCoder.defaultAbiCoder().encode(
                    ["string", "string"],
                    [testEvmAddress, testSolanaAddress]
                );
                
                const receiverBytes32 = ethers.zeroPadValue(contractAddress, 32);
                const options = "0x00030100110100000000000000000000000000030d40"; // Basic options
                
                const sendParams = {
                    dstEid: solanaChainId,
                    to: receiverBytes32,
                    message: message,
                    options: options,
                    composeMsg: "0x"
                };
                
                const endpointFee = await endpoint.quote(sendParams, contractAddress);
                console.log("✅ Direct Endpoint Fee:", ethers.formatEther(endpointFee), "ETH");
                
            } catch (endpointError) {
                console.log("❌ Direct Endpoint Error:", endpointError.message);
                
                // Try the raw revert reason
                if (endpointError.data) {
                    console.log("Raw Error Data:", endpointError.data);
                }
            }
        }
        
    } catch (error) {
        console.error("❌ Test failed:", error.message);
        
        if (error.data) {
            console.log("Raw Error Data:", error.data);
        }
        
        // Try to decode the error if it's from the contract
        if (error.reason) {
            console.log("Error Reason:", error.reason);
        }
        
        console.log("\n💡 Troubleshooting Tips:");
        console.log("1. Check that the contract is properly deployed");
        console.log("2. Verify LayerZero endpoint configuration");
        console.log("3. Ensure DVN/Executor configuration matches");
        console.log("4. Check if peer is set on Solana side");
    }
}

main().catch(console.error);
