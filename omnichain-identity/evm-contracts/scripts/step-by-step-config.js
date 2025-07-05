const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    console.log("🔧 Step-by-Step LayerZero V2 Configuration");
    console.log("=========================================");
    
    const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contractAddress = process.env.IDENTITY_LINKER_ADDRESS;
    const endpointAddress = process.env.LZ_ETHEREUM_ENDPOINT;
    
    console.log("Contract:", contractAddress);
    console.log("Endpoint:", endpointAddress);
    console.log("Wallet:", wallet.address);
    
    // Complete LayerZero Endpoint V2 ABI
    const endpointABI = [
        "function setSendLibrary(address _oapp, uint32 _eid, address _newLib) external",
        "function setReceiveLibrary(address _oapp, uint32 _eid, address _newLib, uint256 _gracePeriod) external",
        "function getSendLibrary(address _sender, uint32 _dstEid) external view returns (address lib)",
        "function getReceiveLibrary(address _receiver, uint32 _srcEid) external view returns (address lib, bool isDefault)",
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
        gasLimit: 500000, // 500k gas
        gasPrice: ethers.utils.parseUnits("20", "gwei") // 20 gwei
    };
    
    try {
        console.log("\n📋 Step 1: Check Current Library Configuration");
        
        // Check current libraries
        const currentSendLib = await endpoint.getSendLibrary(contractAddress, SOLANA_EID);
        console.log("Current Send Library:", currentSendLib);
        
        const currentReceiveLib = await endpoint.getReceiveLibrary(contractAddress, SOLANA_EID);
        console.log("Current Receive Library:", currentReceiveLib.lib, "Is Default:", currentReceiveLib.isDefault);
        
        console.log("\n📋 Step 2: Set Libraries");
        
        // Set send library
        if (currentSendLib.toLowerCase() !== SEND_LIB.toLowerCase()) {
            console.log("Setting send library to:", SEND_LIB);
            const setSendTx = await endpoint.setSendLibrary(contractAddress, SOLANA_EID, SEND_LIB, gasSettings);
            console.log("Send library tx:", setSendTx.hash);
            await setSendTx.wait();
            console.log("✅ Send library set successfully");
        } else {
            console.log("✅ Send library already correct");
        }
        
        // Set receive library  
        if (currentReceiveLib.lib.toLowerCase() !== RECEIVE_LIB.toLowerCase()) {
            console.log("Setting receive library to:", RECEIVE_LIB);
            const setReceiveTx = await endpoint.setReceiveLibrary(contractAddress, SOLANA_EID, RECEIVE_LIB, 0, gasSettings);
            console.log("Receive library tx:", setReceiveTx.hash);
            await setReceiveTx.wait();
            console.log("✅ Receive library set successfully");
        } else {
            console.log("✅ Receive library already correct");
        }
        
        console.log("\n📋 Step 3: Configure DVN and Executor Settings");
        
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
        const sendConfigTx = await endpoint.setConfig(contractAddress, SEND_LIB, sendParams, gasSettings);
        console.log("Send config tx:", sendConfigTx.hash);
        await sendConfigTx.wait();
        console.log("✅ Send config set successfully");
        
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
        const receiveConfigTx = await endpoint.setConfig(contractAddress, RECEIVE_LIB, receiveParams, gasSettings);
        console.log("Receive config tx:", receiveConfigTx.hash);
        await receiveConfigTx.wait();
        console.log("✅ Receive config set successfully");
        
        console.log("\n📋 Step 4: Verify Configuration");
        
        // Verify library settings
        const newSendLib = await endpoint.getSendLibrary(contractAddress, SOLANA_EID);
        const newReceiveLib = await endpoint.getReceiveLibrary(contractAddress, SOLANA_EID);
        console.log("✅ Final Send Library:", newSendLib);
        console.log("✅ Final Receive Library:", newReceiveLib.lib);
        
        // Test configuration with quote
        console.log("\n📋 Step 5: Test Quote Function");
        const contractABI = ["function quoteLinkAddress(string memory _solanaAddress) external view returns (uint256)"];
        const contract = new ethers.Contract(contractAddress, contractABI, wallet);
        
        const testAddress = "DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz";
        const quote = await contract.quoteLinkAddress(testAddress);
        console.log("✅ Quote successful:", ethers.utils.formatEther(quote), "ETH");
        
        console.log("\n🎉 Complete LayerZero configuration successful!");
        console.log("🎯 Ready to send cross-chain messages!");
        
    } catch (error) {
        console.log("❌ Configuration step failed:", error.message);
        if (error.reason) {
            console.log("Reason:", error.reason);
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
