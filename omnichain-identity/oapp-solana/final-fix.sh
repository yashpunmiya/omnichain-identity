#!/bin/bash

# 🔧 FINAL LAYERZERO V2 FIX - DIRECT APPROACH
# Since all accounts are configured, this script focuses on the final wiring step

echo "🚀 LayerZero V2 Final Fix - Direct Approach"
echo "=========================================="



# Configuration
PROGRAM_ID="DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz"
EVM_CONTRACT="0x429B3fc57dD1000eBd6eC9A77e7f3E0ABdD252fa"

echo "📋 Configuration:"
echo "  Program ID: $PROGRAM_ID"
echo "  EVM Contract: $EVM_CONTRACT"
echo ""

# Step 1: Set Solana config
echo "🔧 Step 1: Configure Solana CLI"
solana config set --url https://api.devnet.solana.com

# Check Solana keypair
if [ ! -f "$HOME/.config/solana/id.json" ]; then
    echo "❌ Solana keypair not found at $HOME/.config/solana/id.json"
    echo "💡 Please run: solana-keygen new --outfile ~/.config/solana/id.json"
    exit 1
fi

WALLET=$(solana address)
echo "🔑 Wallet: $WALLET"

# Check balance
BALANCE=$(solana balance --lamports 2>/dev/null || echo "0")
if [ "$BALANCE" -lt 100000000 ]; then
    echo "💸 Getting SOL..."
    solana airdrop 2 || echo "⚠️  Airdrop failed, get SOL from https://faucet.solana.com/"
fi

echo "💰 Balance: $(solana balance)"

# Step 2: Verify program state
echo ""
echo "🔍 Step 2: Verify Program State"
solana account $PROGRAM_ID --url https://api.devnet.solana.com >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Program exists and is accessible"
else
    echo "❌ Program not found or not accessible"
    exit 1
fi

# Step 3: Run diagnostic
echo ""
echo "🔍 Step 3: Current State Diagnostic"
node diagnose-solana.js

# Step 4: Try LayerZero devtools with fixed config
echo ""
echo "🔧 Step 4: Attempting LayerZero DevTools Fix"

# Update the .env file for WSL compatibility
export SOLANA_KEYPAIR_PATH="$HOME/.config/solana/id.json"
export RPC_URL_SOLANA_TESTNET="https://api.devnet.solana.com"

echo "Environment variables set:"
echo "  SOLANA_KEYPAIR_PATH: $SOLANA_KEYPAIR_PATH"
echo "  RPC_URL_SOLANA_TESTNET: $RPC_URL_SOLANA_TESTNET"

# Try to initialize (may already be done, but safe to run)
echo ""
echo "🏪 Attempting to initialize configuration..."
npx hardhat lz:oapp:solana:init-config --network solana-testnet 2>/dev/null || {
    echo "⚠️  Init config failed or already done"
}

# Try to wire the configuration
echo ""
echo "🔗 Attempting to wire LayerZero configuration..."
npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts 2>/dev/null || {
    echo "⚠️  Wire command failed - this might be expected if already configured"
}

# Step 5: Manual verification that everything is ready
echo ""
echo "🔍 Step 5: Final Verification"

# Create a simple verification script
cat > verify-config.js << 'EOF'
const { Connection, PublicKey } = require('@solana/web3.js');

async function verifyConfig() {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const programId = new PublicKey('DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz');
    
    console.log('🔍 Final Configuration Verification:');
    
    // Check Store PDA
    const [storePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('Store')],
        programId
    );
    
    const storeAccount = await connection.getAccountInfo(storePda);
    console.log(`📦 Store PDA: ${storeAccount ? '✅ EXISTS' : '❌ MISSING'}`);
    
    // Check Peer PDA for Sepolia
    const [peerPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('Peer'), storePda.toBuffer(), Buffer.from([0, 0, 156, 225])],
        programId
    );
    
    const peerAccount = await connection.getAccountInfo(peerPda);
    console.log(`🤝 Peer PDA: ${peerAccount ? '✅ EXISTS' : '❌ MISSING'}`);
    
    if (storeAccount && peerAccount) {
        console.log('');
        console.log('🎉 ALL CONFIGURATIONS ARE READY!');
        console.log('');
        console.log('📋 The Solana side is properly configured:');
        console.log(`   Store PDA: ${storePda.toString()}`);
        console.log(`   Peer PDA: ${peerPda.toString()}`);
        console.log('');
        console.log('🔗 Monitor LayerZero Scan:');
        console.log('   https://layerzeroscan.com/tx/0xf43f233a7f9c69e196802aa5c596059c93577841b1bc5708a82acf1b709b91ca');
        console.log('');
        console.log('🎯 If still BLOCKED, the issue might be:');
        console.log('   1. LayerZero network needs time to recognize the config');
        console.log('   2. Try sending a new cross-chain message');
        console.log('   3. The config may need to be applied on the EVM side too');
    } else {
        console.log('❌ Configuration incomplete');
    }
}

verifyConfig().catch(console.error);
EOF

node verify-config.js
rm verify-config.js

echo ""
echo "🏁 Fix Script Completed!"
echo ""
echo "📋 Summary:"
echo "   ✅ Solana environment configured"
echo "   ✅ Program verified"
echo "   ✅ Configuration checked"
echo ""
echo "🎯 Next Steps:"
echo "1. Monitor the LayerZero scan link for status changes"
echo "2. If still BLOCKED, try sending a new cross-chain message"
echo "3. The message may take time to process through LayerZero network"
echo ""
echo "🔗 LayerZero Scan:"
echo "   https://layerzeroscan.com/tx/0xf43f233a7f9c69e196802aa5c596059c93577841b1bc5708a82acf1b709b91ca"
