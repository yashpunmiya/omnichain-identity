// Direct LayerZero configuration for Solana using JavaScript
const { SolanaEndpoint } = require('@layerzerolabs/lz-solana');
const { PublicKey } = require('@solana/web3.js');
const fs = require('fs');
const os = require('os');

// Configuration
const SOLANA_PROGRAM_ID = 'DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz';
const EVM_CONTRACT_ADDRESS = '0xB1e741BDe82434a7E5DcB805a89977be337A7ffA';
const SEPOLIA_EID = 30161;

async function configureSolanaULN() {
    try {
        console.log('🚀 Configuring Solana ULN directly...');

        // Get keypair
        const keypairPath = `${os.homedir()}/.config/solana/id.json`;
        if (!fs.existsSync(keypairPath)) {
            console.error(`❌ Keypair not found at ${keypairPath}`);
            return;
        }

        // Load keypair and connect to endpoint
        const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
        
        // Create endpoints and configure
        console.log('📋 Configuration details:');
        console.log(`Solana Program: ${SOLANA_PROGRAM_ID}`);
        console.log(`EVM Contract: ${EVM_CONTRACT_ADDRESS}`);
        console.log(`Sepolia EID: ${SEPOLIA_EID}`);
        
        console.log(`\n❌ This script requires additional configuration.`);
        console.log(`Please try these commands in WSL instead:`);
        
        console.log(`\n1. Install the LayerZero CLI:`);
        console.log(`npm install -g @layerzerolabs/lz-cli`);
        
        console.log(`\n2. Configure for devnet:`);
        console.log(`lz config -n devnet`);
        
        console.log(`\n3. Configure OApp peering:`);
        console.log(`lz oapp:configure -o ${SOLANA_PROGRAM_ID} -e 40168 --peer-eid ${SEPOLIA_EID} --peer-address ${EVM_CONTRACT_ADDRESS}`);
        
        console.log(`\n4. Configure ULN settings:`);
        console.log(`lz oapp:set-receive-uln -o ${SOLANA_PROGRAM_ID} -e 40168 --from-eid ${SEPOLIA_EID} --dvn-count 1`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

configureSolanaULN();
