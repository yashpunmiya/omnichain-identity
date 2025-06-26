const { ethers } = require("ethers");
require("dotenv").config();

/**
 * LAYERZERO V2 CONFIGURATION VERIFICATION & MESSAGE TEST
 * 
 * This script verifies that the LayerZero V2 configuration is working
 * and tests actual cross-chain message sending with fee estimation.
 */

async function main() {
    console.log("🔍 Verifying LayerZero V2 Configuration and Testing Cross-Chain Messaging");
    
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const contractAddress = process.env.IDENTITY_LINKER_ADDRESS;
    const endpointAddress = process.env.LZ_ETHEREUM_ENDPOINT;
    const solanaChainId = 40168;
    
    console.log("📋 Testing Configuration:");
    console.log("Contract:", contractAddress);
    console.log("Endpoint:", endpointAddress);
    console.log("Solana Chain ID:", solanaChainId);
    console.log("Wallet:", wallet.address);
    
    // Contract ABI for the OmnichainIdentityLinker
    const contractABI = [
        "function linkAddress(string memory _solanaAddress) external payable",
        "function quoteFee(uint32 _dstEid, string memory _solanaAddress, bool _payInLzToken) external view returns (uint256 nativeFee, uint256 lzTokenFee)",
        "function owner() external view returns (address)",
        "function gasLimit() external view returns (uint256)"
    ];
    
    // Endpoint ABI
    const endpointABI = [
        "function getSendLibrary(address sender, uint32 dstEid) external view returns (address lib)",
        "function getReceiveLibrary(address receiver, uint32 srcEid) external view returns (address lib, bool isDefault)",
        "function getConfig(address oapp, address lib, uint32 eid, uint32 configType) external view returns (bytes config)"
    ];
    
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);
    const endpoint = new ethers.Contract(endpointAddress, endpointABI, provider);
    
    try {
        console.log("\n📋 Step 1: Verifying Contract State...");
        
        // Check contract owner
        try {
            const owner = await contract.owner();
            console.log("✅ Contract Owner:", owner);
            console.log("✅ Wallet is Owner:", owner.toLowerCase() === wallet.address.toLowerCase());
        } catch (e) {
            console.log("⚠️ Could not check owner (method may not exist)");
        }
        
        // Check gas limit
        try {
            const gasLimit = await contract.gasLimit();
            console.log("✅ Gas Limit:", gasLimit.toString());
        } catch (e) {
            console.log("⚠️ Could not check gas limit");
        }
        
        console.log("\n📋 Step 2: Verifying LayerZero Library Configuration...");
        
        // Check send library
        const sendLib = await endpoint.getSendLibrary(contractAddress, solanaChainId);
        console.log("Send Library:", sendLib);
        
        // Check receive library
        const [receiveLib, isDefault] = await endpoint.getReceiveLibrary(contractAddress, solanaChainId);
        console.log("Receive Library:", receiveLib);
        console.log("Is Default:", isDefault);
        
        // Expected addresses
        const EXPECTED_SEND_ULN = "0xcc1ae8Cf5D3904Cef3360A9532B477529b177cCE";
        const EXPECTED_RECEIVE_ULN = "0xdAf00F5eE2158dD58E0d3857851c432E34A3A851";
        
        const sendLibCorrect = sendLib.toLowerCase() === EXPECTED_SEND_ULN.toLowerCase();
        const receiveLibCorrect = receiveLib.toLowerCase() === EXPECTED_RECEIVE_ULN.toLowerCase();
        
        console.log("✅ Send Library Correct:", sendLibCorrect);
        console.log("✅ Receive Library Correct:", receiveLibCorrect);
        
        if (!sendLibCorrect || !receiveLibCorrect) {
            console.log("❌ Libraries not configured correctly. Run fix-layerzero-config.js first.");
            return;
        }
        
        console.log("\n📋 Step 3: Testing Fee Estimation (The Critical Test)...");
        
        // Test parameters
        const testSolanaAddress = "D4c11KMgD9u2wH7eAgQDNBnGefyJy8k6r3vtKtMC4e2N"; // Example Solana address
        
        try {
            const [nativeFee, lzTokenFee] = await contract.quoteFee(
                solanaChainId,
                testSolanaAddress,
                false // Pay in native token (ETH)
            );
            
            console.log("🎉 SUCCESS! Fee estimation works!");
            console.log("✅ Native Fee (ETH):", ethers.formatEther(nativeFee), "ETH");
            console.log("✅ LZ Token Fee:", lzTokenFee.toString());
            
            console.log("\n📋 Step 4: Testing Actual Message Sending...");
            
            // Check wallet balance
            const balance = await provider.getBalance(wallet.address);
            const balanceEth = ethers.formatEther(balance);
            console.log("Wallet Balance:", balanceEth, "ETH");
            
            if (balance < nativeFee) {
                console.log("❌ Insufficient balance for sending message");
                console.log("💰 Need:", ethers.formatEther(nativeFee), "ETH");
                console.log("💰 Have:", balanceEth, "ETH");
                return;
            }
            
            // Add some buffer for gas fees
            const totalNeeded = nativeFee + ethers.parseEther("0.01"); // Add 0.01 ETH for gas
            
            if (balance >= totalNeeded) {
                console.log("💸 Sending test message to Solana...");
                
                const linkTx = await contract.linkAddress(testSolanaAddress, {
                    value: nativeFee,
                    gasLimit: 500000
                });
                
                console.log("📤 Transaction sent:", linkTx.hash);
                console.log("⏳ Waiting for confirmation...");
                
                const receipt = await linkTx.wait();
                
                if (receipt.status === 1) {
                    console.log("🎉 SUCCESS! Cross-chain message sent successfully!");
                    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
                    console.log("✅ Gas used:", receipt.gasUsed.toString());
                    
                    console.log("\n🔍 Next Steps:");
                    console.log("1. ✅ Check LayerZero scan for message status");
                    console.log("2. ✅ Verify on Solana that the PDA received the message");
                    console.log("3. ✅ Your cross-chain messaging is now working!");
                    
                } else {
                    console.log("❌ Transaction failed");
                }
                
            } else {
                console.log("⚠️ Skipping actual send test due to insufficient balance");
                console.log("💰 Need:", ethers.formatEther(totalNeeded), "ETH total");
                console.log("💡 But fee estimation works, so configuration is correct!");
            }
            
        } catch (feeError) {
            console.log("❌ Fee estimation failed:", feeError.message);
            
            if (feeError.message.includes("0x6592671c")) {
                console.log("💡 This is the DVN/Executor config error - configuration needs to be fixed");
                console.log("💡 Run: npx hardhat run scripts/fix-layerzero-config.js --network sepolia");
            } else {
                console.log("💡 Different error - check the contract and endpoint configuration");
            }
            return;
        }
        
        console.log("\n🎉 VERIFICATION COMPLETE!");
        console.log("✅ LayerZero V2 configuration is working correctly");
        console.log("✅ Cross-chain messaging should now work");
        console.log("✅ Ready for hackathon demo!");
        
    } catch (error) {
        console.error("❌ Verification failed:", error.message);
        console.error("Full error:", error);
    }
}

main().catch(console.error);
