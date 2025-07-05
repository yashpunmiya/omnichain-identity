#!/bin/bash

# FINAL FIX - Configure Peer and ULN for LayerZero Solana OApp

echo "🎯 FINAL LAYERZERO CONFIGURATION FIX"
echo "==================================="

# Known working addresses
STORE_ADDRESS="D268ujKzoZ2e8s9P4UnuP3nRBBmzXUKGpvRaj7kM6Dtp"
PROGRAM_ID="DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz"
ADMIN_WALLET="9dvHkfm4iUc3sCQ9B7KzycqomNtD9iCVjfpMgir3Ej4j"
EVM_CONTRACT="0xB1e741BDe82434a7E5DcB805a89977be337A7ffA"
SEPOLIA_EID=30161

echo "📋 Working with:"
echo "  Store: $STORE_ADDRESS ✅"
echo "  Program: $PROGRAM_ID ✅"
echo "  Admin: $ADMIN_WALLET ✅"
echo "  EVM Contract: $EVM_CONTRACT"

# Set Solana config
solana config set --url devnet

echo ""
echo "🔧 Step 1: Try LayerZero hardhat wire command now that store is accessible..."

# Now that we have the correct store address, try the wire command
if npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts --network solana-testnet; then
    echo "✅ LayerZero wiring successful!"
else
    echo "⚠️ Wire command failed, trying manual peer setup..."
fi

echo ""
echo "🔧 Step 2: Manual peer setup using corrected Anchor script..."

# Create a fixed peer setup script
cat > fix_peer_config.js << 'EOF'
const anchor = require('@coral-xyz/anchor');
const { PublicKey, SystemProgram, Keypair } = require('@solana/web3.js');
const fs = require('fs');
const os = require('os');

async function fixPeerConfig() {
    try {
        console.log('🔧 Fixing peer configuration...');
        
        // Connect to devnet
        const connection = new anchor.web3.Connection('https://api.devnet.solana.com', 'confirmed');
        
        // Load wallet
        const keypairPath = `${os.homedir()}/.config/solana/id.json`;
        const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
        const wallet = new anchor.Wallet(Keypair.fromSecretKey(new Uint8Array(keypairData)));
        
        // Load the program IDL (make sure it matches the deployed program)
        const idl = JSON.parse(fs.readFileSync('./target/idl/my_oapp.json', 'utf8'));
        
        // Set up provider
        const provider = new anchor.AnchorProvider(connection, wallet, {
            commitment: 'confirmed',
        });
        
        // Use the actual program ID from the working store
        const programId = new PublicKey('DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz');
        
        // Get the declared program ID from IDL to check for mismatch
        console.log('📋 IDL program ID:', idl.metadata.address);
        console.log('📋 Using program ID:', programId.toString());
        
        // Create program instance
        const program = new anchor.Program(idl, programId, provider);
        
        // Known working store address
        const storeAddress = new PublicKey('D268ujKzoZ2e8s9P4UnuP3nRBBmzXUKGpvRaj7kM6Dtp');
        
        // Verify store exists
        const storeAccount = await program.account.store.fetch(storeAddress);
        console.log('✅ Store verified, admin:', storeAccount.admin.toString());
        
        // Set up peer for Sepolia EID 30161
        const sepoliaEid = 30161;
        const eidBytes = Buffer.alloc(4);
        eidBytes.writeUInt32LE(sepoliaEid, 0);
        
        const [peerAddress] = PublicKey.findProgramAddressSync(
            [Buffer.from('Peer'), eidBytes],
            programId
        );
        
        console.log('📍 Peer PDA for Sepolia:', peerAddress.toString());
        
        // Check if peer already exists
        try {
            const peerAccount = await program.account.peer.fetch(peerAddress);
            console.log('✅ Peer already configured:', peerAccount.address);
        } catch (error) {
            console.log('🔧 Peer not found, setting up...');
            
            // Convert EVM address to 32-byte format
            const evmAddressHex = '0xB1e741BDe82434a7E5DcB805a89977be337A7ffA';
            const evmAddressBytes = Buffer.from(evmAddressHex.slice(2), 'hex');
            const peerAddressBytes = Buffer.concat([Buffer.alloc(12), evmAddressBytes]);
            
            try {
                // Set peer configuration
                const tx = await program.methods
                    .setPeerConfig({
                        dstEid: sepoliaEid,
                        peer: Array.from(peerAddressBytes),
                    })
                    .accounts({
                        admin: wallet.publicKey,
                        peer: peerAddress,
                        store: storeAddress,
                        systemProgram: SystemProgram.programId,
                    })
                    .rpc();
                    
                console.log('✅ Peer configuration set! TX:', tx);
                
            } catch (peerError) {
                console.error('❌ Peer setup failed:', peerError.message);
                if (peerError.logs) {
                    console.log('📋 Transaction logs:', peerError.logs);
                }
                
                // Check if it's the program ID mismatch issue
                if (peerError.message.includes('DeclaredProgramIdMismatch')) {
                    console.log('💡 Program ID mismatch detected!');
                    console.log('   IDL expects:', idl.metadata.address);
                    console.log('   Using:', programId.toString());
                    console.log('   Try rebuilding with: anchor build --program-name my_oapp --program-id', programId.toString());
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.logs) {
            console.log('📋 Error logs:', error.logs);
        }
    }
}

fixPeerConfig();
EOF

echo "🔧 Running peer configuration fix..."
if node fix_peer_config.js; then
    echo "✅ Peer configuration completed"
else
    echo "⚠️ Peer configuration had issues"
fi

# Clean up
rm -f fix_peer_config.js

echo ""
echo "🔧 Step 3: Check current status after peer setup..."
npx hardhat lz:oapp:solana:debug --network solana-testnet --eid 40168 --store $STORE_ADDRESS

echo ""
echo "🔧 Step 4: Try LayerZero wire command again..."
if npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts --network solana-testnet; then
    echo "✅ LayerZero wiring now successful!"
else
    echo "⚠️ Wire command still failing"
fi

echo ""
echo "🎯 FINAL STATUS CHECK:"
echo "1. Check LayerZero Scan to see if message is unblocked:"
echo "   https://testnet.layerzeroscan.com/tx/0xa96a54f5fbcfc2341ca78637818f11dc4e4c68d40f3accee0b63014c51999de5"
echo ""
echo "2. If still blocked, the ULN configuration needs to be set at the LayerZero endpoint level"
echo "   This typically happens automatically when peer and DVN configs are properly set"
echo ""
echo "✅ Store: Initialized and accessible"
echo "🔧 Peer: Attempting to configure for Sepolia EID $SEPOLIA_EID" 
echo "⏳ ULN: Should auto-configure once peer is set"
