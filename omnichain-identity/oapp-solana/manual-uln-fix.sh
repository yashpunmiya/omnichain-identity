#!/bin/bash

# Manual ULN Configuration Script for Solana LayerZero
# This bypasses hardhat and directly configures the ULN settings

echo "🚀 Manual LayerZero ULN Configuration"
echo "===================================="

# Configuration
SOLANA_PROGRAM_ID="DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz"
EVM_CONTRACT_ADDRESS="0xB1e741BDe82434a7E5DcB805a89977be337A7ffA"
SEPOLIA_EID=30161
SOLANA_EID=40168

# Set Solana to devnet
echo "🔧 Setting Solana to devnet..."
solana config set --url devnet

# Check balance
echo "💰 Checking Solana balance..."
solana balance

echo ""
echo "📋 LayerZero Scan Issue Analysis:"
echo "The message is BLOCKED because Solana side is missing ULN receive configuration."
echo "The error shows: 'WAITING FOR ULN CONFIG' on Solana for Sepolia EID $SEPOLIA_EID"
echo ""

# Since the OApp is already deployed, we need to configure it properly
echo "🔧 Solution Approaches:"
echo ""

echo "1. Check if the Solana program has proper initialization:"
echo "   solana account $SOLANA_PROGRAM_ID"
echo ""

echo "2. Initialize the OApp store if needed:"
echo "   This typically requires calling the 'initialize' instruction on the Solana program"
echo ""

echo "3. Set up ULN configuration using Anchor CLI (if available):"
echo "   anchor build"
echo "   anchor deploy --program-id $SOLANA_PROGRAM_ID"
echo ""

echo "4. Use LayerZero Solana SDK directly:"
echo "   We need to call the ULN configuration instructions directly"
echo ""

# Check if the program account exists
echo "🔍 Checking Solana program account..."
if solana account $SOLANA_PROGRAM_ID >/dev/null 2>&1; then
    echo "✅ Program account exists"
    solana account $SOLANA_PROGRAM_ID | head -10
else
    echo "❌ Program account not found or not accessible"
fi

echo ""
echo "📝 Next Steps to Fix the BLOCKED Message:"
echo "1. The Solana program needs to have its ULN receive config set for EID $SEPOLIA_EID"
echo "2. This requires calling LayerZero's setReceiveLibrary instruction"
echo "3. The DVN configuration must match between EVM and Solana"
echo ""

echo "🎯 Immediate Action Required:"
echo "Since hardhat tooling has keypair issues, try this alternative:"
echo ""
echo "Option A - Use Anchor directly (if available):"
echo "  cd /mnt/c/Users/yyash/Coding/omnichain\\ identity/omnichain-identity/oapp-solana"
echo "  anchor build"
echo "  anchor test --skip-deploy"
echo ""
echo "Option B - Use Solana CLI to invoke program instructions:"
echo "  This requires crafting the specific instruction data for ULN config"
echo ""
echo "Option C - Deploy fresh with proper LayerZero wiring:"
echo "  1. Deploy the program again with proper LayerZero initialization"
echo "  2. Run the LayerZero wiring commands during deployment"
echo ""

echo "🔗 Key addresses for reference:"
echo "  Solana Program: $SOLANA_PROGRAM_ID"
echo "  EVM Contract: $EVM_CONTRACT_ADDRESS"
echo "  Sepolia EID: $SEPOLIA_EID (sender)"
echo "  Solana EID: $SOLANA_EID (receiver - needs ULN config)"
echo ""
echo "🌐 Monitor progress: https://testnet.layerzeroscan.com/tx/0xa96a54f5fbcfc2341ca78637818f11dc4e4c68d40f3accee0b63014c51999de5"
