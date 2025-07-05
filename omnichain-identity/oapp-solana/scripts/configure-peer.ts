#!/usr/bin/env ts-node

import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import * as fs from 'fs';

// Configuration
const SOLANA_RPC_URL = 'https://api.devnet.solana.com';
const OAPP_PROGRAM_ID = 'DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz';
const SEPOLIA_EID = 40161;
const EVM_CONTRACT_ADDRESS = '0x429B3fc57dD1000eBd6eC9A77e7f3E0ABdD252fa';

async function configureSolanaPeer() {
    console.log('🔧 Configuring Solana Peer for LayerZero...');
    
    try {
        // Load wallet from file (you'll need to specify the path)
        const walletPath = process.env.SOLANA_WALLET_PATH || './id.json';
        if (!fs.existsSync(walletPath)) {
            console.error('❌ Wallet file not found. Please set SOLANA_WALLET_PATH environment variable.');
            console.log('💡 Generate a wallet with: solana-keygen new --outfile ./id.json');
            return;
        }
        
        const walletKeypair = Keypair.fromSecretKey(
            Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf8')))
        );
        
        console.log(`🔑 Using wallet: ${walletKeypair.publicKey.toString()}`);
        
        // Setup connection and provider
        const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
        const wallet = new NodeWallet(walletKeypair);
        const provider = new AnchorProvider(connection, wallet, {});
        
        // Check wallet balance
        const balance = await connection.getBalance(walletKeypair.publicKey);
        console.log(`💰 Wallet balance: ${balance / 1e9} SOL`);
        
        if (balance < 0.01 * 1e9) {
            console.log('💸 Low balance! Get devnet SOL: https://faucet.solana.com/');
        }
        
        // Load the program IDL
        const programId = new PublicKey(OAPP_PROGRAM_ID);
        
        // You would need to load your program's IDL here
        // For now, we'll show the conceptual structure
        console.log('\n📋 Peer Configuration Steps:');
        console.log('1. Initialize Store Account (if not done)');
        console.log('2. Set Peer Config for Sepolia EID');
        console.log('3. Configure message library settings');
        
        // Derive store PDA
        const [storePda] = PublicKey.findProgramAddressSync(
            [Buffer.from('Store')],
            programId
        );
        console.log(`📦 Store PDA: ${storePda.toString()}`);
        
        // Derive peer config PDA
        const [peerPda] = PublicKey.findProgramAddressSync(
            [
                Buffer.from('Peer'),
                storePda.toBuffer(),
                Buffer.from(SEPOLIA_EID.toString().padStart(8, '0'), 'hex')
            ],
            programId
        );
        console.log(`🤝 Peer PDA: ${peerPda.toString()}`);
        
        console.log('\n⚠️  Manual Configuration Required:');
        console.log('Since the program structure is custom, you need to:');
        console.log(`1. Call set_peer_config with EID: ${SEPOLIA_EID}`);
        console.log(`2. Set peer address: ${EVM_CONTRACT_ADDRESS}`);
        console.log('3. Configure DVN and executor settings');
        
        console.log('\n📖 Example Anchor command:');
        console.log(`anchor run setPeer --provider.cluster devnet -- --eid ${SEPOLIA_EID} --peer ${EVM_CONTRACT_ADDRESS}`);
        
    } catch (error) {
        console.error('❌ Configuration failed:', error);
    }
}

configureSolanaPeer().catch(console.error);
