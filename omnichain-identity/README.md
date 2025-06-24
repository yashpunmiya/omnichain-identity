# Omnichain Identity Linker

An omnichain identity system that links EVM addresses with Solana wallets using LayerZero V2.

## Overview

This project enables users to link their EVM-based blockchain wallets (Ethereum, Polygon, BSC) with their Solana wallets on-chain via LayerZero V2's omnichain messaging. The Solana program stores these linked addresses inside a Solana PDA (Program Derived Address) account, forming a decentralized identity registry. DAOs, DeFi platforms, games, or NFT marketplaces can query this identity registry to verify linked wallets and assign cross-chain perks or permissions.

## Project Structure

```
omnichain-identity/
├── programs/                    # Solana programs (Anchor-based)
│   └── identity-linker/         # Identity linking Solana program
├── app/                         # Frontend React application
│   └── src/                     # Frontend source code
├── Anchor.toml                  # Anchor configuration
└── README.md                    # Project documentation
```

## Supported Chains

### EVM Chains:
- Ethereum
- Polygon
- Binance Smart Chain (BSC)

### Non-EVM Chains:
- Solana

## Prerequisites

- Node.js
- Rust and Cargo
- Solana CLI tools
- Anchor Framework
- An EVM wallet (e.g., MetaMask)
- A Solana wallet (e.g., Phantom)

## Installation and Deployment Guide

### Windows Setup for Solana Development

#### 1. Install Rust and Cargo
```powershell
# Install Rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# Add cargo to the PATH (restart terminal after this)
rustup component add rustc-x86_64-pc-windows-msvc
```

#### 2. Install Solana CLI
```powershell
# Create a temporary directory for the installer
$tmpDir = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }
# Download installer
Invoke-WebRequest -Uri https://release.solana.com/v1.16.0/solana-install-init-x86_64-pc-windows-msvc.exe -OutFile "$tmpDir/solana-install-init.exe"
# Run the installer
& "$tmpDir/solana-install-init.exe" v1.16.0
# Remove temporary directory
Remove-Item -Recurse -Force $tmpDir
# Restart your terminal
```

#### 3. Install Anchor Framework
```powershell
# Install via npm globally
npm install -g @project-serum/anchor-cli
# Verify the installation
anchor --version
```

#### 4. Generate a Solana Wallet
```powershell
# Generate a new Solana keypair
solana-keygen new --outfile ~/.config/solana/id.json
# Check your public key
solana address
```

#### 5. Fund Your Wallet (Solana Devnet)
```powershell
# Set your cluster to devnet
solana config set --url https://api.devnet.solana.com
# Request an airdrop
solana airdrop 2
```

### Solana Program Deployment

#### 1. Build the Program
```powershell
cd omnichain-identity
anchor build
```

#### 2. Get the Program ID
```powershell
# Read the Program ID
solana address -k ./target/deploy/identity_linker-keypair.json
```

#### 3. Update Program ID in Code

Update the program ID in the following files:
- `programs/identity-linker/src/lib.rs` (replace the `declare_id!` value)
- `Anchor.toml` (update the program ID in the `[programs]` section)

```powershell
# After updating the program ID, build the program again
anchor build
```

#### 4. Deploy to Solana Devnet
```powershell
anchor deploy --provider.cluster devnet
```

### EVM Contract Deployment

#### 1. Set Up Environment
```powershell
cd evm-contracts
# Create .env file and add your configuration
copy .env.example .env
# Edit the .env file with your private key and RPC URLs
```

#### 2. Install Dependencies
```powershell
npm install
```

#### 3. Compile Contracts
```powershell
npx hardhat compile
```

#### 4. Deploy to Each EVM Chain
```powershell
# Deploy to Ethereum Testnet (Goerli)
npx hardhat run scripts/deploy.js --network ethereum
# Deploy to Polygon Testnet (Mumbai)
npx hardhat run scripts/deploy.js --network polygon
# Deploy to BSC Testnet
npx hardhat run scripts/deploy.js --network bsc
```

#### 5. Update Contract Addresses
Take note of the deployed contract addresses and update them in:
- `app/src/utils/evm.js` (update the `CONTRACT_ADDRESSES` object)

### Frontend Setup

#### 1. Install Dependencies
```powershell
cd app
npm install
```

#### 2. Configure Frontend
Create a `.env.local` file in the `app` directory:
```
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_SOLANA_PROGRAM_ID=your_deployed_program_id_here
VITE_ETHEREUM_CONTRACT=your_ethereum_contract_address
VITE_POLYGON_CONTRACT=your_polygon_contract_address
VITE_BSC_CONTRACT=your_bsc_contract_address
```

#### 3. Start the Development Server
```powershell
npm run dev
```

#### 4. Build for Production
```powershell
npm run build
```

## Usage

1. Connect your EVM wallet (MetaMask, etc.)
2. Connect your Solana wallet (Phantom, etc.)
3. Link your identities using the UI
4. View your linked addresses in the Identity view
5. Test the DAO verification feature in the DAO tab

## License

MIT

## LayerZero V2 Integration Details

This project leverages LayerZero V2 to enable seamless cross-chain messaging between EVM chains and Solana. Here's how the integration works:

### 1. Solana OApp Implementation

The Solana program is implemented as a LayerZero OApp (Omnichain Application) using the LayerZero V2 Solana SDK. The program:

- Registers with the LayerZero endpoint on Solana
- Implements the `lz_receive` function to handle incoming messages from EVM chains
- Validates the source chain and address for security
- Processes the payload containing wallet linking information
- Updates or creates PDAs that store identity information

### 2. EVM Sender Contract

The `OmnichainIdentityLinker.sol` contract on EVM chains:

- Connects to the LayerZero endpoint
- Formats the payload with EVM address, Solana address, and timestamp
- Sends messages through LayerZero's `_lzSend` function to the Solana OApp
- Handles gas fees for message delivery

### 3. Cross-Chain Message Flow

1. User connects both wallets in the frontend
2. User signs a message with their EVM wallet to prove ownership
3. EVM contract sends a message to Solana through LayerZero
4. LayerZero relayer delivers the message to the Solana program
5. The Solana program receives and processes the message
6. The link is established in a Solana PDA

### 4. Verifying Successful Message Delivery

After linking wallets, you can:
- Check the transaction on [LayerZeroScan](https://layerzeroscan.com/)
- Query the Solana program for linked addresses
- Verify the EVM transaction hash

## Troubleshooting LayerZero Connections

If you encounter issues with LayerZero messaging:

1. Ensure both the EVM contract and Solana program are deployed correctly
2. Verify that sufficient funds are provided for LayerZero fees
3. Check that the Solana program ID matches the destination address configured in the EVM contract
4. Make sure the payload format matches what the receiver expects

## Acknowledgements

- LayerZero Labs for providing the cross-chain messaging protocol
- Solana Foundation for the blockchain platform and tools
