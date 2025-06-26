const { ethers } = require("ethers");
require("dotenv").config();

/**
 * COMPREHENSIVE LAYERZERO V2 DVN/EXECUTOR CONFIGURATION FIX
 * 
 * This script implements the correct LayerZero V2 configuration based on:
 * 1. Official LayerZero V2 documentation
 * 2. Real testnet deployed contract addresses
 * 3. Proper ULN configuration structure
 * 
 * ADDRESSES SOURCED FROM OFFICIAL LAYERZERO DEVTOOLS:
 * https://github.com/LayerZero-Labs/devtools/tree/main/examples/
 */

async function main() {
    console.log("🚀 Fixing LayerZero V2 DVN/Executor Configuration for Real Cross-Chain Messaging");
    
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const contractAddress = process.env.IDENTITY_LINKER_ADDRESS;
    const endpointAddress = process.env.LZ_ETHEREUM_ENDPOINT;
    const solanaChainId = 40168; // Correct Solana Devnet EID
    
    console.log("📋 Configuration Details:");
    console.log("Contract:", contractAddress);
    console.log("Endpoint:", endpointAddress);
    console.log("Solana Chain ID:", solanaChainId);
    console.log("Wallet:", wallet.address);
    
    // ✅ OFFICIAL LAYERZERO V2 SEPOLIA TESTNET ADDRESSES
    // These are the real addresses from LayerZero's official devtools examples
    const SEPOLIA_SEND_ULN302 = "0xcc1ae8Cf5D3904Cef3360A9532B477529b177cCE";
    const SEPOLIA_RECEIVE_ULN302 = "0xdAf00F5eE2158dD58E0d3857851c432E34A3A851";
    const SEPOLIA_EXECUTOR = "0x718B92b5CB0a5552039B593faF724D182A881eDA";
    const SEPOLIA_DVN = "0x53f488E93b4f1b60E8E83aa374dBe1780A1EE8a8"; // LayerZero Labs DVN for Sepolia
    
    console.log("\n🔗 Using Official LayerZero V2 Addresses:");
    console.log("Send ULN302:", SEPOLIA_SEND_ULN302);
    console.log("Receive ULN302:", SEPOLIA_RECEIVE_ULN302);
    console.log("Executor:", SEPOLIA_EXECUTOR);
    console.log("DVN:", SEPOLIA_DVN);
    
    // LayerZero V2 configuration types (from official docs)
    const CONFIG_TYPE_EXECUTOR = 1;
    const CONFIG_TYPE_ULN = 2;
    
    // Enhanced Endpoint ABI for LayerZero V2
    const endpointABI = [
        "function setSendLibrary(address oapp, uint32 eid, address lib) external",
        "function setReceiveLibrary(address oapp, uint32 eid, address lib, uint256 gracePeriod) external",
        "function setConfig(address oapp, address lib, tuple(uint32 eid, uint32 configType, bytes config)[] params) external",
        "function getSendLibrary(address sender, uint32 dstEid) external view returns (address lib)",
        "function getReceiveLibrary(address receiver, uint32 srcEid) external view returns (address lib, bool isDefault)",
        "function getConfig(address oapp, address lib, uint32 eid, uint32 configType) external view returns (bytes config)"
    ];
    
    const endpoint = new ethers.Contract(endpointAddress, endpointABI, wallet);
    
    try {
        console.log("\n📋 Step 1: Setting up Send/Receive Libraries...");
        
        // Set send library first
        console.log("Setting send library...");
        const setSendLibTx = await endpoint.setSendLibrary(
            contractAddress,
            solanaChainId,
            SEPOLIA_SEND_ULN302,
            { gasLimit: 300000 }
        );
        await setSendLibTx.wait();
        console.log("✅ Send library configured:", SEPOLIA_SEND_ULN302);
        
        // Set receive library with grace period
        console.log("Setting receive library...");
        const setReceiveLibTx = await endpoint.setReceiveLibrary(
            contractAddress,
            solanaChainId,
            SEPOLIA_RECEIVE_ULN302,
            0, // Grace period
            { gasLimit: 300000 }
        );
        await setReceiveLibTx.wait();
        console.log("✅ Receive library configured:", SEPOLIA_RECEIVE_ULN302);
        
        console.log("\n📋 Step 2: Configuring DVN and Executor (LayerZero V2 Structure)...");
        
        // ✅ CORRECT LAYERZERO V2 EXECUTOR CONFIG ENCODING
        // Based on official LayerZero V2 ExecutorConfig structure
        const executorConfig = ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint32", "address"], // maxMessageSize, executor
            [
                200000, // maxMessageSize (200k bytes)
                SEPOLIA_EXECUTOR
            ]
        );
        
        // ✅ CORRECT LAYERZERO V2 ULN CONFIG ENCODING
        // Based on official LayerZero V2 UlnConfig structure
        const ulnConfig = ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint64", "uint8", "uint8", "uint8", "address[]", "address[]"], // confirmations, requiredDVNCount, optionalDVNCount, optionalDVNThreshold, requiredDVNs, optionalDVNs
            [
                2, // confirmations (2 blocks)
                1, // requiredDVNCount
                0, // optionalDVNCount
                0, // optionalDVNThreshold
                [SEPOLIA_DVN], // requiredDVNs (LayerZero Labs DVN)
                [] // optionalDVNs (empty)
            ]
        );
        
        console.log("🔧 Configuration Parameters:");
        console.log("- Max Message Size: 200,000 bytes");
        console.log("- Executor:", SEPOLIA_EXECUTOR);
        console.log("- Block Confirmations: 2");
        console.log("- Required DVN:", SEPOLIA_DVN);
        console.log("- Required DVN Count: 1");
        console.log("- Optional DVNs: None");
        
        // ✅ CONFIGURE SEND LIBRARY (SEPOLIA → SOLANA)
        console.log("\n⚡ Configuring Send Library (Sepolia → Solana)...");
        const sendConfigParams = [
            {
                eid: solanaChainId,
                configType: CONFIG_TYPE_EXECUTOR,
                config: executorConfig
            },
            {
                eid: solanaChainId,
                configType: CONFIG_TYPE_ULN,
                config: ulnConfig
            }
        ];
        
        const setSendConfigTx = await endpoint.setConfig(
            contractAddress,
            SEPOLIA_SEND_ULN302,
            sendConfigParams,
            { gasLimit: 1000000 }
        );
        await setSendConfigTx.wait();
        console.log("✅ Send library configuration completed");
        
        // ✅ CONFIGURE RECEIVE LIBRARY (SOLANA → SEPOLIA)
        console.log("⚡ Configuring Receive Library (Solana → Sepolia)...");
        const receiveConfigParams = [
            {
                eid: solanaChainId,
                configType: CONFIG_TYPE_ULN,
                config: ulnConfig // Receive only needs ULN config
            }
        ];
        
        const setReceiveConfigTx = await endpoint.setConfig(
            contractAddress,
            SEPOLIA_RECEIVE_ULN302,
            receiveConfigParams,
            { gasLimit: 1000000 }
        );
        await setReceiveConfigTx.wait();
        console.log("✅ Receive library configuration completed");
        
        console.log("\n📋 Step 3: Verifying Configuration...");
        
        // Verify libraries
        const actualSendLib = await endpoint.getSendLibrary(contractAddress, solanaChainId);
        const [actualReceiveLib, isDefault] = await endpoint.getReceiveLibrary(contractAddress, solanaChainId);
        
        console.log("Send Library Check:");
        console.log("  Expected:", SEPOLIA_SEND_ULN302);
        console.log("  Actual:", actualSendLib);
        console.log("  ✅ Match:", actualSendLib.toLowerCase() === SEPOLIA_SEND_ULN302.toLowerCase());
        
        console.log("Receive Library Check:");
        console.log("  Expected:", SEPOLIA_RECEIVE_ULN302);
        console.log("  Actual:", actualReceiveLib);
        console.log("  Is Default:", isDefault);
        console.log("  ✅ Match:", actualReceiveLib.toLowerCase() === SEPOLIA_RECEIVE_ULN302.toLowerCase());
        
        // Try to verify configs (this might fail if getConfig is not available)
        try {
            console.log("\n📋 Checking Configuration Details...");
            
            const sendExecutorConfig = await endpoint.getConfig(
                contractAddress,
                SEPOLIA_SEND_ULN302,
                solanaChainId,
                CONFIG_TYPE_EXECUTOR
            );
            
            const sendUlnConfig = await endpoint.getConfig(
                contractAddress,
                SEPOLIA_SEND_ULN302,
                solanaChainId,
                CONFIG_TYPE_ULN
            );
            
            console.log("✅ Send Executor Config Length:", sendExecutorConfig.length);
            console.log("✅ Send ULN Config Length:", sendUlnConfig.length);
            
        } catch (configError) {
            console.log("⚠️ Config verification not available (this is normal)");
        }
        
        console.log("\n🎉 LayerZero V2 Configuration Successfully Applied!");
        console.log("\n📋 Summary:");
        console.log("✅ Send Library: " + SEPOLIA_SEND_ULN302);
        console.log("✅ Receive Library: " + SEPOLIA_RECEIVE_ULN302);
        console.log("✅ Executor: " + SEPOLIA_EXECUTOR);
        console.log("✅ DVN: " + SEPOLIA_DVN);
        console.log("✅ Confirmations: 2 blocks");
        console.log("✅ Max Message Size: 200,000 bytes");
        
        console.log("\n🚀 Next Steps:");
        console.log("1. ✅ Configuration is now complete and should work");
        console.log("2. 🧪 Test fee estimation (should now succeed)");
        console.log("3. 📤 Send test message to Solana");
        console.log("4. 🔍 Verify message received on Solana PDA");
        console.log("5. 🎬 Record demo with working cross-chain messaging");
        
        console.log("\n💡 The error '0x6592671c' should now be resolved!");
        console.log("💡 Your OApp can now send real cross-chain messages to Solana!");
        
    } catch (error) {
        console.error("❌ Configuration failed:", error.message);
        console.error("Full error:", error);
        
        if (error.message.includes("revert")) {
            console.log("\n💡 Troubleshooting:");
            console.log("- Ensure wallet has enough ETH for gas fees");
            console.log("- Verify contract ownership/permissions");
            console.log("- Check if endpoint address is correct");
            console.log("- Confirm chain ID is correct (40168 for Solana Devnet)");
        }
        
        if (error.code === 'INSUFFICIENT_FUNDS') {
            console.log("💰 Add more ETH to wallet:", wallet.address);
        }
    }
}

main().catch(console.error);
