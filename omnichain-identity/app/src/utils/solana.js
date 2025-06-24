import { PublicKey, SystemProgram } from '@solana/web3.js';
import { Buffer } from 'buffer';

// Replace with your actual program ID after deployment
export const IDENTITY_PROGRAM_ID = new PublicKey('11111111111111111111111111111111');

/**
 * Get linked EVM addresses for a Solana public key
 * @param {Connection} connection - Solana connection
 * @param {PublicKey} solanaPublicKey - Solana public key
 * @returns {Promise<string[]>} Array of linked EVM addresses
 */
export const getLinkedAddresses = async (connection, solanaPublicKey) => {
  try {
    // Find the PDA address
    const [identityPDA] = await PublicKey.findProgramAddress(
      [Buffer.from('identity'), solanaPublicKey.toBuffer()],
      IDENTITY_PROGRAM_ID
    );
    
    // Get account info
    const accountInfo = await connection.getAccountInfo(identityPDA);
    
    // If account doesn't exist, return empty array
    if (!accountInfo) {
      return [];
    }
    
    // Deserialize the account data (this is a simplified version)
    // In a real implementation, you'd use a proper deserializer based on your account structure
    const data = accountInfo.data;
    
    // Skip the authority field (32 bytes) and read the vector of strings
    const linkedAddressesCount = data.readUInt32LE(32);
    
    const linkedAddresses = [];
    let offset = 36; // 32 (authority) + 4 (count)
    
    for (let i = 0; i < linkedAddressesCount; i++) {
      const length = data.readUInt32LE(offset);
      offset += 4;
      
      const address = data.slice(offset, offset + length).toString();
      linkedAddresses.push(address);
      
      offset += length;
    }
    
    return linkedAddresses;
  } catch (error) {
    console.error('Error getting linked addresses:', error);
    return [];
  }
};
