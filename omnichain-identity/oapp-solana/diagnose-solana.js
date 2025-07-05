const { Connection, PublicKey } = require('@solana/web3.js');

async function diagnoseSolanaOApp() {
    console.log('🔍 Diagnosing Solana OApp Configuration...');
    
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const programId = new PublicKey('DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz');
    
    console.log('\n📋 Program Information:');
    console.log('Program ID:', programId.toString());
    
    try {
        // Check if program account exists
        const programAccount = await connection.getAccountInfo(programId);
        if (programAccount) {
            console.log('✅ Program account exists');
            console.log('   Owner:', programAccount.owner.toString());
            console.log('   Executable:', programAccount.executable);
            console.log('   Data length:', programAccount.data.length);
        } else {
            console.log('❌ Program account not found');
            return;
        }
        
        // Check various PDA seeds that LayerZero might use
        console.log('\n🔍 Checking possible Store PDAs:');
        
        const possibleStoreSeeds = [
            ['OAppStore'],
            ['Store'],
            ['OApp'],
            ['oapp_store'],
            ['OAPP_STORE'],
            ['LayerZeroStore'],
            ['lz_store']
        ];
        
        let foundStore = null;
        
        for (const seeds of possibleStoreSeeds) {
            try {
                const [storePda] = PublicKey.findProgramAddressSync(
                    seeds.map(s => Buffer.from(s)),
                    programId
                );
                
                const storeAccount = await connection.getAccountInfo(storePda);
                console.log(`   Seeds [${seeds.join(', ')}]: ${storePda.toString()} - ${storeAccount ? '✅ EXISTS' : '❌ NOT FOUND'}`);
                
                if (storeAccount && !foundStore) {
                    foundStore = { pda: storePda, seeds };
                }
            } catch (error) {
                console.log(`   Seeds [${seeds.join(', ')}]: Error deriving PDA`);
            }
        }
        
        if (foundStore) {
            console.log(`\n✅ Found Store PDA: ${foundStore.pda.toString()}`);
            console.log(`   Using seeds: [${foundStore.seeds.join(', ')}]`);
            
            // Check peer configuration
            console.log('\n🔍 Checking Peer Configuration for Sepolia (EID: 40161):');
            
            const eidBytes = Buffer.alloc(4);
            eidBytes.writeUInt32BE(40161, 0); // Big endian
            
            const possiblePeerSeeds = [
                ['Peer', foundStore.pda.toBuffer(), eidBytes],
                ['peer', foundStore.pda.toBuffer(), eidBytes],
                ['PEER', foundStore.pda.toBuffer(), eidBytes],
                ['PeerConfig', foundStore.pda.toBuffer(), eidBytes],
                ['peer_config', foundStore.pda.toBuffer(), eidBytes]
            ];
            
            for (const seeds of possiblePeerSeeds) {
                try {
                    const [peerPda] = PublicKey.findProgramAddressSync(seeds, programId);
                    const peerAccount = await connection.getAccountInfo(peerPda);
                    console.log(`   Peer PDA: ${peerPda.toString()} - ${peerAccount ? '✅ EXISTS' : '❌ NOT FOUND'}`);
                    
                    if (peerAccount) {
                        console.log(`   ✅ Found peer config for Sepolia!`);
                    }
                } catch (error) {
                    console.log(`   Peer PDA derivation failed with seed combination`);
                }
            }
        } else {
            console.log('\n❌ No Store PDA found with any common seed patterns');
            console.log('\n💡 This explains why the message is BLOCKED!');
            console.log('   The Solana OApp needs to be initialized first.');
        }
        
        // Check LayerZero endpoint configuration
        console.log('\n🔍 Checking LayerZero Endpoint Integration:');
        
        // Common LayerZero endpoint addresses on Solana Devnet
        const layerZeroEndpoint = new PublicKey('76y77prsiCMvXMjuoZ5VRrhG5qYBrUMYTE5WgHqgjEn6');
        const endpointAccount = await connection.getAccountInfo(layerZeroEndpoint);
        console.log(`   LayerZero Endpoint: ${layerZeroEndpoint.toString()} - ${endpointAccount ? '✅ EXISTS' : '❌ NOT FOUND'}`);
        
    } catch (error) {
        console.error('❌ Diagnosis failed:', error.message);
    }
    
    console.log('\n📋 Diagnosis Summary:');
    console.log('');
    console.log('If Store PDA is missing:');
    console.log('  1. Run: npx hardhat lz:oapp:solana:init-config --network solana-testnet');
    console.log('  2. Or initialize manually using Anchor CLI');
    console.log('');
    console.log('If Peer config is missing:');
    console.log('  1. Run: npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts');
    console.log('  2. Or set peer manually using program instructions');
    console.log('');
    console.log('🔗 Current LayerZero Scan Status:');
    console.log('   https://layerzeroscan.com/tx/0xf43f233a7f9c69e196802aa5c596059c93577841b1bc5708a82acf1b709b91ca');
}

diagnoseSolanaOApp().catch(console.error);
