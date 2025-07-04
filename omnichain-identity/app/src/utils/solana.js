import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';

// Replace with your actual program ID after deployment
export const IDENTITY_PROGRAM_ID = new PublicKey('DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz');

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

/**
 * Initialize an identity account for a Solana wallet
 * @param {Connection} connection - Solana connection
 * @param {Wallet} wallet - Solana wallet
 * @returns {Promise<string>} Transaction signature
 */
export const initializeIdentityAccount = async (connection, wallet) => {
  try {
    // Find the PDA address
    const [identityPDA, bump] = await PublicKey.findProgramAddress(
      [Buffer.from('identity'), wallet.publicKey.toBuffer()],
      IDENTITY_PROGRAM_ID
    );
    
    // Create the instruction
    const instruction = {
      keys: [
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: identityPDA, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: IDENTITY_PROGRAM_ID,
      data: Buffer.from([
        0, // Method index for init_identity
        bump, // Bump seed
      ]),
    };
    
    // Create and sign transaction
    const transaction = new Transaction().add(instruction);
    const signature = await wallet.sendTransaction(transaction, connection);
    
    // Confirm transaction
    await connection.confirmTransaction(signature);
    
    return signature;
  } catch (error) {
    console.error('Error initializing identity account:', error);
    throw error;
  }
};

/**
 * Add a linked EVM address to a Solana wallet
 * @param {Connection} connection - Solana connection
 * @param {Wallet} wallet - Solana wallet
 * @param {string} evmAddress - EVM address to link
 * @returns {Promise<string>} Transaction signature
 */
export const addLinkedAddress = async (connection, wallet, evmAddress) => {
  try {
    // Find the PDA address
    const [identityPDA, bump] = await PublicKey.findProgramAddress(
      [Buffer.from('identity'), wallet.publicKey.toBuffer()],
      IDENTITY_PROGRAM_ID
    );
    
    // Encode the EVM address
    const evmAddressBuffer = Buffer.from(evmAddress);
    const data = Buffer.alloc(2 + evmAddressBuffer.length);
    data.writeUInt8(1, 0); // Method index for add_linked_address
    data.writeUInt8(evmAddressBuffer.length, 1);
    evmAddressBuffer.copy(data, 2);
    
    // Create the instruction
    const instruction = {
      keys: [
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: identityPDA, isSigner: false, isWritable: true },
      ],
      programId: IDENTITY_PROGRAM_ID,
      data,
    };
    
    // Create and sign transaction
    const transaction = new Transaction().add(instruction);
    const signature = await wallet.sendTransaction(transaction, connection);
    
    // Confirm transaction
    await connection.confirmTransaction(signature);
    
    return signature;
  } catch (error) {
    console.error('Error adding linked address:', error);
    throw error;
  }
};

/**
 * Check if an EVM address is linked to a Solana wallet
 * @param {Connection} connection - Solana connection
 * @param {PublicKey} solanaPublicKey - Solana public key
 * @param {string} evmAddress - EVM address to check
 * @returns {Promise<boolean>} Whether the address is linked
 */
export const isAddressLinked = async (connection, solanaPublicKey, evmAddress) => {
  try {
    const linkedAddresses = await getLinkedAddresses(connection, solanaPublicKey);
    return linkedAddresses.includes(evmAddress);
  } catch (error) {
    console.error('Error checking if address is linked:', error);
    return false;
  }
};
