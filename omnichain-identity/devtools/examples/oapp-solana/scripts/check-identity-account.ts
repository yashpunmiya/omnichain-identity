// check-identity-account.ts
import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import fs from 'fs';
import path from 'path';

async function main() {
  const programId = new PublicKey('DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz');
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Get the Solana address from command line
  const solanaAddressStr = process.argv[2];
  if (!solanaAddressStr) {
    console.error('Please provide a Solana address');
    console.log('Usage: yarn run ts-node scripts/check-identity-account.ts <SOLANA_ADDRESS>');
    process.exit(1);
  }
  
  const solanaAddress = new PublicKey(solanaAddressStr);
  console.log(`Checking identity account for Solana address: ${solanaAddressStr}`);
  
  // Derive the PDA
  const [identityPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('identity'), solanaAddress.toBuffer()],
    programId
  );
  
  console.log(`Identity PDA: ${identityPDA.toString()}`);
  
  try {
    // Get account info
    const accountInfo = await connection.getAccountInfo(identityPDA);
    
    if (!accountInfo) {
      console.log('❌ No identity account found for this address');
      console.log('You may need to initialize an identity account first');
      return;
    }
    
    console.log('✅ Identity account found!');
    console.log(`Account size: ${accountInfo.data.length} bytes`);
    
    // Try to load the IDL
    try {
      // Path to the IDL file (adjust as needed for your project structure)
      const idlPath = path.join(__dirname, '../target/idl/my_oapp.json');
      const idlJson = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
      
      // Create program
      const provider = new anchor.AnchorProvider(
        connection,
        {} as any, // We don't need a wallet for readonly operations
        { commitment: 'confirmed' }
      );
      
      const program = new anchor.Program(idlJson, programId, provider);
      
      // Fetch account data
      const accountData = await program.account.identityAccount.fetch(identityPDA);
      
      console.log('\n✅ Identity Account Data:');
      console.log(`Authority: ${accountData.authority.toString()}`);
      console.log(`Linked Addresses: ${accountData.linkedAddresses.length}`);
      console.log(`Bump: ${accountData.bump}`);
      
      if (accountData.linkedAddresses.length > 0) {
        console.log('\nLinked EVM Addresses:');
        accountData.linkedAddresses.forEach((addr: string, index: number) => {
          console.log(`${index + 1}. ${addr}`);
        });
      } else {
        console.log('\nNo linked EVM addresses found.');
      }
      
      return accountData;
    } catch (idlError) {
      console.log('Could not load IDL for detailed parsing. Showing raw data:');
      // Just show the raw bytes if we can't parse with IDL
      console.log('Raw data (hex):');
      console.log(Buffer.from(accountInfo.data).toString('hex'));
    }
  } catch (error) {
    console.error('Error checking identity account:', error);
  }
}

main().catch(console.error);
