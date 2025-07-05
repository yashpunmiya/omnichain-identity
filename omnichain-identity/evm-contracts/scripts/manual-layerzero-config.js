const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    console.log("🔧 Manual LayerZero Configuration with Fixed Gas");
    console.log("=================================================");
    
    const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contractAddress = process.env.IDENTITY_LINKER_ADDRESS;
    const endpointAddress = process.env.LZ_ETHEREUM_ENDPOINT;
    
    console.log("Contract:", contractAddress);
    console.log("Endpoint:", endpointAddress);
    console.log("Wallet:", wallet.address);
    
    // LayerZero Endpoint V2 ABI (minimal for configuration)
    const endpointABI = [
        "function setSendLibrary(address _oapp, uint32 _dstEid, address _newLib) external",
        "function setReceiveLibrary(address _oapp, uint32 _dstEid, address _newLib, uint256 _gracePeriod) external",
        "function getSendLibrary(address _sender, uint32 _dstEid) external view returns (address lib)",
        "function getReceiveLibrary(address _receiver, uint32 _srcEid) external view returns (address lib, bool isDefault)"
    ];
    
    const endpoint = new ethers.Contract(endpointAddress, endpointABI, wallet);
    
    // Library addresses for Sepolia (from LayerZero docs/config)
    const SEPOLIA_SEND_LIB = "0xcc1ae8Cf5D3904Cef3360A9532B477529b177cCE";
    const SEPOLIA_RECEIVE_LIB = "0xdAf00F5eE2158dD58E0d3857851c432E34A3A851";
    const SOLANA_EID = 40168;
    
    // Gas settings to avoid estimation issues
    const gasSettings = {
        gasLimit: 500000, // 500k gas
        gasPrice: ethers.utils.parseUnits("20", "gwei") // 20 gwei
    };
    
    try {
        console.log("\n📋 Current Library Configuration:");
        
        try {
            const currentSendLib = await endpoint.getSendLibrary(contractAddress, SOLANA_EID);
            console.log("Current Send Library:", currentSendLib);
        } catch (error) {
            console.log("❌ Error getting send library:", error.message);
        }
        
        try {
            const currentReceiveLib = await endpoint.getReceiveLibrary(contractAddress, SOLANA_EID);
            console.log("Current Receive Library:", currentReceiveLib.lib, "Is Default:", currentReceiveLib.isDefault);
        } catch (error) {
            console.log("❌ Error getting receive library:", error.message);
        }
        
        console.log("\n🔧 Setting Libraries...");
        
        // Set send library
        console.log("Setting send library to:", SEPOLIA_SEND_LIB);
        const setSendTx = await endpoint.setSendLibrary(contractAddress, SOLANA_EID, SEPOLIA_SEND_LIB, gasSettings);
        console.log("Send library tx:", setSendTx.hash);
        await setSendTx.wait();
        console.log("✅ Send library set successfully");
        
        // Set receive library  
        console.log("Setting receive library to:", SEPOLIA_RECEIVE_LIB);
        const setReceiveTx = await endpoint.setReceiveLibrary(contractAddress, SOLANA_EID, SEPOLIA_RECEIVE_LIB, 0, gasSettings);
        console.log("Receive library tx:", setReceiveTx.hash);
        await setReceiveTx.wait();
        console.log("✅ Receive library set successfully");
        
        console.log("\n📋 Verifying Library Configuration:");
        const newSendLib = await endpoint.getSendLibrary(contractAddress, SOLANA_EID);
        const newReceiveLib = await endpoint.getReceiveLibrary(contractAddress, SOLANA_EID);
        console.log("✅ New Send Library:", newSendLib);
        console.log("✅ New Receive Library:", newReceiveLib.lib);
        
        console.log("\n🎉 Library configuration completed!");
        console.log("Now testing quote function...");
        
        // Test the quote function again
        const contractABI = ["function quoteLinkAddress(string memory _solanaAddress) external view returns (uint256)"];
        const contract = new ethers.Contract(contractAddress, contractABI, wallet);
        
        const testAddress = "DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz";
        const quote = await contract.quoteLinkAddress(testAddress);
        console.log("✅ Quote successful:", ethers.utils.formatEther(quote), "ETH");
        
    } catch (error) {
        console.log("❌ Configuration failed:", error.message);
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
