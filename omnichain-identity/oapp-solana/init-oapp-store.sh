#!/bin/bash

# Initialize Solana OApp Store for LayerZero
# This script attempts to properly initialize the Solana OApp

echo "🚀 Initializing Solana OApp Store"
echo "================================="

# Configuration
SOLANA_PROGRAM_ID="DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz"

# Set to devnet
solana config set --url devnet

# Get current keypair address
WALLET_ADDRESS=$(solana address)
echo "🔑 Using wallet: $WALLET_ADDRESS"

# Check balance
BALANCE=$(solana balance --lamports)
echo "💰 Balance: $BALANCE lamports"

if [ "$BALANCE" -lt 100000000 ]; then
    echo "💸 Getting SOL airdrop..."
    solana airdrop 2
fi

echo ""
echo "🔧 Attempting to initialize OApp store..."

# Try to run the hardhat create command that should initialize the store
echo "1. Trying hardhat lz:oapp:solana:create..."
if npx hardhat lz:oapp:solana:create --network solana-testnet --eid 40168 2>/dev/null; then
    echo "✅ OApp store created successfully"
else
    echo "❌ Failed to create OApp store via hardhat"
fi

echo ""
echo "2. Checking if Anchor is available..."
if command -v anchor >/dev/null 2>&1; then
    echo "✅ Anchor CLI found"
    
    # Try to build the project
    echo "🔨 Building Anchor project..."
    if anchor build; then
        echo "✅ Build successful"
        
        # Try to initialize
        echo "🚀 Attempting to initialize..."
        anchor run initialize 2>/dev/null || echo "⚠️ Initialize script not found or failed"
    else
        echo "❌ Build failed"
    fi
else
    echo "❌ Anchor CLI not found"
fi

echo ""
echo "3. Manual OApp initialization approach..."
echo "If the above methods failed, you may need to:"
echo ""
echo "   a) Use the LayerZero Solana SDK directly to call initialize"
echo "   b) Deploy the program fresh with proper initialization"
echo "   c) Use a different LayerZero tooling approach"
echo ""
echo "📋 Current status:"
echo "   Program ID: $SOLANA_PROGRAM_ID"
echo "   Network: Solana Devnet"
echo "   Issue: ULN receive config missing for Sepolia EID 30161"
echo ""
echo "🎯 The blocked message needs the Solana program to accept messages from Sepolia."
echo "   This requires ULN configuration to be set on the Solana side."
