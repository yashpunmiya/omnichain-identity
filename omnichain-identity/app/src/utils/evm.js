import { ethers } from 'ethers';

// OmnichainIdentityLinker Contract ABI
const identityLinkerABI = [
  "function linkAddress(bytes memory _solanaAddress, bytes32 _dstAddress) external payable",
  "function getLinkedAddresses(address _evmAddress) external view returns (bytes[] memory)"
];

// Mock DAO Token ABI
const daoTokenABI = [
  "function balanceOf(address account) external view returns (uint256)"
];

// Network specific contract addresses (replace with your deployed contract addresses)
const CONTRACT_ADDRESSES = {
  // Ethereum (testnet)
  1: "0xEthereumContractAddress",
  // Polygon (testnet)
  137: "0xPolygonContractAddress",
  // BSC (testnet)
  56: "0xBscContractAddress"
};

// Mock DAO Token Address
const DAO_TOKEN_ADDRESS = "0xYourDAOTokenAddress";

/**
 * Send a message through LayerZero from EVM to Solana
 * @param {Object} payload - Message payload containing wallet info
 * @returns {Promise<string>} Transaction hash
 */
export const sendLayerZeroMessage = async (payload) => {
  try {
    if (!window.ethereum) {
      throw new Error("Ethereum provider not found. Please install MetaMask.");
    }
    
    // Connect to provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Get current chain ID
    const { chainId } = await provider.getNetwork();
    
    // Get contract address for current chain
    const contractAddress = CONTRACT_ADDRESSES[chainId];
    if (!contractAddress) {
      throw new Error(`Unsupported network: ${chainId}. Please switch to Ethereum, Polygon, or BSC.`);
    }
    
    // Initialize contract
    const contract = new ethers.Contract(contractAddress, identityLinkerABI, signer);
    
    // Convert Solana address to bytes
    const solanaAddressBytes = ethers.toUtf8Bytes(payload.solanaAddress);
    
    // Destination Solana app address (your deployed Solana program ID)
    // This should be updated with your actual Solana program ID after deployment
    const destinationAddress = ethers.zeroPadValue("0x11111111111111111111111111111111", 32);
    
    // Estimate gas fee (this is just an example, adjust as needed)
    const estimatedFee = ethers.parseEther("0.01");
    
    // Send transaction
    const tx = await contract.linkAddress(
      solanaAddressBytes,
      destinationAddress,
      { value: estimatedFee }
    );
    
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error("Error sending LayerZero message:", error);
    throw error;
  }
};

/**
 * Check DAO token balance for an EVM address
 * @param {string} address - EVM address to check
 * @returns {Promise<string>} Token balance
 */
export const checkEvmBalance = async (address) => {
  try {
    // In a real implementation, you would use a production RPC URL
    // This is just a placeholder for the demo
    const provider = new ethers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/demo");
    
    // For the demo, we'll simulate a balance
    // In production, you would query the actual token contract
    
    // Uncomment this to use a real contract:
    // const daoToken = new ethers.Contract(DAO_TOKEN_ADDRESS, daoTokenABI, provider);
    // const balance = await daoToken.balanceOf(address);
    // return ethers.formatEther(balance);
    
    // For demo, generate a random balance between 0 and 200
    const mockBalance = Math.floor(Math.random() * 200);
    return mockBalance.toString();
  } catch (error) {
    console.error("Error checking EVM balance:", error);
    return "0";
  }
};
