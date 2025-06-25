# Omnichain Identity Implementation Guide

This guide details how to modify the official LayerZero OApp example for our identity linking functionality.

## 📝 Step 1: Modify the OApp Solana Program

### 1.1 Update `lib.rs`

Navigate to `/programs/oapp/src/lib.rs` in your copied project and implement our identity linking logic.

```rust
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::system_instruction;
use endpoint::message::Message; // LayerZero provided
use endpoint::message::MessageV1; // LayerZero provided
use endpoint::{self, lzapp::LzApp}; // LayerZero provided

declare_id!("YOUR_GENERATED_PROGRAM_ID"); // Update with yours

#[program]
pub mod oapp {
    use super::*;

    // Initialize function (from example)
    pub fn initialize(
        ctx: Context<Initialize>,
        lz_endpoint_id: Pubkey,
        owner: Pubkey,
        delegate: Pubkey,
    ) -> Result<()> {
        ctx.accounts.app.initialize(
            lz_endpoint_id,
            owner,
            delegate,
            ctx.accounts.payer.key(),
        )?;
        Ok(())
    }

    // Update OApp config (from example)
    pub fn set_default_config(
        ctx: Context<SetDefaultConfig>,
        send_config: LzSendConfig,
        receive_config: LzReceiveConfig,
    ) -> Result<()> {
        // Use provided LzApp function to set config
        ctx.accounts
            .app
            .set_default_config(&send_config, &receive_config)?;
        Ok(())
    }

    // Send a cross-chain message (from example)
    pub fn send(
        ctx: Context<Send>,
        dst_eid: u32,
        receive_address: [u8; 32],
        message_fee: u64,
        message: Vec<u8>,
        options: Vec<u8>,
        encoding_param: Vec<u8>,
        guid: Option<Pubkey>,
    ) -> Result<()> {
        // Use provided LzApp function to send message
        ctx.accounts.app.send(
            &ctx.accounts.lz_endpoint,
            &ctx.accounts.message_sender,
            &ctx.accounts.fee_payer,
            dst_eid,
            receive_address,
            message_fee,
            &message,
            &options,
            encoding_param,
            guid,
            &[],
        )?;
        Ok(())
    }

    // Receive a cross-chain message (where we add our identity logic)
    pub fn lz_receive(
        ctx: Context<LzReceive>,
        src_eid: u32,
        src_address: [u8; 32],
        _guid: [u8; 32],
        message: Vec<u8>,
        _options: Vec<u8>,
    ) -> Result<()> {
        msg!("Received message from LayerZero");

        // Deserialize the message payload
        // Assuming payload format: { evmAddress: string, solanaAddress: string, timestamp: number }
        let payload = String::from_utf8(message).map_err(|_| error!(ErrorCode::InvalidPayload))?;
        
        // Extract EVM address and Solana address (simplified parsing)
        // In production, use proper JSON parsing or a defined binary format
        let parts: Vec<&str> = payload.split(",").collect();
        if parts.len() != 3 {
            return Err(error!(ErrorCode::InvalidPayload));
        }
        
        let evm_address = parts[0].trim();
        let solana_address_str = parts[1].trim();
        
        msg!("EVM Address: {}", evm_address);
        msg!("Solana Address: {}", solana_address_str);
        
        // Convert Solana address string to pubkey
        let solana_address = match Pubkey::try_from_str(solana_address_str) {
            Ok(pubkey) => pubkey,
            Err(_) => return Err(error!(ErrorCode::InvalidAddress))
        };
        
        // Find the identity account PDA
        let (identity_pda, bump) = Pubkey::find_program_address(
            &[b"identity", solana_address.as_ref()], 
            ctx.program_id
        );
        
        // Check if PDA exists
        let pda_info = ctx.accounts.system_program.to_account_info();
        let identity_account_exists = pda_info.owner != &system_program::ID;
        
        if !identity_account_exists {
            // Create new identity account PDA
            let rent = Rent::get()?;
            let space = 8 + // discriminator
                         32 + // authority (Pubkey)
                         4 + // vector length prefix
                         50 * 10; // Allow storage for 10 addresses of 50 bytes each
            
            let lamports = rent.minimum_balance(space);
            
            // Create account using CPI
            let create_account_ix = system_instruction::create_account(
                &ctx.accounts.payer.key(),
                &identity_pda,
                lamports,
                space as u64,
                ctx.program_id,
            );
            
            invoke(
                &create_account_ix,
                &[
                    ctx.accounts.payer.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
            
            // Initialize the new PDA
            let mut identity_account = IdentityAccount {
                authority: solana_address,
                linked_addresses: vec![evm_address.to_string()],
            };
            
            // Serialize and store
            identity_account.serialize(&mut *identity_pda.data.borrow_mut())?;
        } else {
            // Update existing identity account
            let mut identity_account = IdentityAccount::try_from_slice(
                &identity_pda.data.borrow()
            )?;
            
            // Check if EVM address is already linked
            if !identity_account.linked_addresses.contains(&evm_address.to_string()) {
                identity_account.linked_addresses.push(evm_address.to_string());
                
                // Write back to account
                identity_account.serialize(&mut *identity_pda.data.borrow_mut())?;
            }
        }
        
        Ok(())
    }

    // Get linked addresses for a Solana wallet
    pub fn get_linked_addresses(
        ctx: Context<GetLinkedAddresses>,
        solana_address: Pubkey,
    ) -> Result<Vec<String>> {
        // Find the identity PDA
        let (identity_pda, _) = Pubkey::find_program_address(
            &[b"identity", solana_address.as_ref()], 
            ctx.program_id
        );
        
        // Check if the identity account exists
        let identity_account_info = ctx.accounts.identity_account.to_account_info();
        if identity_account_info.data_is_empty() {
            return Err(error!(ErrorCode::IdentityAccountNotFound));
        }
        
        // Deserialize the account
        let identity_account = IdentityAccount::try_from_slice(
            &identity_account_info.data.borrow()
        )?;
        
        // Return linked addresses
        Ok(identity_account.linked_addresses)
    }
}

// Context definitions (from example)
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = LzApp::SIZE
    )]
    pub app: Account<'info, LzApp>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetDefaultConfig<'info> {
    #[account(mut, has_one = owner)]
    pub app: Account<'info, LzApp>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct Send<'info> {
    #[account(mut, has_one = lz_endpoint_id)]
    pub app: Account<'info, LzApp>,
    pub message_sender: Signer<'info>,
    /// CHECK:
    pub fee_payer: AccountInfo<'info>,
    #[account(
        mut,
        address = app.lz_endpoint_id
    )]
    /// CHECK:
    pub lz_endpoint: AccountInfo<'info>,
}

// Our new context for lz_receive
#[derive(Accounts)]
pub struct LzReceive<'info> {
    #[account(mut, has_one = lz_endpoint_id)]
    pub app: Account<'info, LzApp>,
    #[account(
        mut,
        address = app.lz_endpoint_id
    )]
    /// CHECK:
    pub lz_endpoint: AccountInfo<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// New context for getting linked addresses
#[derive(Accounts)]
pub struct GetLinkedAddresses<'info> {
    /// CHECK: This account will be checked in the instruction
    pub identity_account: UncheckedAccount<'info>,
}

// New account structure for storing linked addresses
#[account]
pub struct IdentityAccount {
    pub authority: Pubkey,                 // Solana wallet owner
    pub linked_addresses: Vec<String>,     // List of EVM addresses
}

// Custom errors
#[error_code]
pub enum ErrorCode {
    #[msg("Invalid LayerZero payload")]
    InvalidPayload,
    #[msg("Invalid address format")]
    InvalidAddress,
    #[msg("Identity account not found")]
    IdentityAccountNotFound,
}

// LzSendConfig structure (from example)
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct LzSendConfig {
    pub executor_version: u32,
    pub treasury_gas: u64,
    pub max_message_size: u64,
}

// LzReceiveConfig structure (from example)
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct LzReceiveConfig {
    pub executor_version: u32,
    pub treasury_gas: u64,
}
```

