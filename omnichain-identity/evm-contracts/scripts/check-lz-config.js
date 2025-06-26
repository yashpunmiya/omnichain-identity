const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("Setting up LayerZero V2 configurations...");
    
    const [signer] = await ethers.getSigners();
    const contractAddress = process.env.IDENTITY_LINKER_ADDRESS;
    
    console.log("Contract:", contractAddress);
    console.log("Signer:", signer.address);
    
    // Get the endpoint contract
    const endpointAddress = process.env.LZ_ETHEREUM_ENDPOINT;
    
    // LayerZero V2 endpoint ABI for configuration
    const endpointABI = [
        "function getConfig(address oapp, address lib, uint32 eid, uint32 configType) external view returns (bytes memory config)",
        "function setConfig(address oapp, address lib, SetConfigParam[] calldata params) external",
        "function getSendLibrary(address sender, uint32 dstEid) external view returns (address lib)",
        "function getReceiveLibrary(address receiver, uint32 srcEid) external view returns (address lib, bool isDefault)"
    ];
    
    const endpoint = new ethers.Contract(endpointAddress, endpointABI, signer);
    
    try {
        // Check current send library
        const sendLib = await endpoint.getSendLibrary(contractAddress, 30168);
        console.log("Current send library:", sendLib);
        
        // Check current receive library
        const [receiveLib, isDefault] = await endpoint.getReceiveLibrary(contractAddress, 30168);
        console.log("Current receive library:", receiveLib, "Is default:", isDefault);
        
        // If libraries are zero address, we need to use the default libraries
        if (sendLib === ethers.ZeroAddress) {
            console.log("⚠️  Send library is not set, using default");
        }
        
        if (receiveLib === ethers.ZeroAddress) {
            console.log("⚠️  Receive library is not set, using default");
        }
        
        // Try to get config for executor
        try {
            const config = await endpoint.getConfig(contractAddress, sendLib, 30168, 1); // CONFIG_TYPE_EXECUTOR = 1
            console.log("Executor config length:", config.length);
        } catch (error) {
            console.log("Could not get executor config:", error.message);
        }
        
    } catch (error) {
        console.error("❌ Configuration check failed:", error.message);
        
        // The issue might be that we need to initialize the OApp with proper configs
        console.log("\n🔧 Try running the LayerZero tooling to set up configurations:");
        console.log("npx @layerzerolabs/toolbox-hardhat lz:oapp:config:init --oapp-config layerzero.config.js");
    }
}

main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});
