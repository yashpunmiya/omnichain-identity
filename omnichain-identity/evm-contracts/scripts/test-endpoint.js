const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("Testing LayerZero endpoint connection...");
    
    const [signer] = await ethers.getSigners();
    console.log("Using signer:", signer.address);
    
    // Get LayerZero endpoint
    const endpointAddress = process.env.LZ_ETHEREUM_ENDPOINT;
    console.log("Endpoint address:", endpointAddress);
    
    // Create endpoint contract instance
    const endpointABI = [
        "function getConfig(address oapp, address lib, uint32 eid, uint32 configType) external view returns (bytes memory config)",
        "function quote(address oapp, uint32 dstEid, bytes memory payload, bytes memory options, bool payInLzToken) external view returns (uint256 nativeFee, uint256 lzTokenFee)"
    ];
    
    const endpoint = new ethers.Contract(endpointAddress, endpointABI, signer);
    
    // Test if endpoint is accessible
    try {
        const contractAddress = process.env.IDENTITY_LINKER_ADDRESS;
        console.log("Testing with contract:", contractAddress);
        
        // Try to get config
        const config = await endpoint.getConfig(contractAddress, ethers.ZeroAddress, 30168, 1);
        console.log("✅ Endpoint accessible, config length:", config.length);
        
        // Try to quote
        const payload = ethers.toUtf8Bytes("test message");
        const options = "0x";
        
        const [nativeFee, lzTokenFee] = await endpoint.quote(
            contractAddress,
            30168, // Solana chain ID
            payload,
            options,
            false
        );
        
        console.log("✅ Quote successful:");
        console.log("Native fee:", ethers.formatEther(nativeFee), "ETH");
        console.log("LZ token fee:", lzTokenFee.toString());
        
    } catch (error) {
        console.error("❌ Endpoint test failed:", error.message);
    }
}

main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});
