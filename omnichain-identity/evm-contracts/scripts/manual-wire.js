const hre = require("hardhat");

async function main() {
  console.log("🔧 Manual LayerZero V2 Configuration...");
  
  const EVM_CONTRACT_ADDRESS = "0x429B3fc57dD1000eBd6eC9A77e7f3E0ABdD252fa";
  
  // LayerZero V2 configurations for Sepolia Testnet
  const LZ_ENDPOINT = "0x6EDCE65403992e310A62460808c4b910D972f10f";
  const SEND_LIB = "0xcc1ae8Cf5D3904Cef3360A9532B477529b177cCE";
  const RECEIVE_LIB = "0xdAf00F5eE2158dD58E0d3857851c432E34A3A851";
  const DVN_ADDRESS = "0x8eebf8b423B73bFCa51a1Db4B7354AA0bFCA9193"; // LayerZero Labs DVN
  const EXECUTOR_ADDRESS = "0x718B92b5CB0a5552039B593faF724D182A881eDA";
  
  const SOLANA_EID = 40168;
  
  const [signer] = await hre.ethers.getSigners();
  console.log(`Using signer: ${signer.address}`);
  
  try {
    // Get LayerZero Endpoint contract
    const endpointABI = [
      "function setSendLibrary(address oapp, uint32 eid, address sendLib) external",
      "function setReceiveLibrary(address oapp, uint32 eid, address receiveLib, uint256 gracePeriod) external",
      "function setSendUlnConfig(address oapp, uint32 eid, tuple(uint256 confirmations, uint8 requiredDVNCount, uint8 optionalDVNCount, uint8 optionalDVNThreshold, address[] requiredDVNs, address[] optionalDVNs) config) external",
      "function setReceiveUlnConfig(address oapp, uint32 eid, tuple(uint256 confirmations, uint8 requiredDVNCount, uint8 optionalDVNCount, uint8 optionalDVNThreshold, address[] requiredDVNs, address[] optionalDVNs) config) external"
    ];
    
    const endpoint = new hre.ethers.Contract(LZ_ENDPOINT, endpointABI, signer);
    
    // Check if sender is the owner/delegate of the OApp
    const oappABI = [
      "function owner() view returns (address)",
      "function delegates(address) view returns (bool)"
    ];
    
    const oapp = new hre.ethers.Contract(EVM_CONTRACT_ADDRESS, oappABI, signer);
    
    try {
      const owner = await oapp.owner();
      console.log(`OApp owner: ${owner}`);
      console.log(`Signer: ${signer.address}`);
      
      if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.log("⚠️  Warning: Signer is not the owner. Checking delegate status...");
        const isDelegate = await oapp.delegates(signer.address);
        console.log(`Is delegate: ${isDelegate}`);
        
        if (!isDelegate) {
          console.log("❌ Error: Signer is neither owner nor delegate. Configuration will fail.");
          return;
        }
      }
    } catch (error) {
      console.log("⚠️  Could not verify ownership. Proceeding anyway...");
    }
    
    console.log("\n📚 Step 1: Setting Send Library...");
    const setSendLibTx = await endpoint.setSendLibrary(EVM_CONTRACT_ADDRESS, SOLANA_EID, SEND_LIB);
    console.log(`Transaction: ${setSendLibTx.hash}`);
    await setSendLibTx.wait();
    console.log("✅ Send library set!");
    
    console.log("\n📖 Step 2: Setting Receive Library...");
    const setReceiveLibTx = await endpoint.setReceiveLibrary(EVM_CONTRACT_ADDRESS, SOLANA_EID, RECEIVE_LIB, 0);
    console.log(`Transaction: ${setReceiveLibTx.hash}`);
    await setReceiveLibTx.wait();
    console.log("✅ Receive library set!");
    
    console.log("\n🔐 Step 3: Setting Send ULN Config...");
    const sendUlnConfig = {
      confirmations: 1,
      requiredDVNCount: 1,
      optionalDVNCount: 0,
      optionalDVNThreshold: 0,
      requiredDVNs: [DVN_ADDRESS],
      optionalDVNs: []
    };
    
    const setSendUlnTx = await endpoint.setSendUlnConfig(EVM_CONTRACT_ADDRESS, SOLANA_EID, sendUlnConfig);
    console.log(`Transaction: ${setSendUlnTx.hash}`);
    await setSendUlnTx.wait();
    console.log("✅ Send ULN config set!");
    
    console.log("\n🔓 Step 4: Setting Receive ULN Config...");
    const receiveUlnConfig = {
      confirmations: 32, // More confirmations for Solana
      requiredDVNCount: 1,
      optionalDVNCount: 0,
      optionalDVNThreshold: 0,
      requiredDVNs: [DVN_ADDRESS],
      optionalDVNs: []
    };
    
    const setReceiveUlnTx = await endpoint.setReceiveUlnConfig(EVM_CONTRACT_ADDRESS, SOLANA_EID, receiveUlnConfig);
    console.log(`Transaction: ${setReceiveUlnTx.hash}`);
    await setReceiveUlnTx.wait();
    console.log("✅ Receive ULN config set!");
    
    console.log("\n🎉 LayerZero V2 configuration completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`- Peer set: Solana (EID: ${SOLANA_EID})`);
    console.log(`- Send Library: ${SEND_LIB}`);
    console.log(`- Receive Library: ${RECEIVE_LIB}`);
    console.log(`- DVN: ${DVN_ADDRESS} (LayerZero Labs)`);
    console.log(`- Send confirmations: 1`);
    console.log(`- Receive confirmations: 32`);
    
    console.log("\n⚡ Next Steps:");
    console.log("1. Configure Solana side peer settings");
    console.log("2. Test cross-chain message");
    console.log("3. Monitor LayerZero scan for DELIVERED status");
    
  } catch (error) {
    console.error("❌ Configuration failed:", error);
    console.log("\n🔍 Possible issues:");
    console.log("- Insufficient gas");
    console.log("- Not authorized (not owner/delegate)");
    console.log("- Network issues");
    console.log("- Invalid addresses");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
