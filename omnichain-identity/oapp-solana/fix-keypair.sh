#!/bin/bash

# Simple script to fix Solana keypair

# Create Solana config directory
mkdir -p ~/.config/solana

# Check if keypair exists
if [ ! -f ~/.config/solana/id.json ]; then
    echo "Creating new Solana keypair..."
    solana-keygen new --outfile ~/.config/solana/id.json --no-bip39-passphrase
else
    echo "Solana keypair already exists"
fi

# Set to devnet
solana config set --url devnet

# Check balance
echo "Current balance:"
solana balance

echo ""
echo "Solana keypair is now set up at ~/.config/solana/id.json"
echo ""
echo "Next steps:"
echo "1. Run: npx hardhat lz:oapp:solana:debug --network solana-testnet --program-id DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz"
echo "2. Run: npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts --network solana-testnet"
