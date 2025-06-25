# Omnichain Identity Linker - Implementation Details

## Overview

The Omnichain Identity Linker is a cross-chain identity system that allows users to link their EVM-based blockchain addresses (Ethereum, Polygon, BSC) with their Solana wallets using LayerZero's omnichain messaging protocol.

## Key Components

### 1. Solana Program Architecture

The Solana program is built on the LayerZero OApp architecture and consists of:

#### Identity Account Structure
- `IdentityAccount` - A Program Derived Address (PDA) that stores linked addresses for a Solana wallet
  - `authority: Pubkey` - The Solana wallet owner
  - `linked_addresses: Vec<String>` - List of linked EVM addresses (0x format)
  - `bump: u8` - The canonical bump for the PDA

#### Program Instructions
- `init_identity` - Creates a new IdentityAccount PDA for a Solana wallet
- `add_linked_address` - Manually adds a linked EVM address to an existing IdentityAccount
- `get_linked_addresses` - Retrieves the list of linked addresses for a Solana wallet
- `is_address_linked` - Checks if a specific EVM address is linked to a Solana wallet
- `lz_receive` - Processes cross-chain messages from LayerZero including identity linking messages

#### Message Format
- Identity messages follow a CSV-like format: `"evmAddress,solanaAddress,timestamp"`
- Example: `"0x1234...5678,8ZKTGzy...C2D,1683724800"`

### 2. EVM Contract

The EVM contract (`OmnichainIdentityLinker.sol`) is responsible for:

1. Accepting link requests from EVM wallets
2. Formatting and sending identity messages via LayerZero
3. Storing local history of linked addresses for reference
4. Providing utility functions to check linked addresses

### 3. Frontend Integration

The frontend application provides:

1. Wallet connection for both Solana and EVM chains
2. User interface for linking addresses
3. Verification of linked identities
4. Utility functions for interacting with both the Solana program and EVM contract

## Message Flow

1. User connects both EVM and Solana wallets to the frontend
2. User initiates a link request from the EVM wallet
3. The EVM contract formats the identity message and sends it via LayerZero
4. The Solana program receives the message through `lz_receive`
5. The program either:
   - Updates an existing identity account
   - Logs that an identity account needs to be created
6. User can verify the linked addresses on the frontend

## Security Considerations

1. Only the wallet owner can initialize an identity account
2. Cross-chain messages are verified through LayerZero's security model
3. The identity account can only be modified by the owner or through verified LayerZero messages
4. Message format validation prevents malformed data

## Testing and Verification

1. Local development using Anchor and Hardhat
2. Layer Zero Testnet deployment for cross-chain testing
3. Verification using LayerZeroScan explorer
