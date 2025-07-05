const { Connection, PublicKey, Keypair, SystemProgram, Transaction } = require('@solana/web3.js');
const { AnchorProvider, Program, web3, BN } = require('@coral-xyz/anchor');
const fs = require('fs');
const path = require('path');

// Configuration
const SOLANA_RPC_URL = 'https://api.devnet.solana.com';
const PROGRAM_ID = 'DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz';
const EVM_CONTRACT_ADDRESS = '0x429B3fc57dD1000eBd6eC9A77e7f3E0ABdD252fa';
const SEPOLIA_EID = 40161;

// LayerZero Endpoint on Solana Devnet
const LAYERZERO_ENDPOINT = '76y77prsiCMvXMjuoZ5VRrhG5qYBrUMYTE5WgHqgjEn6';

// Seeds from the Rust program
const STORE_SEED = Buffer.from('Store');
const PEER_SEED = Buffer.from('Peer');
const LZ_RECEIVE_TYPES_SEED = Buffer.from('LzReceiveTypes');

async function initializeSolanaOApp() {
    console.log('🚀 Initializing Solana OApp for LayerZero V2...');
    
    try {
        // Setup connection
        const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
        const programId = new PublicKey(PROGRAM_ID);
        const endpoint = new PublicKey(LAYERZERO_ENDPOINT);
        
        // Load wallet
        const walletPath = process.env.SOLANA_WALLET_PATH || path.join(process.env.HOME, '.config', 'solana', 'id.json');
        
        if (!fs.existsSync(walletPath)) {
            console.error('❌ Wallet file not found at:', walletPath);
            console.log('💡 Set SOLANA_WALLET_PATH environment variable or ensure wallet exists');
            return;
        }
        
        const walletKeypair = Keypair.fromSecretKey(
            Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf8')))
        );
        
        console.log(`🔑 Using wallet: ${walletKeypair.publicKey.toString()}`);
        
        // Check balance
        const balance = await connection.getBalance(walletKeypair.publicKey);
        console.log(`💰 Balance: ${balance / 1e9} SOL`);
        
        if (balance < 0.1 * 1e9) {
            console.log('💸 Low balance! Get devnet SOL: https://faucet.solana.com/');
            return;
        }
        
        // Derive PDAs using exact seeds from Rust program
        const [storePda, storeBump] = PublicKey.findProgramAddressSync(
            [STORE_SEED],
            programId
        );
        
        const [lzReceiveTypesPda, lzReceiveTypesBump] = PublicKey.findProgramAddressSync(
            [LZ_RECEIVE_TYPES_SEED, storePda.toBuffer()],
            programId
        );
        
        const [peerPda, peerBump] = PublicKey.findProgramAddressSync(
            [PEER_SEED, storePda.toBuffer(), new BN(SEPOLIA_EID).toArrayLike(Buffer, 'be', 4)],
            programId
        );
        
        console.log(`📦 Store PDA: ${storePda.toString()}`);
        console.log(`🔗 LzReceiveTypes PDA: ${lzReceiveTypesPda.toString()}`);
        console.log(`🤝 Peer PDA: ${peerPda.toString()}`);
        
        // Step 1: Check if store exists, initialize if needed
        console.log('🏪 Step 1: Checking/Initializing store...');
        
        const storeAccount = await connection.getAccountInfo(storePda);
        if (!storeAccount) {
            console.log('🔨 Initializing store...');
            
            // Build the InitStore instruction manually
            const initStoreIx = new web3.TransactionInstruction({
                keys: [
                    { pubkey: walletKeypair.publicKey, isSigner: true, isWritable: true }, // payer
                    { pubkey: storePda, isSigner: false, isWritable: true }, // store
                    { pubkey: lzReceiveTypesPda, isSigner: false, isWritable: true }, // lz_receive_types_accounts
                    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
                ],
                programId: programId,
                data: Buffer.concat([
                    Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]), // init_store discriminator
                    walletKeypair.publicKey.toBuffer(), // admin
                    endpoint.toBuffer(), // endpoint
                ])
            });
            
            const initStoreTx = new Transaction().add(initStoreIx);
            
            try {
                const signature = await web3.sendAndConfirmTransaction(
                    connection, 
                    initStoreTx, 
                    [walletKeypair],
                    { commitment: 'confirmed' }
                );
                console.log(`✅ Store initialized: ${signature}`);
            } catch (error) {
                console.log('⚠️  Store initialization failed:', error.message);
                // Try using LayerZero devtools instead
                console.log('🔧 Try running: npx hardhat lz:oapp:solana:init-config --network solana-testnet');
                return;
            }
        } else {
            console.log('✅ Store already initialized');
        }
        
        // Step 2: Set peer configuration for Sepolia
        console.log('🤝 Step 2: Setting peer configuration...');
        
        // Convert EVM address to 32-byte array (pad with zeros)
        const evmAddressHex = EVM_CONTRACT_ADDRESS.slice(2);
        const evmAddressBytes = Buffer.from(evmAddressHex.padStart(64, '0'), 'hex');
        
        console.log(`Setting peer for EID ${SEPOLIA_EID}`);
        console.log(`EVM Address: ${EVM_CONTRACT_ADDRESS}`);
        
        // Build SetPeerConfig instruction
        const setPeerConfigIx = new web3.TransactionInstruction({
            keys: [
                { pubkey: walletKeypair.publicKey, isSigner: true, isWritable: true }, // admin
                { pubkey: peerPda, isSigner: false, isWritable: true }, // peer
                { pubkey: storePda, isSigner: false, isWritable: false }, // store
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
            ],
            programId: programId,
            data: Buffer.concat([
                Buffer.from([155, 129, 130, 154, 204, 221, 151, 204]), // set_peer_config discriminator
                new BN(SEPOLIA_EID).toArrayLike(Buffer, 'le', 4), // remote_eid (little endian)
                Buffer.from([0]), // PeerConfigParam::PeerAddress variant
                evmAddressBytes, // peer_address as 32 bytes
            ])
        });
        
        const setPeerTx = new Transaction().add(setPeerConfigIx);
        
        try {
            const signature = await web3.sendAndConfirmTransaction(
                connection, 
                setPeerTx, 
                [walletKeypair],
                { commitment: 'confirmed' }
            );
            console.log(`✅ Peer configuration set: ${signature}`);
        } catch (error) {
            console.log('⚠️  Peer configuration failed:', error.message);
            console.log('🔧 Try running: npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts');
        }
        
        // Step 3: Verify configuration
        console.log('🔍 Step 3: Verifying configuration...');
        
        const finalStoreAccount = await connection.getAccountInfo(storePda);
        const finalPeerAccount = await connection.getAccountInfo(peerPda);
        
        console.log(`Store Account: ${finalStoreAccount ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`Peer Account: ${finalPeerAccount ? '✅ EXISTS' : '❌ MISSING'}`);
        
        if (finalStoreAccount && finalPeerAccount) {
            console.log('');
            console.log('🎉 Solana OApp configuration completed successfully!');
            console.log('');
            console.log('🎯 Next Steps:');
            console.log('1. Test cross-chain message from EVM side');
            console.log('2. Monitor LayerZero scan for DELIVERED status');
            console.log('3. Check: https://layerzeroscan.com/tx/0xf43f233a7f9c69e196802aa5c596059c93577841b1bc5708a82acf1b709b91ca');
        } else {
            console.log('');
            console.log('⚠️  Configuration incomplete. Try manual setup:');
            console.log('1. cd oapp-solana');
            console.log('2. npx hardhat lz:oapp:solana:init-config --network solana-testnet');
            console.log('3. npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts');
        }
        
    } catch (error) {
        console.error('❌ Configuration failed:', error);
        console.log('');
        console.log('📋 Manual steps:');
        console.log('1. Check your Solana wallet has sufficient SOL');
        console.log('2. Ensure the program is deployed correctly');
        console.log('3. Try using LayerZero devtools directly');
    }
}

// Run the configuration
if (require.main === module) {
    initializeSolanaOApp().catch(console.error);
}

module.exports = { initializeSolanaOApp };
