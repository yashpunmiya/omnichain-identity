# Omnichain Identity Linker - Deployment Guide for WSL

This guide covers the deployment of the Omnichain Identity Linker using WSL (Windows Subsystem for Linux).

## 🔧 Part 1: Solana Program Setup on WSL

### 📌 1️⃣ Clone the official LayerZero Solana devtools repo

```bash
git clone https://github.com/LayerZero-Labs/devtools.git
cd devtools/examples/oapp-solana
```

### 📌 2️⃣ Verify your development environment

```bash
# Check Anchor CLI
anchor --version

# Check Solana CLI
solana --version

# Verify your Solana wallet
solana address
```

### 📌 3️⃣ Build the example program as-is first

```bash
anchor build
```

This confirms your setup is working correctly with all dependencies.

### 📌 4️⃣ Create a new project based on this template

```bash
# Navigate back to your projects directory
cd ~/projects

# Create a new directory for your omnichain identity project
mkdir -p omnichain-identity
cp -r ~/devtools/examples/oapp-solana/* omnichain-identity/

# Enter the new project
cd omnichain-identity
```

### 📌 5️⃣ Modify the project for identity linking

1. Update project name in `Anchor.toml`
2. Modify `programs/oapp/src/lib.rs` with our identity linking code
3. Create the identity data structure for PDAs

### 📌 6️⃣ Build and deploy the modified program

```bash
# Build the program
anchor build

# Get program ID
solana address -k ./target/deploy/oapp-keypair.json

# Update program ID in code
# (Edit Anchor.toml and lib.rs with the new program ID)

# Build again with updated program ID
anchor build

# Deploy to Solana devnet
anchor deploy --provider.cluster devnet
```

### 📌 7️⃣ Verify deployment

```bash
# Check that your program is deployed
solana program show YOUR_PROGRAM_ID --url devnet
```

## 🔧 Part 2: EVM Contract Deployment

### 📌 1️⃣ Navigate to the EVM contracts directory

```bash
cd ~/projects/omnichain-identity/evm-contracts
```

### 📌 2️⃣ Install dependencies and set up environment

```bash
# Install dependencies
npm install

# Create and edit .env file
cp .env.example .env
# Edit .env with your private key and RPC URLs
```

### 📌 3️⃣ Compile Solidity contracts

```bash
npx hardhat compile
```

### 📌 4️⃣ Deploy to EVM testnets

```bash
# Deploy to Ethereum testnet (Goerli)
npx hardhat run scripts/deploy.js --network ethereum

# Deploy to Polygon testnet (Mumbai)
npx hardhat run scripts/deploy.js --network polygon

# Deploy to BSC testnet
npx hardhat run scripts/deploy.js --network bsc
```

Take note of the deployed addresses for each network.

## 🔧 Part 3: Frontend Setup

### 📌 1️⃣ Navigate to the frontend directory

```bash
cd ~/projects/omnichain-identity/app
```

### 📌 2️⃣ Install dependencies

```bash
npm install
```

### 📌 3️⃣ Configure environment with deployed addresses

```bash
# Create and edit environment file
cp .env.example .env.local
```

Update with:
- Your Solana program ID
- Deployed EVM contract addresses
- RPC URLs

### 📌 4️⃣ Run development server

```bash
npm run dev
```

Visit http://localhost:3000 to see your app running.

## 🧪 Part 4: Testing the Full Flow

1. Connect both Solana and EVM wallets in the UI
2. Link your wallets via the Identity Linker tab
3. Check LayerZeroScan for transaction status
4. Verify linked addresses in the DAO Verification tab
5. Create a demo video showing the complete flow for hackathon submission
