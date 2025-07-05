const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    console.log("🔧 Complete LayerZero Configuration");
    console.log("===================================");
    
    const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contractAddress = process.env.IDENTITY_LINKER_ADDRESS;
    const endpointAddress = process.env.LZ_ETHEREUM_ENDPOINT;
    
    console.log("Contract:", contractAddress);
    console.log("Endpoint:", endpointAddress);
    
    // LayerZero Endpoint V2 ABI for configuration
    const endpointABI = [
        "function setConfig(address _oapp, address _lib, tuple(uint32 eid, uint32 configType, bytes config) _config) external"
    ];
    
    const endpoint = new ethers.Contract(endpointAddress, endpointABI, wallet);
    
    // Configuration constants
    const SOLANA_EID = 40168;
    const SEND_LIB = "0xcc1ae8Cf5D3904Cef3360A9532B477529b177cCE";
    const RECEIVE_LIB = "0xdAf00F5eE2158dD58E0d3857851c432E34A3A851";
    
    // DVN and Executor addresses for Sepolia
    const LAYERZERO_DVN_SEPOLIA = "0x8eebf8b423B73bFCa51a1Db4B7354AA0bFCA9193";
    const EXECUTOR_SEPOLIA = "0x718B92b5CB0a5552039B593faF724D182A881eDA";
    
    try {
        console.log("\n🔧 Configuring Send ULN Config...");
        
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
        
        const sendConfig = {
            eid: SOLANA_EID,
            configType: 2, // ULN_CONFIG_TYPE
            config: sendUlnConfig
        };
        
        console.log("Setting send ULN config...");
        const sendTx = await endpoint.setConfig(contractAddress, SEND_LIB, sendConfig);
        console.log("Send config tx:", sendTx.hash);
        await sendTx.wait();
        console.log("✅ Send ULN config set successfully");
        
        console.log("\n🔧 Configuring Executor Config...");
        
        // Executor Config
        const executorConfig = ethers.utils.defaultAbiCoder.encode(
            ["uint32", "address"],
            [10000, EXECUTOR_SEPOLIA] // maxMessageSize, executor
        );
        
        const execConfig = {
            eid: SOLANA_EID,
            configType: 1, // EXECUTOR_CONFIG_TYPE
            config: executorConfig
        };
        
        console.log("Setting executor config...");
        const execTx = await endpoint.setConfig(contractAddress, SEND_LIB, execConfig);
        console.log("Executor config tx:", execTx.hash);
        await execTx.wait();
        console.log("✅ Executor config set successfully");
        
        console.log("\n🔧 Configuring Receive ULN Config...");
        
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
        
        const receiveConfig = {
            eid: SOLANA_EID,
            configType: 2, // ULN_CONFIG_TYPE
            config: receiveUlnConfig
        };
        
        console.log("Setting receive ULN config...");
        const receiveTx = await endpoint.setConfig(contractAddress, RECEIVE_LIB, receiveConfig);
        console.log("Receive config tx:", receiveTx.hash);
        await receiveTx.wait();
        console.log("✅ Receive ULN config set successfully");
        
        console.log("\n🎉 All LayerZero configurations completed!");
        console.log("Now testing quote function...");
        
        // Test the quote function again
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
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
