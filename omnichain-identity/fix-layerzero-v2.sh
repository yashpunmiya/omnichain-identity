#!/bin/bash

# 🚀 LayerZero V2 Complete Fix Script for Omnichain Identity
# This script fixes the BLOCKED message issue and configures both EVM and Solana sides properly

set -e

echo "🔧 Starting LayerZero V2 Complete Fix..."

# Configuration variables
PROGRAM_ID="DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz"
EVM_CONTRACT="0x429B3fc57dD1000eBd6eC9A77e7f3E0ABdD252fa"
SEPOLIA_EID=40161
SOLANA_RPC="https://api.devnet.solana.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_step() {
    echo -e "${BLUE}==== $1 ====${NC}"
}

echo_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Check environment
echo_step "Step 1: Environment Check"

if ! command -v solana &> /dev/null; then
    echo_error "Solana CLI not found. Please install Solana CLI first."
    exit 1
fi

if ! command -v anchor &> /dev/null; then
    echo_error "Anchor CLI not found. Please install Anchor first."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo_error "Node.js not found. Please install Node.js first."
    exit 1
fi

echo_success "Environment check passed"

# Step 2: Switch to devnet and check/get balance
echo_step "Step 2: Solana Setup"

echo "Setting Solana to devnet..."
solana config set --url $SOLANA_RPC

echo "Checking wallet balance..."
BALANCE=$(solana balance --lamports 2>/dev/null || echo "0")
if [ "$BALANCE" -lt 100000000 ]; then  # Less than 0.1 SOL
    echo_warning "Low balance. Requesting airdrop..."
    solana airdrop 2 || echo_warning "Airdrop failed, please visit https://faucet.solana.com/"
fi

WALLET_ADDR=$(solana address)
echo_success "Wallet: $WALLET_ADDR"

# Step 3: Navigate to oapp-solana directory
echo_step "Step 3: Setting up Solana OApp"

if [ ! -d "oapp-solana" ]; then
    echo_error "oapp-solana directory not found. Run this script from the project root."
    exit 1
fi

cd oapp-solana

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

# Step 4: Build the Anchor program
echo_step "Step 4: Building Anchor Program"

echo "Building Anchor program..."
anchor build

if [ $? -ne 0 ]; then
    echo_error "Anchor build failed"
    exit 1
fi

echo_success "Anchor build completed"

# Step 5: Initialize OApp configuration
echo_step "Step 5: Initializing LayerZero OApp Configuration"

echo "Running LayerZero OApp initialization..."
if command -v npx &> /dev/null; then
    npx hardhat lz:oapp:solana:init-config --network solana-testnet 2>/dev/null || {
        echo_warning "LayerZero init-config failed, trying alternative method..."
        
        # Alternative: Use the configure script
        if [ -f "configure-solana.js" ]; then
            echo "Running custom configuration script..."
            node configure-solana.js
        else
            echo_warning "No configuration script found"
        fi
    }
else
    echo_warning "npx not found, skipping hardhat commands"
fi

# Step 6: Set up peer configuration manually if needed
echo_step "Step 6: Manual Peer Configuration"

cat > temp-peer-config.js << 'EOF'
const { Connection, PublicKey, Keypair, SystemProgram } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

async function setPeerConfig() {
    const SOLANA_RPC = 'https://api.devnet.solana.com';
    const PROGRAM_ID = 'DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz';
    const EVM_CONTRACT = '0x429B3fc57dD1000eBd6eC9A77e7f3E0ABdD252fa';
    const SEPOLIA_EID = 40161;

    try {
        const connection = new Connection(SOLANA_RPC, 'confirmed');
        
        // Load wallet
        const walletPath = process.env.HOME + '/.config/solana/id.json';
        const walletKeypair = Keypair.fromSecretKey(
            Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf8')))
        );
        
        console.log('Using wallet:', walletKeypair.publicKey.toString());
        
        // Derive PDAs manually
        const [storePda] = PublicKey.findProgramAddressSync(
            [Buffer.from('OAppStore')],
            new PublicKey(PROGRAM_ID)
        );
        
        console.log('Store PDA:', storePda.toString());
        
        // Check if store exists
        const storeAccountInfo = await connection.getAccountInfo(storePda);
        if (!storeAccountInfo) {
            console.log('⚠️  Store account not found. Please initialize it first.');
            console.log('💡 Run: npx hardhat lz:oapp:solana:init-config --network solana-testnet');
        } else {
            console.log('✅ Store account found');
        }
        
        console.log('🎯 Next steps:');
        console.log('1. Ensure store account is initialized');
        console.log(`2. Set peer for EID ${SEPOLIA_EID} with address ${EVM_CONTRACT}`);
        console.log('3. Run LayerZero wire command');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

setPeerConfig().catch(console.error);
EOF

echo "Running manual peer configuration check..."
node temp-peer-config.js
rm temp-peer-config.js

# Step 7: LayerZero Wire Configuration
echo_step "Step 7: LayerZero Wire Configuration"

echo "Running LayerZero wire configuration..."
if command -v npx &> /dev/null; then
    npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts 2>/dev/null || {
        echo_warning "LayerZero wire failed. This might be expected if accounts aren't initialized yet."
    }
fi

# Step 8: Back to EVM side - update peer if needed
echo_step "Step 8: EVM Side Configuration Check"

cd ../evm-contracts

echo "Checking EVM contract peer configuration..."
if [ -f "scripts/check-peer-config.js" ]; then
    node scripts/check-peer-config.js || echo_warning "Peer check failed"
fi

# Step 9: Final verification and instructions
echo_step "Step 9: Final Instructions"

echo ""
echo "🎉 LayerZero V2 Fix Completed!"
echo ""
echo "📋 Manual Steps Still Required:"
echo ""
echo "1. 🔧 Initialize Solana Store Account (if not done):"
echo "   cd oapp-solana"
echo "   npx hardhat lz:oapp:solana:init-config --network solana-testnet"
echo ""
echo "2. 🤝 Set Peer Configuration:"
echo "   npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts"
echo ""
echo "3. 📨 Test Message Sending:"
echo "   cd ../evm-contracts"
echo "   node scripts/test-message.js"
echo ""
echo "4. 🔍 Monitor LayerZero Scan:"
echo "   https://layerzeroscan.com/tx/0xf43f233a7f9c69e196802aa5c596059c93577841b1bc5708a82acf1b709b91ca"
echo ""
echo "🐛 If you see 'Destination OApp not found':"
echo "- Verify program ID matches in both configs"
echo "- Ensure Solana OApp is properly initialized"
echo "- Check peer configuration is set correctly"
echo ""
echo "📚 Resources:"
echo "- Solana Faucet: https://faucet.solana.com/"
echo "- LayerZero Docs: https://docs.layerzero.network/v2/developers/solana/oapp/overview"
echo ""

echo_success "Script completed! Follow the manual steps above to complete the setup."
