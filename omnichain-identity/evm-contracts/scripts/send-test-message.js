const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    console.log("🚀 Sending Cross-Chain Message Test");
    console.log("===================================");
    
    const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contractAddress = process.env.IDENTITY_LINKER_ADDRESS;
    
    console.log("Contract:", contractAddress);
    console.log("Sender:", wallet.address);
    
    // Contract ABI
    const contractABI = [
        "function quoteLinkAddress(string memory _solanaAddress) external view returns (uint256)",
        "function linkAddress(string memory _solanaAddress) external payable"
    ];
    
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);
    
    const testSolanaAddress = "DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz";
    
    try {
        console.log("📋 Step 1: Get Quote");
        
        // Get quote
        const quote = await contract.quoteLinkAddress(testSolanaAddress);
        console.log("Quote:", ethers.utils.formatEther(quote), "ETH");
        console.log("Quote in wei:", quote.toString());
        
        console.log("\n📋 Step 2: Send Cross-Chain Message");
        console.log("Sending message to Solana...");
        
        // Send message with a small buffer (add 10% to the quote)
        const fee = quote.add(quote.div(10));
        console.log("Sending with fee:", ethers.utils.formatEther(fee), "ETH");
        
        const tx = await contract.linkAddress(testSolanaAddress, { 
            value: fee,
            gasLimit: 500000
        });
        
        console.log("Transaction sent:", tx.hash);
        console.log("Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed!");
        console.log("Block number:", receipt.blockNumber);
        console.log("Gas used:", receipt.gasUsed.toString());
        
        // Extract the GUID from the transaction receipt
        console.log("\n📋 Step 3: Transaction Details");
        console.log("LayerZero Scan URL:");
        console.log(`https://testnet.layerzeroscan.com/tx/${tx.hash}`);
        
        console.log("\n🎯 Success! Cross-chain message sent!");
        console.log("🔍 Monitor the LayerZero Scan link to see delivery status");
        console.log("📊 The message should be delivered to Solana within a few minutes");
        
    } catch (error) {
        console.log("❌ Message send failed:", error.message);
        
        if (error.transaction) {
            console.log("Failed transaction hash:", error.transaction.hash);
        }
        
        if (error.reason) {
            console.log("Reason:", error.reason);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
