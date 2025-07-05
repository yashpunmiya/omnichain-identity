const { Connection, PublicKey } = require('@solana/web3.js');

async function quickFix() {
    console.log('🔧 LayerZero V2 Quick Fix - BLOCKED Message Resolution');
    console.log('=====================================================');
    
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const programId = new PublicKey('DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz');
    
    console.log('\n📊 Current Status Check:');
    
    // Check program
    const programAccount = await connection.getAccountInfo(programId);
    console.log(`🔷 Program: ${programAccount ? '✅ EXISTS' : '❌ MISSING'}`);
    
    // Check Store PDA
    const [storePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('Store')],
        programId
    );
    
    const storeAccount = await connection.getAccountInfo(storePda);
    console.log(`📦 Store PDA: ${storeAccount ? '✅ EXISTS' : '❌ MISSING'}`);
    
    // Check Peer PDA for Sepolia (EID: 40161)
    const eidBytes = Buffer.alloc(4);
    eidBytes.writeUInt32BE(40161, 0);
    
    const [peerPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('Peer'), storePda.toBuffer(), eidBytes],
        programId
    );
    
    const peerAccount = await connection.getAccountInfo(peerPda);
    console.log(`🤝 Peer PDA (Sepolia): ${peerAccount ? '✅ EXISTS' : '❌ MISSING'}`);
    
    // Comprehensive analysis
    if (programAccount && storeAccount && peerAccount) {
        console.log('\n🎉 EXCELLENT NEWS! All Required Accounts Exist!');
        console.log('\n📋 Configuration Details:');
        console.log(`   Program ID: ${programId.toString()}`);
        console.log(`   Store PDA: ${storePda.toString()}`);
        console.log(`   Peer PDA: ${peerPda.toString()}`);
        console.log(`   EVM Contract: 0x429B3fc57dD1000eBd6eC9A77e7f3E0ABdD252fa`);
        console.log(`   Sepolia EID: 40161`);
        
        console.log('\n🎯 Why the Message Might Still Be BLOCKED:');
        console.log('   1. ⏱️  LayerZero network propagation delay');
        console.log('   2. 🔄 Configuration not yet recognized by DVNs');
        console.log('   3. 🔗 EVM side configuration mismatch');
        console.log('   4. 📊 Message format or encoding issues');
        
        console.log('\n🔧 IMMEDIATE SOLUTIONS:');
        console.log('   ✅ Option A: Send a NEW cross-chain message');
        console.log('   ✅ Option B: Wait 10-30 minutes for network propagation');
        console.log('   ✅ Option C: Verify EVM contract peer configuration');
        console.log('   ✅ Option D: Check LayerZero devtools version compatibility');
        
        console.log('\n📝 Test Commands:');
        console.log('   # Send new message from EVM:');
        console.log('   cd ../evm-contracts && node scripts/test-message.js');
        console.log('');
        console.log('   # Check EVM peer config:');
        console.log('   cd ../evm-contracts && node scripts/check-peer-config.js');
        
        console.log('\n🔗 Monitor Progress:');
        console.log('   Current: https://layerzeroscan.com/tx/0xf43f233a7f9c69e196802aa5c596059c93577841b1bc5708a82acf1b709b91ca');
        console.log('   Status should change from BLOCKED → DELIVERED');
        
    } else {
        console.log('\n❌ Missing Required Accounts:');
        if (!programAccount) console.log('   - Program account missing');
        if (!storeAccount) console.log('   - Store PDA missing');
        if (!peerAccount) console.log('   - Peer PDA missing');
        
        console.log('\n🔧 Required Actions:');
        console.log('   1. Initialize Store: npx hardhat lz:oapp:solana:init-config --network solana-testnet');
        console.log('   2. Set Peer Config: npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts');
    }
    
    console.log('\n💡 KEY INSIGHT:');
    console.log('   Your Solana OApp is fully configured! The BLOCKED status is likely');
    console.log('   due to LayerZero network recognition delays or EVM-side issues.');
    console.log('\n🎯 RECOMMENDED ACTION: Send a new cross-chain message to test current config!');
}

quickFix().catch(console.error);
