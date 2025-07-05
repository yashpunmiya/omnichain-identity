const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    console.log("🔍 Checking LayerZero Configuration and Delegate Status");
    console.log("=====================================================");
    
    const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contractAddress = process.env.IDENTITY_LINKER_ADDRESS;
    const endpointAddress = process.env.LZ_ETHEREUM_ENDPOINT;
    
    console.log("Contract:", contractAddress);
    console.log("Endpoint:", endpointAddress);
    console.log("Wallet:", wallet.address);
    
    // LayerZero Endpoint V2 ABI
    const endpointABI = [
        "function delegates(address _oapp) external view returns (address)",
        "function setDelegate(address _delegate) external"
    ];
    
    // OApp ABI for delegate functions
    const oappABI = [
        "function setDelegate(address _delegate) external",
        "function endpoint() external view returns (address)",
        "function owner() external view returns (address)"
    ];
    
    const endpoint = new ethers.Contract(endpointAddress, endpointABI, wallet);
    const oapp = new ethers.Contract(contractAddress, oappABI, wallet);
    
    try {
        console.log("\n🔍 Current Configuration Status:");
        
        // Check contract owner
        const owner = await oapp.owner();
        console.log("Contract Owner:", owner);
        
        // Check endpoint
        const contractEndpoint = await oapp.endpoint();
        console.log("Contract Endpoint:", contractEndpoint);
        
        // Check current delegate
        const currentDelegate = await endpoint.delegates(contractAddress);
        console.log("Current Delegate:", currentDelegate);
        
        console.log("\n🔧 Analysis:");
        console.log("- Wallet matches owner?", wallet.address.toLowerCase() === owner.toLowerCase());
        console.log("- Endpoint matches?", contractEndpoint.toLowerCase() === endpointAddress.toLowerCase());
        console.log("- Delegate is set?", currentDelegate !== "0x0000000000000000000000000000000000000000");
        console.log("- Delegate is wallet?", currentDelegate.toLowerCase() === wallet.address.toLowerCase());
        
        // If delegate is not set or not the wallet, set it
        if (currentDelegate === "0x0000000000000000000000000000000000000000" || 
            currentDelegate.toLowerCase() !== wallet.address.toLowerCase()) {
            
            console.log("\n🔧 Setting delegate to wallet address...");
            const setDelegateTx = await oapp.setDelegate(wallet.address, {
                gasLimit: 200000,
                gasPrice: ethers.utils.parseUnits("20", "gwei")
            });
            console.log("Set delegate tx:", setDelegateTx.hash);
            await setDelegateTx.wait();
            console.log("✅ Delegate set successfully");
            
            // Verify
            const newDelegate = await endpoint.delegates(contractAddress);
            console.log("New Delegate:", newDelegate);
        } else {
            console.log("✅ Delegate is already properly set");
        }
        
        console.log("\n🎯 Ready for LayerZero configuration!");
        
    } catch (error) {
        console.log("❌ Check failed:", error.message);
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
