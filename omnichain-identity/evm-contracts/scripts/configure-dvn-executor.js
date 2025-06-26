const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    console.log("🔧 Configuring LayerZero V2 DVN and Executor for cross-chain messaging...");
    
    const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const contractAddress = process.env.IDENTITY_LINKER_ADDRESS;
    const endpointAddress = process.env.LZ_ETHEREUM_ENDPOINT;
    const solanaChainId = 40168; // Correct Solana Devnet EID
    
    console.log("Contract:", contractAddress);
    console.log("Endpoint:", endpointAddress);
    console.log("Solana Chain ID:", solanaChainId);
    console.log("Wallet:", wallet.address);
    
    // LayerZero V2 known addresses for Sepolia testnet (from documentation)
    const SEPOLIA_SEND_ULN = "0xcc1ae8Cf5D3904Cef3360A9532B477529b177cCE";
    const SEPOLIA_RECEIVE_ULN = "0xdAf00F5eE2158dD58E0d3857851c432E34A3A851";
    const SEPOLIA_DVN = "0x8eebf8b423B73bFCa51a1Db4B7354AA0bFCA9193"; // LayerZero Labs DVN
    const SEPOLIA_EXECUTOR = "0x718B92b5CB0a5552039B593faF724D182A881eDA"; // LayerZero Executor
    
    // LayerZero V2 configuration types
    const CONFIG_TYPE_EXECUTOR = 1;
    const CONFIG_TYPE_ULN_SEND = 2;
    const CONFIG_TYPE_ULN_RECEIVE = 3;
    
    // Endpoint ABI for configuration
    const endpointABI = [
        "function setSendLibrary(address oapp, uint32 eid, address lib) external",
        "function setReceiveLibrary(address oapp, uint32 eid, address lib, uint256 gracePeriod) external",
        "function setConfig(address oapp, address lib, tuple(uint32 eid, uint32 configType, bytes config)[] params) external",
        "function getSendLibrary(address sender, uint32 dstEid) external view returns (address lib)",
        "function getReceiveLibrary(address receiver, uint32 srcEid) external view returns (address lib, bool isDefault)"
    ];
    
    const endpoint = new ethers.Contract(endpointAddress, endpointABI, wallet);
    
    try {
        console.log("\n📋 Step 1: Setting up libraries...");
        
        // Set send library
        console.log("Setting send library to:", SEPOLIA_SEND_ULN);
        const setSendLibTx = await endpoint.setSendLibrary(contractAddress, solanaChainId, SEPOLIA_SEND_ULN, {
            gasLimit: 300000
        });
        await setSendLibTx.wait();
        console.log("✅ Send library set");
        
        // Set receive library
        console.log("Setting receive library to:", SEPOLIA_RECEIVE_ULN);
        const setReceiveLibTx = await endpoint.setReceiveLibrary(contractAddress, solanaChainId, SEPOLIA_RECEIVE_ULN, 0, {
            gasLimit: 300000
        });
        await setReceiveLibTx.wait();
        console.log("✅ Receive library set");
        
        console.log("\n📋 Step 2: Configuring DVN and Executor...");
        
        // Encode executor configuration (gas limit: 200k, executor address)
        const executorConfig = ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint32", "address"],
            [200000, SEPOLIA_EXECUTOR]
        );
        
        // Encode ULN configuration for sending (confirmations: 1, DVN required)
        const ulnSendConfig = ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint64", "uint8", "uint8", "uint8", "address[]", "address[]"],
            [
                1, // confirmations
                1, // requiredDVNCount
                0, // optionalDVNCount  
                0, // optionalDVNThreshold
                [SEPOLIA_DVN], // requiredDVNs
                [] // optionalDVNs
            ]
        );
        
        // Encode ULN configuration for receiving (confirmations: 2, DVN required)
        const ulnReceiveConfig = ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint64", "uint8", "uint8", "uint8", "address[]", "address[]"],
            [
                2, // confirmations
                1, // requiredDVNCount
                0, // optionalDVNCount
                0, // optionalDVNThreshold
                [SEPOLIA_DVN], // requiredDVNs
                [] // optionalDVNs
            ]
        );
        
        // Prepare configuration parameters
        const configParams = [
            {
                eid: solanaChainId,
                configType: CONFIG_TYPE_EXECUTOR,
                config: executorConfig
            },
            {
                eid: solanaChainId,
                configType: CONFIG_TYPE_ULN_SEND,
                config: ulnSendConfig
            },
            {
                eid: solanaChainId,
                configType: CONFIG_TYPE_ULN_RECEIVE,
                config: ulnReceiveConfig
            }
        ];
        
        console.log("Setting executor configuration...");
        console.log("- Gas limit: 200,000");
        console.log("- Executor:", SEPOLIA_EXECUTOR);
        console.log("- DVN:", SEPOLIA_DVN);
        console.log("- Send confirmations: 1");
        console.log("- Receive confirmations: 2");
        
        // Set the configuration for send library
        const configSendTx = await endpoint.setConfig(contractAddress, SEPOLIA_SEND_ULN, configParams, {
            gasLimit: 800000 // High gas limit for configuration
        });
        await configSendTx.wait();
        console.log("✅ Send library configuration set");
        
        // Set the configuration for receive library  
        const configReceiveTx = await endpoint.setConfig(contractAddress, SEPOLIA_RECEIVE_ULN, configParams, {
            gasLimit: 800000
        });
        await configReceiveTx.wait();
        console.log("✅ Receive library configuration set");
        
        console.log("\n📋 Step 3: Verifying configuration...");
        
        // Verify libraries are set
        const sendLib = await endpoint.getSendLibrary(contractAddress, solanaChainId);
        const [receiveLib, isDefault] = await endpoint.getReceiveLibrary(contractAddress, solanaChainId);
        
        console.log("Send library:", sendLib);
        console.log("Receive library:", receiveLib, "Is default:", isDefault);
        
        if (sendLib === SEPOLIA_SEND_ULN && receiveLib === SEPOLIA_RECEIVE_ULN) {
            console.log("✅ Libraries correctly configured!");
        } else {
            console.log("❌ Library configuration mismatch");
        }
        
        console.log("\n🎉 LayerZero V2 DVN/Executor configuration completed!");
        console.log("Your OApp should now be able to send cross-chain messages.");
        console.log("\nNext steps:");
        console.log("1. Test fee quote (should succeed now)");
        console.log("2. Send test message to Solana");
        console.log("3. Verify message received on Solana PDA");
        
    } catch (error) {
        console.error("❌ Configuration failed:", error.message);
        
        if (error.message.includes("revert")) {
            console.log("\n💡 Common issues:");
            console.log("- Check if wallet has enough ETH for gas");
            console.log("- Verify contract owner permissions");
            console.log("- Confirm endpoint and library addresses are correct");
        }
    }
}

main().catch(console.error);
