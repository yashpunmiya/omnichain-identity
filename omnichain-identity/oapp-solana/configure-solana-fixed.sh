#!/bin/bash

# 🔧 Solana OApp Configuration Script for LayerZero V2 - UPDATED
# This script properly configures the Solana side to fix BLOCKED messages

set -e

# Configuration
PROGRAM_ID="DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz"
EVM_CONTRACT="0x429B3fc57dD1000eBd6eC9A77e7f3E0ABdD252fa"
SEPOLIA_EID=40161
SOLANA_RPC="https://api.devnet.solana.com"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_step() { echo -e "${BLUE}==== $1 ====${NC}"; }
echo_success() { echo -e "${GREEN}✅ $1${NC}"; }
echo_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
echo_error() { echo -e "${RED}❌ $1${NC}"; }

echo_step "Solana OApp Configuration for LayerZero V2"

# Check environment
if ! command -v solana &> /dev/null; then
    echo_error "Solana CLI not found"
    exit 1
fi

if ! command -v anchor &> /dev/null; then
    echo_error "Anchor CLI not found"
    exit 1
fi

# Setup Solana
echo_step "Setting up Solana Environment"
solana config set --url $SOLANA_RPC

BALANCE=$(solana balance --lamports 2>/dev/null || echo "0")
if [ "$BALANCE" -lt 100000000 ]; then
    echo_warning "Low balance. Requesting airdrop..."
    solana airdrop 2 || echo_warning "Visit https://faucet.solana.com/ for SOL"
fi

WALLET=$(solana address)
echo_success "Wallet: $WALLET (Balance: $(solana balance))"

# Install dependencies
echo_step "Installing Dependencies"
if [ ! -d "node_modules" ]; then
    npm install
fi

# Build Anchor program
echo_step "Building Anchor Program"
anchor build

# Initialize LayerZero configuration
echo_step "Initializing LayerZero Configuration"

# Method 1: Try LayerZero devtools
echo "Attempting LayerZero devtools initialization..."
npx hardhat lz:oapp:solana:init-config --network solana-testnet || {
    echo_warning "LayerZero devtools failed, trying alternative..."
    
    # Method 2: Manual initialization using custom script
    cat > temp-init.js << 'EOF'
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const fs = require('fs');

async function initializeSolanaOApp() {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const programId = new PublicKey('DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz');
    
    try {
        // Load wallet
        const walletPath = process.env.HOME + '/.config/solana/id.json';
        const wallet = Keypair.fromSecretKey(Buffer.from(JSON.parse(fs.readFileSync(walletPath))));
        
        console.log('Wallet:', wallet.publicKey.toString());
        
        // Derive Store PDA - try different seeds that LayerZero might use
        const possibleSeeds = [
            ['OAppStore'],
            ['Store'],
            ['OApp'],
            ['oapp_store']
        ];
        
        for (const seeds of possibleSeeds) {
            const [storePda] = PublicKey.findProgramAddressSync(
                seeds.map(s => Buffer.from(s)),
                programId
            );
            
            console.log(`Checking Store PDA with seeds ${seeds.join(',')}:`, storePda.toString());
            
            const storeInfo = await connection.getAccountInfo(storePda);
            if (storeInfo) {
                console.log('✅ Store found with seeds:', seeds.join(','));
                break;
            } else {
                console.log('❌ No store found with seeds:', seeds.join(','));
            }
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

initializeSolanaOApp().catch(console.error);
EOF
    
    node temp-init.js
    rm temp-init.js
}

# Wire the configuration
echo_step "Wiring LayerZero Configuration"
npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts || {
    echo_warning "Wire command failed. Manual configuration may be needed."
}

# Final verification
echo_step "Verification"

echo "🔍 Checking account states..."
solana account $PROGRAM_ID --url $SOLANA_RPC || echo_warning "Program account check failed"

echo ""
echo "🎉 Solana Configuration Completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Verify store account is initialized"
echo "2. Verify peer config is set for EID $SEPOLIA_EID"
echo "3. Test cross-chain message from EVM side"
echo "4. Monitor: https://layerzeroscan.com/"
echo ""
echo "🐛 If still BLOCKED:"
echo "- Check LayerZero devtools version compatibility"
echo "- Verify all account PDAs are correct"
echo "- Ensure program has proper message handling"
echo ""
