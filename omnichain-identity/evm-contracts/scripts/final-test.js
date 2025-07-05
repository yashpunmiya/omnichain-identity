// Final test script for cross-chain messaging
const { ethers } = require("ethers");
require('dotenv').config();

async function main() {
  console.log("🧪 Final Cross-Chain Test...");

  // Set up provider and signer
  const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log(`Using signer: ${signer.address}`);
  
  // Contract ABI
  const contractABI = [
    "function SOLANA_CHAIN_ID() external view returns (uint32)",
    "function peers(uint32 _eid) external view returns (bytes32)",
    "function linkAddress(string memory _solanaAddress) external payable",
    "function endpoint() external view returns (address)"
  ];
  
  const contractAddress = process.env.IDENTITY_LINKER_ADDRESS;
  const contract = new ethers.Contract(contractAddress, contractABI, signer);
  
  console.log(`Contract address: ${contractAddress}`);
  
  try {
    // Check basic contract info
    const solanaChainId = await contract.SOLANA_CHAIN_ID();
    console.log(`Solana Chain ID: ${solanaChainId}`);
    
    const peer = await contract.peers(solanaChainId);
    console.log(`Peer for Solana: ${peer}`);
    
    const endpoint = await contract.endpoint();
    console.log(`LayerZero Endpoint: ${endpoint}`);
    
    if (peer === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      console.log("❌ No peer set for Solana chain");
      return;
    }
    
    // Check signer balance
    const balance = await provider.getBalance(signer.address);
    console.log(`💳 Signer balance: ${ethers.formatEther(balance)} ETH`);
    
    // Try to send message with a fixed fee
    const testSolanaAddress = "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH";
    const fixedFee = ethers.parseEther("0.01");
    
    if (balance > fixedFee) {
      console.log("📤 Sending cross-chain message...");
      const tx = await contract.linkAddress(testSolanaAddress, { value: fixedFee });
      console.log(`Transaction hash: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      console.log(`Gas used: ${receipt.gasUsed.toString()}`);
      
      console.log("🎉 SUCCESS! Cross-chain message sent successfully!");
      
    } else {
      console.log("❌ Insufficient balance for sending message");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

main().catch(console.error);
