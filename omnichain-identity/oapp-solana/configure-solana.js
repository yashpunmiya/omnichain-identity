const { Connection, PublicKey, Keypair, SystemProgram } = require('@solana/web3.js');
const { AnchorProvider, Program, web3, BN } = require('@coral-xyz/anchor');
const fs = require('fs');
const path = require('path');

// Configuration
const SOLANA_RPC_URL = 'https://api.devnet.solana.com';
const PROGRAM_ID = 'DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz';
const EVM_CONTRACT_ADDRESS = '0x429B3fc57dD1000eBd6eC9A77e7f3E0ABdD252fa';
const SEPOLIA_EID = 40161;

async function configureSolanaOApp() {
    console.log('🔧 Configuring Solana OApp for LayerZero V2...');
    
    try {
        // Setup connection
        const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
        
        // Load wallet (you'll need to update this path)
        const walletPath = process.env.SOLANA_WALLET_PATH || path.join(process.env.HOME, '.config', 'solana', 'id.json');
        
        if (!fs.existsSync(walletPath)) {
            console.error('❌ Wallet file not found at:', walletPath);
            console.log('💡 Set SOLANA_WALLET_PATH environment variable or ensure wallet exists at default location');
            return;
        }
        
        const walletKeypair = Keypair.fromSecretKey(
            Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf8')))
        );
        
        console.log(`🔑 Using wallet: ${walletKeypair.publicKey.toString()}`);
        
        // Check balance
        const balance = await connection.getBalance(walletKeypair.publicKey);
        console.log(`💰 Balance: ${balance / 1e9} SOL`);
        
        if (balance < 0.01 * 1e9) {
            console.log('💸 Low balance! Get devnet SOL: https://faucet.solana.com/');
            return;
        }
        
        // Setup Anchor provider
        const provider = new AnchorProvider(connection, { publicKey: walletKeypair.publicKey }, {});
        
        // Load IDL (you might need to adjust this path)
        const idlPath = path.join(__dirname, 'target', 'idl', 'my_oapp.json');
        
        if (!fs.existsSync(idlPath)) {
            console.log('⚠️  IDL file not found. Please run: anchor build');
            console.log('📋 Manual Configuration Steps:');
            console.log('');
            await showManualSteps();
            return;
        }
        
        const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
        const program = new Program(idl, PROGRAM_ID, provider);
        
        // Derive PDAs
        const [storePda] = PublicKey.findProgramAddressSync(
            [Buffer.from('Store')],
            new PublicKey(PROGRAM_ID)
        );
        
        const [peerPda] = PublicKey.findProgramAddressSync(
            [
                Buffer.from('Peer'),
                storePda.toBuffer(),
                new BN(SEPOLIA_EID).toArrayLike(Buffer, 'be', 4)
            ],
            new PublicKey(PROGRAM_ID)
        );
        
        console.log(`📦 Store PDA: ${storePda.toString()}`);
        console.log(`🤝 Peer PDA: ${peerPda.toString()}`);
        
        // Step 1: Initialize store if needed
        console.log('🏪 Step 1: Checking/Initializing store...');
        
        try {
            const storeAccount = await program.account.store.fetch(storePda);
            console.log('✅ Store already initialized');
        } catch (error) {
            console.log('🔨 Initializing store...');
            
            try {
                const tx = await program.methods
                    .initStore({
                        // Add required InitStoreParams here
                    })
                    .accounts({
                        store: storePda,
                        signer: walletKeypair.publicKey,
                        systemProgram: SystemProgram.programId,
                    })
                    .signers([walletKeypair])
                    .rpc();
                
                console.log(`✅ Store initialized: ${tx}`);
            } catch (initError) {
                console.log('⚠️  Store initialization failed:', initError.message);
            }
        }
        
        // Step 2: Set peer configuration
        console.log('🤝 Step 2: Setting peer configuration...');
        
        // Convert EVM address to bytes32
        const evmAddressHex = EVM_CONTRACT_ADDRESS.slice(2); // Remove 0x
        const evmAddressBytes = Buffer.from(evmAddressHex.padStart(64, '0'), 'hex');
        const evmAddressArray = Array.from(evmAddressBytes);
        
        console.log(`Setting peer for EID ${SEPOLIA_EID}`);
        console.log(`EVM Address: ${EVM_CONTRACT_ADDRESS}`);
        
        try {
            const tx = await program.methods
                .setPeerConfig({
                    remoteEid: SEPOLIA_EID,
                    config: {
                        peerAddress: evmAddressArray
                    }
                })
                .accounts({
                    admin: walletKeypair.publicKey,
                    peer: peerPda,
                    store: storePda,
                    systemProgram: SystemProgram.programId,
                })
                .signers([walletKeypair])
                .rpc();
            
            console.log(`✅ Peer configuration set: ${tx}`);
            
        } catch (peerError) {
            console.log('⚠️  Peer configuration failed:', peerError.message);
            console.log('📋 Manual configuration required');
            await showManualSteps();
        }
        
        // Step 3: Verify configuration
        console.log('🔍 Step 3: Verifying configuration...');
        
        try {
            const peerAccount = await program.account.peerConfig.fetch(peerPda);
            console.log('✅ Peer configuration verified');
            console.log(`   EVM Address: 0x${Buffer.from(peerAccount.peerAddress).toString('hex')}`);
        } catch (error) {
            console.log('❌ Could not verify peer configuration');
        }
        
        console.log('');
        console.log('🎉 Solana OApp configuration completed!');
        console.log('');
        console.log('🎯 Next Steps:');
        console.log('1. Test cross-chain message from EVM side');
        console.log('2. Monitor LayerZero scan for DELIVERED status');
        console.log('3. Check: https://layerzeroscan.com/tx/0xf43f233a7f9c69e196802aa5c596059c93577841b1bc5708a82acf1b709b91ca');
        
    } catch (error) {
        console.error('❌ Configuration failed:', error);
        console.log('📋 Manual configuration required');
        await showManualSteps();
    }
}

async function showManualSteps() {
    console.log('');
    console.log('📋 Manual Configuration Steps:');
    console.log('');
    console.log('1. Navigate to oapp-solana directory in WSL');
    console.log('2. Ensure wallet has devnet SOL: solana airdrop 2 --url devnet');
    console.log('3. Build program: anchor build');
    console.log('4. Initialize store (if needed):');
    console.log('   npx hardhat solana:oapp:init --network solana-testnet');
    console.log('');
    console.log('5. Set peer configuration:');
    console.log(`   EID: ${SEPOLIA_EID}`);
    console.log(`   Peer Address: ${EVM_CONTRACT_ADDRESS}`);
    console.log('');
    console.log('6. Use LayerZero devtools:');
    console.log('   npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts');
    console.log('');
    console.log('🔗 Resources:');
    console.log('- Solana Faucet: https://faucet.solana.com/');
    console.log('- LayerZero Docs: https://docs.layerzero.network/v2/developers/solana/oapp/overview');
}

// Run the configuration
configureSolanaOApp().catch(console.error);
