const anchor = require('@coral-xyz/anchor');
const { PublicKey, SystemProgram, Keypair } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

async function fixPeerConfig() {
    try {
        console.log('🔧 Fixing peer configuration for Sepolia...');
        
        // Load the program IDL
        const idl = JSON.parse(fs.readFileSync('./target/idl/my_oapp.json', 'utf8'));
        
        // Connect to devnet
        const connection = new anchor.web3.Connection('https://api.devnet.solana.com', 'confirmed');
        
        // Load wallet from Windows path
        const keypairPath = path.join(process.env.USERPROFILE || process.env.HOME, '.config', 'solana', 'id.json');
        console.log('🔑 Loading keypair from:', keypairPath);
        
        const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
        const wallet = new anchor.Wallet(Keypair.fromSecretKey(new Uint8Array(keypairData)));
        
        // Set up provider
        const provider = new anchor.AnchorProvider(connection, wallet, {
            commitment: 'confirmed',
        });
        anchor.setProvider(provider);
        
        // Load the program
        const programId = new PublicKey('DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz');
        const program = new anchor.Program(idl, programId, provider);
        
        console.log('📋 Program loaded:', programId.toString());
        console.log('📋 Wallet:', wallet.publicKey.toString());
        
        // Get the Store PDA
        const [storeAddress] = PublicKey.findProgramAddressSync(
            [Buffer.from('Store')],
            programId
        );
        
        console.log('📍 Store Address:', storeAddress.toString());
        
        // Check if store exists and is accessible
        try {
            const storeAccount = await program.account.store.fetch(storeAddress);
            console.log('✅ Store is accessible');
            console.log('📋 Store admin:', storeAccount.admin.toString());
        } catch (error) {
            console.error('❌ Store is not accessible:', error.message);
            return;
        }
        
        // Set up peer configuration for Sepolia
        const sepoliaEid = 30161;
        const evmContractAddress = '0xB1e741BDe82434a7E5DcB805a89977be337A7ffA';
        
        console.log('🔗 Setting peer for Sepolia EID:', sepoliaEid);
        console.log('🔗 EVM Contract Address:', evmContractAddress);
        
        // Get Peer PDA for Sepolia EID
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
            console.log('✅ Peer already exists:', peerAccount.peer);
            console.log('🎯 Peer is already configured for Sepolia!');
            return;
        } catch (error) {
            console.log('🔧 Peer does not exist, attempting to create...');
        }
        
        // Convert EVM address to proper 32-byte format for LayerZero
        const evmAddressHex = evmContractAddress.slice(2); // Remove 0x prefix
        const evmAddressBytes = Buffer.from(evmAddressHex, 'hex');
        
        // LayerZero uses 32-byte addresses, pad with zeros at the beginning
        const peerAddressBytes = Buffer.concat([Buffer.alloc(12), evmAddressBytes]);
        
        console.log('📋 Peer address bytes:', Array.from(peerAddressBytes));
        
        // Set the peer configuration
        try {
            const setPeerTx = await program.methods
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
                
            console.log('✅ Peer configuration set successfully!');
            console.log('📋 Transaction:', setPeerTx);
            
            // Verify the peer was set correctly
            const peerAccount = await program.account.peer.fetch(peerAddress);
            console.log('✅ Verified peer configuration:', peerAccount.peer);
            
        } catch (peerError) {
            console.error('❌ Failed to set peer:', peerError.message);
            if (peerError.logs) {
                console.log('📋 Transaction logs:');
                peerError.logs.forEach(log => console.log('  ', log));
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.stack) {
            console.log('Stack trace:', error.stack);
        }
    }
}

fixPeerConfig();