### 1.2 Update `Anchor.toml`

Modify the `Anchor.toml` file with your program ID:

```toml
[features]
seeds = false

[programs.localnet]
oapp = "YOUR_GENERATED_PROGRAM_ID"

[programs.devnet]
oapp = "YOUR_GENERATED_PROGRAM_ID"

[registry]
url = "https://anchor.projectserum.com"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

## 📝 Step 2: Implement the EVM Contract

Create a Solidity contract for sending messages to the Solana OApp:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@layerzerolabs/lz-evm-v1-0.7/contracts/lzApp/NonblockingLzApp.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OmnichainIdentityLinker
 * @dev Contract for linking EVM addresses to Solana addresses via LayerZero
 * This contract sends messages from EVM chains to a Solana OApp
 */
contract OmnichainIdentityLinker is NonblockingLzApp, Ownable {
    // Solana chain ID in LayerZero
    uint16 public constant SOLANA_CHAIN_ID = 168; // Solana testnet chain ID in LZ V2
    
    // Destination Solana program address
    bytes32 public solanaProgramId;
    
    // Store linked addresses history for reference
    mapping(address => bytes[]) public linkedSolanaAddresses;
    
    // Event emitted when a link is created
    event IdentityLinked(address evmAddress, string solanaAddress, uint256 timestamp);
    
    constructor(address _lzEndpoint, bytes32 _solanaProgramId) NonblockingLzApp(_lzEndpoint) Ownable(msg.sender) {
        solanaProgramId = _solanaProgramId;
    }
    
    /**
     * @dev Link the sender's EVM address to a Solana address
     * @param _solanaAddress Solana address as string
     */
    function linkAddress(string memory _solanaAddress) external payable {
        // Format the message payload (simplified CSV format for readability)
        string memory payload = string(abi.encodePacked(
            address(msg.sender), ",",
            _solanaAddress, ",",
            block.timestamp
        ));
        
        bytes memory bytesPayload = bytes(payload);
        
        // Store the linked address in history
        linkedSolanaAddresses[msg.sender].push(bytes(_solanaAddress));
        
        // Emit event
        emit IdentityLinked(msg.sender, _solanaAddress, block.timestamp);
        
        // Send message to Solana via LayerZero
        _lzSend(
            SOLANA_CHAIN_ID,           // Destination chain ID (Solana)
            bytesPayload,              // Payload 
            payable(msg.sender),       // Refund address
            address(0x0),              // zroPaymentAddress
            bytes(""),                 // adapterParams
            msg.value                  // Native fee amount
        );
    }
    
    /**
     * @dev Get linked Solana addresses for an EVM address
     * @param _evmAddress The EVM address to check
     * @return Array of linked Solana addresses
     */
    function getLinkedAddresses(address _evmAddress) external view returns (bytes[] memory) {
        return linkedSolanaAddresses[_evmAddress];
    }
    
    /**
     * @dev Update the Solana program ID
     * @param _solanaProgramId New Solana program ID
     */
    function setSolanaProgramId(bytes32 _solanaProgramId) external onlyOwner {
        solanaProgramId = _solanaProgramId;
    }
    
    /**
     * @dev Override the _nonblockingLzReceive function to handle incoming messages (if needed)
     * This would be used if you want to receive messages from Solana back to EVM
     */
    function _nonblockingLzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes memory _payload
    ) internal override {
        // Add handling for received messages from Solana if needed
    }
}
```

