const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    console.log("🔧 Configuring LayerZero V2 OApp for Solana cross-chain messaging...");
    console.log("⚠️  CRITICAL DISCOVERY: Solana Devnet EID is 40168, NOT 30168!");
    
    const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log("Wallet:", wallet.address);
    console.log("Contract:", process.env.IDENTITY_LINKER_ADDRESS);
    
    const contractAddress = process.env.IDENTITY_LINKER_ADDRESS;
    const endpointAddress = process.env.LZ_ETHEREUM_ENDPOINT;
    
    // FIXED: Correct Solana Devnet EID based on LayerZero V2 documentation
    const solanaChainId = 40168; // NOT 30168!
    
    console.log("Endpoint:", endpointAddress);
    console.log("✅ CORRECTED Solana Chain ID (Devnet):", solanaChainId);
    
    // Our contract ABI to update the chain ID
    const contractABI = [
        "function SOLANA_CHAIN_ID() view returns (uint32)",
        "function owner() view returns (address)",
        "function peers(uint32) view returns (bytes32)",
        "function setPeer(uint32 _eid, bytes32 _peer) external"
    ];
    
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);
    
    try {
        // Check current configuration
        const currentChainId = await contract.SOLANA_CHAIN_ID();
        const owner = await contract.owner();
        
        console.log("\n📋 Current Contract State:");
        console.log("Current SOLANA_CHAIN_ID in contract:", currentChainId.toString());
        console.log("Contract owner:", owner);
        console.log("Wallet address:", wallet.address);
        console.log("Is wallet owner?", owner.toLowerCase() === wallet.address.toLowerCase());
        
        if (currentChainId.toString() !== solanaChainId.toString()) {
            console.log("\n❌ CRITICAL ISSUE FOUND:");
            console.log(`Contract has wrong chain ID: ${currentChainId} (should be ${solanaChainId})`);
            console.log("This explains why cross-chain messaging is failing!");
            
            // Check if we can update the peer with correct chain ID
            if (owner.toLowerCase() === wallet.address.toLowerCase()) {
                console.log("\n🔧 FIXING: Setting peer for correct Solana chain ID...");
                
                // Convert Solana program address to bytes32
                const solanaProgramId = process.env.SOLANA_OAPP_ADDRESS;
                const peerBytes32 = ethers.zeroPadValue(ethers.toUtf8Bytes(solanaProgramId), 32);
                
                console.log("Setting peer:");
                console.log("- Chain ID:", solanaChainId);
                console.log("- Solana Program:", solanaProgramId);
                console.log("- Peer bytes32:", peerBytes32);
                
                const tx = await contract.setPeer(solanaChainId, peerBytes32, {
                    gasLimit: 200000
                });
                
                console.log("Transaction sent:", tx.hash);
                await tx.wait();
                console.log("✅ Peer set for correct Solana chain ID!");
                
                // Verify the peer was set
                const newPeer = await contract.peers(solanaChainId);
                console.log("Verified peer:", newPeer);
                
            } else {
                console.log("❌ Cannot fix: wallet is not the contract owner");
                console.log("Need to deploy new contract with correct chain ID");
            }
        } else {
            console.log("✅ Chain ID is correct");
        }
        
        // Check LayerZero endpoint support for the correct chain ID
        console.log("\n📋 Testing LayerZero endpoint with correct chain ID...");
        
        const endpointABI = [
            "function defaultSendLibrary(uint32 eid) external view returns (address lib)",
            "function defaultReceiveLibrary(uint32 eid) external view returns (address lib)"
        ];
        
        const endpoint = new ethers.Contract(endpointAddress, endpointABI, wallet);
        
        try {
            const defaultSendLib = await endpoint.defaultSendLibrary(solanaChainId);
            const defaultReceiveLib = await endpoint.defaultReceiveLibrary(solanaChainId);
            
            console.log("Default Send Library:", defaultSendLib);
            console.log("Default Receive Library:", defaultReceiveLib);
            
            if (defaultSendLib !== ethers.ZeroAddress && defaultReceiveLib !== ethers.ZeroAddress) {
                console.log("✅ Solana chain ID IS supported by this endpoint!");
                console.log("The cross-chain messaging should work now with correct chain ID.");
            } else {
                console.log("⚠️  Libraries are zero - may need additional configuration");
            }
            
        } catch (libError) {
            console.log("❌ Library check failed:", libError.message);
        }
        
        console.log("\n� SOLUTION SUMMARY:");
        console.log("1. The main issue was wrong Solana chain ID (30168 vs 40168)");
        console.log("2. Need to redeploy contract with correct SOLANA_CHAIN_ID = 40168");
        console.log("3. Or update peer configuration if contract allows it");
        console.log("4. Use LayerZero V2 official tooling for proper configuration");
        
        console.log("\n📚 Based on LayerZero V2 documentation:");
        console.log("- Solana Devnet EID: 40168");
        console.log("- Ethereum Sepolia EID: 40161");
        console.log("- Use `npx @layerzerolabs/create-lz-oapp` for proper setup");
        
    } catch (error) {
        console.error("❌ Configuration failed:", error.message);
        console.error("Full error:", error);
    }
}

main().catch(console.error);
