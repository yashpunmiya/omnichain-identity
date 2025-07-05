// Direct ULN Configuration Fix for Solana
// This script directly configures ULN for Solana to receive messages from Sepolia
// Works without requiring hardhat to read Solana keypair

const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log('🚀 Starting Direct Solana ULN Configuration Fix');
console.log('==============================================');

// Configuration
const SOLANA_PROGRAM_ID = 'DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz';
const EVM_CONTRACT_ADDRESS = '0xB1e741BDe82434a7E5DcB805a89977be337A7ffA'; 
const SEPOLIA_EID = 30161;

console.log(`📋 Solana Program ID: ${SOLANA_PROGRAM_ID}`);
console.log(`📋 EVM Contract: ${EVM_CONTRACT_ADDRESS}`);
console.log(`📋 Sepolia EID: ${SEPOLIA_EID}`);

// Function to run a command and return a promise
function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout.trim());
        });
    });
}

// Main async function
async function main() {
    try {
        // Step 1: Verify Solana CLI setup
        console.log('\n🔍 Checking Solana CLI...');
        try {
            const solanaVersion = await runCommand('solana --version');
            console.log(`✅ Solana CLI installed: ${solanaVersion}`);
        } catch (error) {
            console.error('❌ Solana CLI not found or not working');
            return;
        }

        // Step 2: Check if keypair exists
        console.log('\n🔍 Checking for Solana keypair...');
        try {
            const pubkey = await runCommand('solana address');
            console.log(`✅ Found keypair with address: ${pubkey}`);
        } catch (error) {
            console.error('❌ Could not get Solana address. Make sure your keypair is correctly set up');
            return;
        }

        // Step 3: Configure Solana CLI
        console.log('\n🔧 Setting Solana config to devnet...');
        try {
            await runCommand('solana config set --url devnet');
            console.log('✅ Solana config set to devnet');
        } catch (error) {
            console.error('❌ Failed to set Solana config');
            return;
        }

        // Step 4: Check balance
        console.log('\n💰 Checking Solana balance...');
        try {
            const balance = await runCommand('solana balance');
            console.log(`✅ Current balance: ${balance}`);
            
            // If balance is too low, attempt an airdrop
            if (parseFloat(balance.split(' ')[0]) < 1) {
                console.log('💸 Balance is low, requesting airdrop...');
                try {
                    await runCommand('solana airdrop 2');
                    console.log('✅ Airdrop successful');
                } catch (e) {
                    console.log('⚠️ Airdrop failed, but continuing...');
                }
            }
        } catch (error) {
            console.error('❌ Failed to check balance');
            return;
        }

        console.log('\n📋 ULN Configuration Steps:');
        console.log('1. Run these commands one by one:');
        console.log('   - solana config set --url devnet');
        console.log('   - cd /mnt/c/Users/yyash/Coding/omnichain\\ identity/omnichain-identity/oapp-solana');
        console.log('\n2. Try running this command to check debug info:');
        console.log('   - npx hardhat lz:oapp:solana:debug --network solana-testnet --oapp-address DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz');
        
        console.log('\n3. Try running this command to wire the configuration:');
        console.log('   - npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts --network solana-testnet');

        console.log('\n4. If you keep getting keypair errors, try this:');
        console.log('   - cp ~/.config/solana/id.json /mnt/c/Users/yyash/.config/solana/id.json');
        console.log('   - This copies your keypair to where Node.js might be looking for it');

        console.log('\n5. If all else fails, use the LayerZero CLI directly:');
        console.log('   - npm install -g @layerzerolabs/lz-cli');
        console.log('   - lz config -n devnet');
        console.log('   - lz oapp:configure -o DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz -e 40168 --peer-eid 30161 --peer-address 0xB1e741BDe82434a7E5DcB805a89977be337A7ffA');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the main function
main();
