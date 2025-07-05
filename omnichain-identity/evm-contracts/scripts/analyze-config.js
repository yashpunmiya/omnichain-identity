const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    console.log("🔍 LayerZero Configuration Analysis and Simple Test");
    console.log("==================================================");
    
    const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contractAddress = process.env.IDENTITY_LINKER_ADDRESS;
    const endpointAddress = process.env.LZ_ETHEREUM_ENDPOINT;
    
    console.log("Contract:", contractAddress);
    console.log("Endpoint:", endpointAddress);
    console.log("Wallet:", wallet.address);
    
    // LayerZero Endpoint V2 ABI
    const endpointABI = [
        "function getSendLibrary(address _sender, uint32 _dstEid) external view returns (address lib)",
        "function getReceiveLibrary(address _receiver, uint32 _srcEid) external view returns (address lib, bool isDefault)",
        "function getConfig(address _oapp, address _lib, uint32 _eid, uint32 _configType) external view returns (bytes)",
        "function defaultSendLibrary(uint32 _eid) external view returns (address)",
        "function defaultReceiveLibrary(uint32 _eid) external view returns (address)"
    ];
    
    const endpoint = new ethers.Contract(endpointAddress, endpointABI, wallet);
    
    const SOLANA_EID = 40168;
    const EXECUTOR_CONFIG_TYPE = 1;
    const ULN_CONFIG_TYPE = 2;
    
    try {
        console.log("\n📋 Current Configuration Analysis:");
        
        // Check libraries
        const sendLib = await endpoint.getSendLibrary(contractAddress, SOLANA_EID);
        console.log("Send Library:", sendLib);
        
        const receiveLib = await endpoint.getReceiveLibrary(contractAddress, SOLANA_EID);
        console.log("Receive Library:", receiveLib.lib, "Is Default:", receiveLib.isDefault);
        
        // Check default libraries
        try {
            const defaultSend = await endpoint.defaultSendLibrary(SOLANA_EID);
            console.log("Default Send Library:", defaultSend);
        } catch (e) {
            console.log("Default Send Library: Not available");
        }
        
        try {
            const defaultReceive = await endpoint.defaultReceiveLibrary(SOLANA_EID);
            console.log("Default Receive Library:", defaultReceive);
        } catch (e) {
            console.log("Default Receive Library: Not available");
        }
        
        // Check current configs
        console.log("\n📋 Current Configurations:");
        
        try {
            const sendUlnConfig = await endpoint.getConfig(contractAddress, sendLib, SOLANA_EID, ULN_CONFIG_TYPE);
            console.log("Send ULN Config length:", sendUlnConfig.length);
            if (sendUlnConfig.length > 2) {
                console.log("Send ULN Config:", sendUlnConfig);
            } else {
                console.log("Send ULN Config: Using defaults");
            }
        } catch (e) {
            console.log("Send ULN Config error:", e.message);
        }
        
        try {
            const sendExecConfig = await endpoint.getConfig(contractAddress, sendLib, SOLANA_EID, EXECUTOR_CONFIG_TYPE);
            console.log("Send Executor Config length:", sendExecConfig.length);
            if (sendExecConfig.length > 2) {
                console.log("Send Executor Config:", sendExecConfig);
            } else {
                console.log("Send Executor Config: Using defaults");
            }
        } catch (e) {
            console.log("Send Executor Config error:", e.message);
        }
        
        try {
            const receiveUlnConfig = await endpoint.getConfig(contractAddress, receiveLib.lib, SOLANA_EID, ULN_CONFIG_TYPE);
            console.log("Receive ULN Config length:", receiveUlnConfig.length);
            if (receiveUlnConfig.length > 2) {
                console.log("Receive ULN Config:", receiveUlnConfig);
            } else {
                console.log("Receive ULN Config: Using defaults");
            }
        } catch (e) {
            console.log("Receive ULN Config error:", e.message);
        }
        
        console.log("\n📋 Testing Quote Function:");
        
        // Test the quote function with current setup
        const contractABI = ["function quoteLinkAddress(string memory _solanaAddress) external view returns (uint256)"];
        const contract = new ethers.Contract(contractAddress, contractABI, wallet);
        
        const testAddress = "DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz";
        
        try {
            const quote = await contract.quoteLinkAddress(testAddress);
            console.log("✅ Quote successful:", ethers.utils.formatEther(quote), "ETH");
            
            console.log("\n🎉 Configuration appears to be working!");
            console.log("🎯 LayerZero is configured with default settings");
            console.log("💡 You can now test cross-chain messaging");
            
        } catch (error) {
            console.log("❌ Quote failed:", error.message);
            console.log("💡 This might indicate configuration issues");
        }
        
    } catch (error) {
        console.log("❌ Analysis failed:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
