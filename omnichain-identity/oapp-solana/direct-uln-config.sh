#!/bin/bash

# Direct shell script to configure LayerZero ULN for Solana
# This doesn't depend on hardhat or Node.js to read the keypair

# Configuration
SOLANA_PROGRAM_ID="DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz"
EVM_CONTRACT_ADDRESS="0xB1e741BDe82434a7E5DcB805a89977be337A7ffA"
SEPOLIA_EID=30161
SOLANA_EID=40168

# Print header
echo "🚀 Direct LayerZero ULN Configuration for Solana"
echo "==============================================="
echo ""
echo "📋 Configuration:"
echo "  Solana Program: $SOLANA_PROGRAM_ID"
echo "  EVM Contract: $EVM_CONTRACT_ADDRESS"
echo "  Sepolia EID: $SEPOLIA_EID"
echo "  Solana EID: $SOLANA_EID"
echo ""

# Check if solana CLI is available
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found"
    exit 1
fi

# Set Solana to devnet
echo "🔧 Setting Solana config to devnet..."
solana config set --url devnet

# Check balance
echo "💰 Checking balance..."
BALANCE=$(solana balance | awk '{print $1}')
echo "  Current balance: $BALANCE SOL"

# If balance is low, request airdrop
if (( $(echo "$BALANCE < 1.0" | bc -l) )); then
    echo "💸 Balance is low, requesting airdrop..."
    solana airdrop 2
fi

echo ""
echo "🔧 Installation and Configuration Steps:"
echo ""
echo "1. Install LayerZero CLI (if not already installed):"
echo "   npm install -g @layerzerolabs/lz-cli"
echo ""
echo "2. Configure for devnet:"
echo "   lz config -n devnet"
echo ""
echo "3. Configure OApp peering:"
echo "   lz oapp:configure -o $SOLANA_PROGRAM_ID -e $SOLANA_EID --peer-eid $SEPOLIA_EID --peer-address $EVM_CONTRACT_ADDRESS"
echo ""
echo "4. Configure ULN settings:"
echo "   lz oapp:set-receive-uln -o $SOLANA_PROGRAM_ID -e $SOLANA_EID --from-eid $SEPOLIA_EID --dvn-count 1"
echo ""
echo "5. If you have the proper permissions, you can also try:"
echo "   lz endpoint:set-default-receive-library -e $SOLANA_EID --remote-eid $SEPOLIA_EID --lib-type ULN"
echo ""
