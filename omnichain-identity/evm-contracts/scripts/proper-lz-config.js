// Proper LayerZero V2 configuration script based on official documentation
const { ethers } = require("ethers");
require('dotenv').config();

async function main() {
  console.log("🔧 Configuring LayerZero V2 DVN and Executor (Official Method)...");

  // Set up provider and signer
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log(`Using signer: ${signer.address}`);
  
  // LayerZero V2 Sepolia addresses from documentation
  const ENDPOINT = "0x6EDCE65403992e310A62460808c4b910D972f10f";
  const SEND_USTORE = "0xcc1ae8Cf5D3904Cef3360A9532B477529b177cCE"; 
  const RECEIVE_USTORE = "0xdAf00F5eE2158dD58E0d3857851c432E34A3A851";
  
  // DVN and Executor addresses for Sepolia from documentation
  const DVN_ADDRESS = "0x8eebf8b423B73bFCa51a1Db4B7354AA0bFCA9193"; // Sepolia DVN
  const EXECUTOR_ADDRESS = "0x718B92b5CB0a5552039B593faF724D182A881eDA"; // Sepolia Executor
  
  const contractAddress = process.env.IDENTITY_LINKER_ADDRESS;
  const SOLANA_EID = 40168;
  
  console.log(`Contract: ${contractAddress}`);
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Solana EID: ${SOLANA_EID}`);
  
  // Endpoint ABI for configuration
  const endpointABI = [
    "function setSendLibrary(address _oapp, uint32 _eid, address _newLib) external",
    "function setReceiveLibrary(address _oapp, uint32 _eid, address _newLib, uint256 _gracePeriod) external",
    "function setConfig(address _oapp, address _lib, tuple(uint32 eid, uint32 configType, bytes config)[] _setConfigParams) external"
  ];
  
  // Contract ABI for delegate check
  const contractABI = [
    "function owner() external view returns (address)",
    "function delegate() external view returns (address)"
  ];
  
  const endpoint = new ethers.Contract(ENDPOINT, endpointABI, signer);
  const contract = new ethers.Contract(contractAddress, contractABI, signer);
  
  try {
    // Check if signer is authorized
    const owner = await contract.owner();
    console.log(`Contract owner: ${owner}`);
    
    let delegate;
    try {
      delegate = await contract.delegate();
      console.log(`Contract delegate: ${delegate}`);
    } catch (e) {
      console.log("No delegate set");
    }
    
    const isAuthorized = (signer.address.toLowerCase() === owner.toLowerCase()) || 
                        (delegate && signer.address.toLowerCase() === delegate.toLowerCase());
    
    if (!isAuthorized) {
      console.log(`❌ Signer ${signer.address} is not authorized (owner: ${owner}, delegate: ${delegate})`);
      return;
    }
    
    console.log("✅ Signer is authorized to configure");
    
    // Step 1: Set Send Library
    console.log("📋 Step 1: Setting Send Library...");
    try {
      const setSendTx = await endpoint.setSendLibrary(contractAddress, SOLANA_EID, SEND_USTORE, {
        gasLimit: 200000
      });
      await setSendTx.wait();
      console.log("✅ Send library set successfully");
    } catch (error) {
      console.log("❌ Send library setting failed:", error.message);
    }
    
    // Step 2: Set Receive Library 
    console.log("📋 Step 2: Setting Receive Library...");
    try {
      const setReceiveTx = await endpoint.setReceiveLibrary(contractAddress, SOLANA_EID, RECEIVE_USTORE, 0, {
        gasLimit: 200000
      });
      await setReceiveTx.wait();
      console.log("✅ Receive library set successfully");
    } catch (error) {
      console.log("❌ Receive library setting failed:", error.message);
    }
    
    // Step 3: Configure DVN and Executor
    console.log("📋 Step 3: Configuring DVN and Executor...");
    
    // Configuration for ULN (Ultra Light Node)
    // Config Type 2 = ULN Config
    const ulnConfig = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint64", "uint8", "uint8", "uint8", "address[]", "address[]"],
      [
        1, // confirmations
        1, // requiredDVNCount  
        0, // optionalDVNCount
        0, // optionalDVNThreshold
        [DVN_ADDRESS], // requiredDVNs
        [] // optionalDVNs
      ]
    );
    
    // Config Type 1 = Executor Config
    const executorConfig = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint32", "address"],
      [
        200000, // maxMessageSize
        EXECUTOR_ADDRESS // executor
      ]
    );
    
    const setConfigParams = [
      {
        eid: SOLANA_EID,
        configType: 2, // ULN_CONFIG_TYPE
        config: ulnConfig
      },
      {
        eid: SOLANA_EID, 
        configType: 1, // EXECUTOR_CONFIG_TYPE
        config: executorConfig
      }
    ];
    
    try {
      const setConfigTx = await endpoint.setConfig(contractAddress, SEND_USTORE, setConfigParams, {
        gasLimit: 500000
      });
      await setConfigTx.wait();
      console.log("✅ DVN and Executor configuration set successfully");
    } catch (error) {
      console.log("❌ Configuration failed:", error.message);
      if (error.data) {
        console.log("Error data:", error.data);
      }
    }
    
    console.log("🎉 LayerZero V2 configuration completed!");
    console.log("🧪 Now try running the cross-chain message test again");
    
  } catch (error) {
    console.error("❌ Configuration error:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

main().catch(console.error);
