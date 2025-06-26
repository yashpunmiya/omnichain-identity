const { ethers } = require("ethers");
require("dotenv").config();

/**
 * CHECK CURRENT LAYERZERO V2 CONFIGURATION STATUS
 * This script checks the current state of the LayerZero configuration
 */

async function main() {
    console.log("🔍 Checking Current LayerZero V2 Configuration Status");
    
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    
    const contractAddress = process.env.IDENTITY_LINKER_ADDRESS;
    const endpointAddress = process.env.LZ_ETHEREUM_ENDPOINT;
    const solanaChainId = 40168; // Correct Solana Devnet EID
    
    console.log("📋 Configuration Details:");
    console.log("Contract:", contractAddress);
    console.log("Endpoint:", endpointAddress);
    console.log("Solana Chain ID:", solanaChainId);
    
    // Enhanced Endpoint ABI for LayerZero V2
    const endpointABI = [
        "function getSendLibrary(address sender, uint32 dstEid) external view returns (address lib)",
        "function getReceiveLibrary(address receiver, uint32 srcEid) external view returns (address lib, bool isDefault)",
        "function getConfig(address oapp, address lib, uint32 eid, uint32 configType) external view returns (bytes config)"
    ];
    
    const endpoint = new ethers.Contract(endpointAddress, endpointABI, provider);
    
    try {
        console.log("\n📋 Step 1: Checking Current Libraries...");
        
        // Check send library
        try {
            const sendLib = await endpoint.getSendLibrary(contractAddress, solanaChainId);
            console.log("✅ Current Send Library:", sendLib);
        } catch (error) {
            console.log("❌ Send Library Error:", error.message);
        }
        
        // Check receive library
        try {
            const receiveLibResult = await endpoint.getReceiveLibrary(contractAddress, solanaChainId);
            console.log("✅ Current Receive Library:", receiveLibResult[0]);
            console.log("   Is Default:", receiveLibResult[1]);
        } catch (error) {
            console.log("❌ Receive Library Error:", error.message);
        }
        
        // Check configs if libraries exist
        console.log("\n📋 Step 2: Checking Current Configurations...");
        
        // Official LayerZero V2 addresses
        const SEPOLIA_SEND_ULN302 = "0xcc1ae8Cf5D3904Cef3360A9532B477529b177cCE";
        const SEPOLIA_RECEIVE_ULN302 = "0xdAf00F5eE2158dD58E0d3857851c432E34A3A851";
        
        const CONFIG_TYPE_EXECUTOR = 1;
        const CONFIG_TYPE_ULN = 2;
        
        // Check send executor config
        try {
            const executorConfig = await endpoint.getConfig(
                contractAddress, 
                SEPOLIA_SEND_ULN302, 
                solanaChainId, 
                CONFIG_TYPE_EXECUTOR
            );
            console.log("✅ Send Executor Config:", executorConfig);
            if (executorConfig && executorConfig !== "0x") {
                try {
                    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
                        ["uint32", "address"],
                        executorConfig
                    );
                    console.log("   Max Message Size:", decoded[0].toString());
                    console.log("   Executor Address:", decoded[1]);
                } catch (decodeError) {
                    console.log("   Raw config (decode failed):", executorConfig);
                }
            }
        } catch (error) {
            console.log("❌ Send Executor Config Error:", error.message);
        }
        
        // Check send ULN config
        try {
            const ulnConfig = await endpoint.getConfig(
                contractAddress, 
                SEPOLIA_SEND_ULN302, 
                solanaChainId, 
                CONFIG_TYPE_ULN
            );
            console.log("✅ Send ULN Config:", ulnConfig);
            if (ulnConfig && ulnConfig !== "0x") {
                try {
                    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
                        ["uint64", "uint8", "uint8", "uint8", "address[]", "address[]"],
                        ulnConfig
                    );
                    console.log("   Confirmations:", decoded[0].toString());
                    console.log("   Required DVN Count:", decoded[1]);
                    console.log("   Optional DVN Count:", decoded[2]);
                    console.log("   Optional DVN Threshold:", decoded[3]);
                    console.log("   Required DVNs:", decoded[4]);
                    console.log("   Optional DVNs:", decoded[5]);
                } catch (decodeError) {
                    console.log("   Raw config (decode failed):", ulnConfig);
                }
            }
        } catch (error) {
            console.log("❌ Send ULN Config Error:", error.message);
        }
        
        // Check receive ULN config
        try {
            const receiveUlnConfig = await endpoint.getConfig(
                contractAddress, 
                SEPOLIA_RECEIVE_ULN302, 
                solanaChainId, 
                CONFIG_TYPE_ULN
            );
            console.log("✅ Receive ULN Config:", receiveUlnConfig);
            if (receiveUlnConfig && receiveUlnConfig !== "0x") {
                try {
                    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
                        ["uint64", "uint8", "uint8", "uint8", "address[]", "address[]"],
                        receiveUlnConfig
                    );
                    console.log("   Confirmations:", decoded[0].toString());
                    console.log("   Required DVN Count:", decoded[1]);
                    console.log("   Optional DVN Count:", decoded[2]);
                    console.log("   Optional DVN Threshold:", decoded[3]);
                    console.log("   Required DVNs:", decoded[4]);
                    console.log("   Optional DVNs:", decoded[5]);
                } catch (decodeError) {
                    console.log("   Raw config (decode failed):", receiveUlnConfig);
                }
            }
        } catch (error) {
            console.log("❌ Receive ULN Config Error:", error.message);
        }
        
        console.log("\n✅ Configuration check completed!");
        
    } catch (error) {
        console.error("❌ Configuration check failed:", error.message);
        console.error("Full error:", error);
    }
}

main().catch(console.error);
