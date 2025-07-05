#!/bin/bash

# 🔧 Solana ULN Configuration for LayerZero V2
# Configures Solana to receive messages from Sepolia

set -e

echo "🚀 Configuring Solana ULN for LayerZero V2 Receive Configuration"
echo "================================================================"

# Configuration constants
SOLANA_PROGRAM_ID="DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz"
EVM_CONTRACT_ADDRESS="0xB1e741BDe82434a7E5DcB805a89977be337A7ffA"
SEPOLIA_EID=30161
NETWORK="devnet"

echo "📋 Configuration Details:"
echo "  Solana Program: $SOLANA_PROGRAM_ID"
echo "  EVM Contract: $EVM_CONTRACT_ADDRESS"  
echo "  Sepolia EID: $SEPOLIA_EID"
echo "  Network: $NETWORK"

# Set Solana config
echo "🔧 Setting Solana network to $NETWORK..."
solana config set --url $NETWORK

# Check balance
BALANCE=$(solana balance --lamports 2>/dev/null || echo "0")
if [ "$BALANCE" -lt 100000000 ]; then
    echo "💸 Getting SOL for transactions..."
    solana airdrop 2 || echo "⚠️  Airdrop failed, get SOL from https://faucet.solana.com/"
fi

echo "💰 Current balance: $(solana balance)"

# Step 1: Initialize receive ULN config
echo ""
echo "🔧 Step 1: Setting up ULN Receive Configuration..."

# Create a temporary script to configure ULN
cat > temp_uln_config.js << 'EOF'
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const fs = require('fs');
const os = require('os');

async function configureULN() {
    console.log('🔧 Configuring ULN for Solana OApp...');
    
    try {
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        
        // Load keypair
        const keypairPath = `${os.homedir()}/.config/solana/id.json`;
        const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
        const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
        
        console.log('🔑 Wallet:', keypair.publicKey.toString());
        
        // Program and configuration details
        const programId = new PublicKey('DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz');
        const sepoliaEid = 30161;
        
        console.log('📋 Program ID:', programId.toString());
        console.log('📋 Configuring for Sepolia EID:', sepoliaEid);
        
        // LayerZero Solana DVN addresses (these are the standard ones for Solana devnet)
        const layerZeroSolanaDVN = new PublicKey('4VDjp6XQaxoZf5RGwiPU9NR1EXSZn2TP4ATMmiSzLfhb');
        
        console.log('🔧 Using LayerZero Solana DVN:', layerZeroSolanaDVN.toString());
        
        // For Solana, we need to use the LayerZero SDK or CLI to configure ULN
        // The exact implementation depends on the LayerZero Solana SDK
        
        console.log('💡 ULN Configuration approach:');
        console.log('1. Use LayerZero CLI: npx @layerzerolabs/devtools-cli@latest lz:oapp:config:init --oapp-config layerzero.config.ts');
        console.log('2. Or use Anchor commands for program-specific configuration');
        console.log('3. Configure receive ULN with DVN settings for Sepolia EID 30161');
        
        // Check if we can access the program
        const programInfo = await connection.getAccountInfo(programId);
        if (programInfo) {
            console.log('✅ Program account accessible');
        } else {
            console.log('❌ Program account not found');
            return;
        }
        
        console.log('📋 Next steps:');
        console.log('1. The Solana program needs receive ULN configuration for EID 30161');
        console.log('2. This typically requires calling the LayerZero endpoint on Solana');
        console.log('3. The configuration should include LayerZero DVN settings');
        
    } catch (error) {
        console.error('❌ Configuration error:', error.message);
    }
}

configureULN();
EOF

# Run the ULN configuration
echo "🔧 Running ULN configuration analysis..."
node temp_uln_config.js

# Clean up temporary file
rm -f temp_uln_config.js

# Step 2: Try using LayerZero CLI for configuration
echo ""
echo "🔧 Step 2: Attempting LayerZero CLI configuration..."

# Check if LayerZero CLI is available
if command -v npx &> /dev/null; then
    echo "🔧 Using LayerZero DevTools CLI..."
    
    # Change to the oapp-solana directory if layerzero.config.ts exists
    if [ -f "layerzero.config.ts" ]; then
        echo "📋 Found LayerZero config file"
        echo "🔧 Initializing OApp configuration..."
        
        # Try to use LayerZero CLI to set up the configuration
        # This should configure the ULN settings for receiving messages
        npx @layerzerolabs/devtools-cli@latest lz:oapp:config:init --oapp-config layerzero.config.ts || echo "⚠️  CLI init failed"
        
        echo "🔧 Setting wire configuration..."
        npx @layerzerolabs/devtools-cli@latest lz:oapp:wire --oapp-config layerzero.config.ts || echo "⚠️  Wire configuration failed"
        
    else
        echo "❌ LayerZero config file not found"
    fi
else
    echo "❌ npx not available"
fi

echo ""
echo "🎯 Manual Configuration Steps Needed:"
echo "======================================"
echo ""
echo "The Solana OApp needs ULN configuration to receive messages from Sepolia."
echo "According to LayerZero Scan, the message is blocked due to missing ULN config."
echo ""
echo "Required configuration:"
echo "  - Receive ULN config for Sepolia EID 30161"
echo "  - DVN settings that match the Sepolia sender"
echo "  - Proper LayerZero Solana endpoint configuration"
echo ""
echo "🔧 Try these approaches:"
echo "1. Use LayerZero CLI: cd /path/to/oapp-solana && npx @layerzerolabs/devtools-cli@latest lz:oapp:wire"
echo "2. Use LayerZero Solana SDK to configure ULN programmatically"
echo "3. Ensure the Solana program has proper receive configuration for EID 30161"
echo ""
echo "🔗 References:"
echo "- LayerZero Solana docs: https://docs.layerzero.network/v2/developers/solana"
echo "- Current blocked message: https://testnet.layerzeroscan.com/tx/0xa96a54f5fbcfc2341ca78637818f11dc4e4c68d40f3accee0b63014c51999de5"
echo ""
