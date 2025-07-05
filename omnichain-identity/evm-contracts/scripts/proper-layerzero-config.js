const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    console.log("🔧 Proper LayerZero V2 Configuration Using setConfig API");
    console.log("=====================================================");
    
    const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contractAddress = process.env.IDENTITY_LINKER_ADDRESS;
    const endpointAddress = process.env.LZ_ETHEREUM_ENDPOINT;
    
    console.log("Contract:", contractAddress);
    console.log("Endpoint:", endpointAddress);
    console.log("Wallet:", wallet.address);
    
    // Proper LayerZero Endpoint V2 ABI
    const endpointABI = [
        "function setConfig(address _oapp, address _lib, tuple(uint32 eid, uint32 configType, bytes config)[] _params) external",
        "function getConfig(address _oapp, address _lib, uint32 _eid, uint32 _configType) external view returns (bytes)"
    ];
    
    const endpoint = new ethers.Contract(endpointAddress, endpointABI, wallet);
    
    // Configuration constants
    const SOLANA_EID = 40168;
    const SEND_LIB = "0xcc1ae8Cf5D3904Cef3360A9532B477529b177cCE";
    const RECEIVE_LIB = "0xdAf00F5eE2158dD58E0d3857851c432E34A3A851";
    
    // DVN and Executor addresses for Sepolia
    const LAYERZERO_DVN_SEPOLIA = "0x8eebf8b423B73bFCa51a1Db4B7354AA0bFCA9193";
    const EXECUTOR_SEPOLIA = "0x718B92b5CB0a5552039B593faF724D182A881eDA";
    
    // Config type constants
    const EXECUTOR_CONFIG_TYPE = 1;
    const ULN_CONFIG_TYPE = 2;
    
    // Gas settings
    const gasSettings = {
        gasLimit: 1000000, // 1M gas
        gasPrice: ethers.utils.parseUnits("20", "gwei") // 20 gwei
    };
    
    try {
        console.log("\n🔧 Configuring Send Config (Sepolia -> Solana)...");
        
        // ULN Config for sending (Sepolia -> Solana)
        const sendUlnConfig = ethers.utils.defaultAbiCoder.encode(
            ["uint64", "uint8", "uint8", "uint8", "address[]", "address[]"],
            [
                1, // confirmations
                1, // requiredDVNCount  
                0, // optionalDVNCount
                0, // optionalDVNThreshold
                [LAYERZERO_DVN_SEPOLIA], // requiredDVNs
                [] // optionalDVNs
            ]
        );
        
        // Executor Config for sending
        const executorConfig = ethers.utils.defaultAbiCoder.encode(
            ["uint32", "address"],
            [10000, EXECUTOR_SEPOLIA] // maxMessageSize, executor
        );
        
        // Build SetConfigParam array for send config
        const sendParams = [
            {
                eid: SOLANA_EID,
                configType: EXECUTOR_CONFIG_TYPE,
                config: executorConfig
            },
            {
                eid: SOLANA_EID,
                configType: ULN_CONFIG_TYPE,
                config: sendUlnConfig
            }
        ];
        
        console.log("Setting send config...");
        const sendTx = await endpoint.setConfig(contractAddress, SEND_LIB, sendParams, gasSettings);
        console.log("Send config tx:", sendTx.hash);
        await sendTx.wait();
        console.log("✅ Send config set successfully");
        
        console.log("\n🔧 Configuring Receive Config (Solana -> Sepolia)...");
        
        // ULN Config for receiving (Solana -> Sepolia)  
        const receiveUlnConfig = ethers.utils.defaultAbiCoder.encode(
            ["uint64", "uint8", "uint8", "uint8", "address[]", "address[]"],
            [
                32, // confirmations (higher for Solana)
                1, // requiredDVNCount
                0, // optionalDVNCount  
                0, // optionalDVNThreshold
                [LAYERZERO_DVN_SEPOLIA], // requiredDVNs
                [] // optionalDVNs
            ]
        );
        
        // Build SetConfigParam array for receive config
        const receiveParams = [
            {
                eid: SOLANA_EID,
                configType: ULN_CONFIG_TYPE,
                config: receiveUlnConfig
            }
        ];
        
        console.log("Setting receive config...");
        const receiveTx = await endpoint.setConfig(contractAddress, RECEIVE_LIB, receiveParams, gasSettings);
        console.log("Receive config tx:", receiveTx.hash);
        await receiveTx.wait();
        console.log("✅ Receive config set successfully");
        
        console.log("\n🔍 Verifying Configuration...");
        
        // Check send config
        try {
            const sendUlnConfigCheck = await endpoint.getConfig(contractAddress, SEND_LIB, SOLANA_EID, ULN_CONFIG_TYPE);
            console.log("✅ Send ULN Config verified:", sendUlnConfigCheck.length > 2 ? "Set" : "Default");
        } catch (e) {
            console.log("❌ Send ULN Config check failed:", e.message);
        }
        
        try {
            const sendExecConfigCheck = await endpoint.getConfig(contractAddress, SEND_LIB, SOLANA_EID, EXECUTOR_CONFIG_TYPE);
            console.log("✅ Send Executor Config verified:", sendExecConfigCheck.length > 2 ? "Set" : "Default");
        } catch (e) {
            console.log("❌ Send Executor Config check failed:", e.message);
        }
        
        // Check receive config
        try {
            const receiveConfigCheck = await endpoint.getConfig(contractAddress, RECEIVE_LIB, SOLANA_EID, ULN_CONFIG_TYPE);
            console.log("✅ Receive ULN Config verified:", receiveConfigCheck.length > 2 ? "Set" : "Default");
        } catch (e) {
            console.log("❌ Receive ULN Config check failed:", e.message);
        }
        
        console.log("\n🎉 All LayerZero configurations completed!");
        console.log("Now testing quote function...");
        
        // Test the quote function
        const contractABI = ["function quoteLinkAddress(string memory _solanaAddress) external view returns (uint256)"];
        const contract = new ethers.Contract(contractAddress, contractABI, wallet);
        
        const testAddress = "DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz";
        const quote = await contract.quoteLinkAddress(testAddress);
        console.log("✅ Quote successful:", ethers.utils.formatEther(quote), "ETH");
        
        console.log("\n🎯 Ready to send cross-chain messages!");
        
    } catch (error) {
        console.log("❌ Configuration failed:", error.message);
        if (error.reason) {
            console.log("Reason:", error.reason);
        }
        if (error.data) {
            console.log("Error data:", error.data);
        }
        if (error.transaction) {
            console.log("Failed transaction:", error.transaction.hash);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