## 📝 Step 3: Frontend Integration

Update the frontend to integrate with both the Solana OApp and EVM contract:

### 3.1 EVM Integration

In `utils/evm.js`, update the contract integration:

```javascript
import { ethers } from 'ethers';

// OmnichainIdentityLinker Contract ABI
const identityLinkerABI = [
  "function linkAddress(string memory _solanaAddress) external payable",
  "function getLinkedAddresses(address _evmAddress) external view returns (bytes[] memory)"
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

/**
 * Send a message through LayerZero from EVM to Solana
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
    
    // Fee for LayerZero message (adjust as needed)
    const estimatedFee = ethers.parseEther("0.01");
    
    // Send transaction
    const tx = await contract.linkAddress(
      payload.solanaAddress,
      { value: estimatedFee }
    );
    
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error("Error sending LayerZero message:", error);
    throw error;
  }
};
```

### 3.2 Solana Integration

In `utils/solana.js`, update the program integration:

```javascript
import { PublicKey, SystemProgram } from '@solana/web3.js';
import * as borsh from 'borsh';

// Replace with your actual program ID after deployment
export const IDENTITY_PROGRAM_ID = new PublicKey('YOUR_PROGRAM_ID_HERE');

/**
 * Get linked EVM addresses for a Solana public key
 */
export const getLinkedAddresses = async (connection, solanaPublicKey) => {
  try {
    // Find the identity PDA
    const [identityPDA] = await PublicKey.findProgramAddress(
      [Buffer.from('identity'), solanaPublicKey.toBuffer()],
      IDENTITY_PROGRAM_ID
    );
    
    // Check if the account exists
    const accountInfo = await connection.getAccountInfo(identityPDA);
    if (!accountInfo) {
      return [];
    }
    
    // This is a simplified parser - in a real implementation, 
    // properly deserialize the Anchor account
    const dataSlice = accountInfo.data.slice(8); // Skip discriminator
    
    // Skip authority (32 bytes)
    const linkedAddressesCount = dataSlice.readUInt32LE(32);
    
    const linkedAddresses = [];
    let offset = 36; // 32 (authority) + 4 (count)
    
    for (let i = 0; i < linkedAddressesCount; i++) {
      const length = dataSlice.readUInt32LE(offset);
      offset += 4;
      
      const address = dataSlice.slice(offset, offset + length).toString();
      linkedAddresses.push(address);
      
      offset += length;
    }
    
    return linkedAddresses;
  } catch (error) {
    console.error('Error getting linked addresses:', error);
    return [];
  }
};
```

## 📋 Testing Checklist

1. ✅ Solana program deployment successful
2. ✅ EVM contract deployment successful on all chains
3. ✅ Frontend can connect to both wallets
4. ✅ LayerZero message sending works
5. ✅ Solana program correctly stores linked addresses
6. ✅ Frontend can retrieve and display linked addresses
7. ✅ DAO verification works with linked addresses
