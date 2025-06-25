# Testing Guide for Omnichain Identity Linker

This guide provides step-by-step instructions for testing the Omnichain Identity Linker system.

## Prerequisites

- Rust and Solana tools installed
- Node.js and npm installed
- Anchor framework installed
- Solana wallet with devnet SOL
- EVM wallet with testnet funds (Sepolia, Mumbai, or BSC Testnet)

## Step 1: Build and Deploy the Solana Program

1. Clone the repository and navigate to the project folder:
   ```bash
   cd omnichain-identity/devtools/examples/oapp-solana
   ```

2. Build the Anchor program:
   ```bash
   anchor build
   ```

3. Get the program ID:
   ```bash
   solana address -k target/deploy/my_oapp-keypair.json
   ```

4. Update the program ID in Anchor.toml and lib.rs:
   ```rust
   declare_id!("YOUR_PROGRAM_ID_HERE");
   ```

5. Deploy to Solana devnet:
   ```bash
   anchor deploy --provider.cluster devnet
   ```

## Step 2: Deploy the EVM Contract

1. Navigate to the EVM contracts directory:
   ```bash
   cd omnichain-identity/evm-contracts
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your private key and endpoints:
   ```
   PRIVATE_KEY=your_private_key_here
   ALCHEMY_API_KEY=your_alchemy_api_key
   
   # LayerZero Endpoints
   LZ_ETHEREUM_ENDPOINT=0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675
   LZ_POLYGON_ENDPOINT=0x3c2269811836af69497E5F486A85D7316753cf62
   LZ_BSC_ENDPOINT=0x3c2269811836af69497E5F486A85D7316753cf62
   ```

4. Deploy the contract to your chosen testnet:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

5. Verify the LayerZero connection:
   ```bash
   npx hardhat run scripts/verify-lz-connection.js --network sepolia
   ```

## Step 3: Test Identity Account Initialization

1. Run the Solana test client:
   ```bash
   cd tests
   npm install
   ```

2. Create a Solana identity account:
   ```javascript
   const { initializeIdentityAccount } = require('../app/src/utils/solana');
   
   // ... connection and wallet setup code ...
   
   const result = await initializeIdentityAccount(connection, wallet);
   console.log('Identity account initialized:', result);
   ```

3. Check that the account was created:
   ```javascript
   const { getLinkedAddresses } = require('../app/src/utils/solana');
   
   const linkedAddresses = await getLinkedAddresses(connection, wallet.publicKey);
   console.log('Linked addresses:', linkedAddresses); // Should be empty initially
   ```

## Step 4: Test Cross-Chain Identity Linking

1. Send a linking message from EVM:
   ```javascript
   // Initialize the contract with ethers.js
   const contractAddress = "YOUR_CONTRACT_ADDRESS";
   const contract = new ethers.Contract(contractAddress, abi, signer);
   
   // Link addresses
   const solanaAddress = "YOUR_SOLANA_ADDRESS";
   const tx = await contract.linkAddress(solanaAddress, "0x0", { 
     value: ethers.parseEther("0.01") // For LayerZero fees
   });
   
   await tx.wait();
   console.log("Link request sent:", tx.hash);
   ```

2. Monitor the transaction on LayerZeroScan:
   - Go to https://testnet.layerzeroscan.com/
   - Enter your transaction hash to see the cross-chain message status

3. After message delivery, check linked addresses:
   ```javascript
   const linkedAddresses = await getLinkedAddresses(connection, wallet.publicKey);
   console.log('Linked addresses after linking:', linkedAddresses);
   ```

## Step 5: Test Manual Address Linking

1. Add an address manually:
   ```javascript
   const { addLinkedAddress } = require('../app/src/utils/solana');
   
   const evmAddress = "0x1234567890123456789012345678901234567890";
   const result = await addLinkedAddress(connection, wallet, evmAddress);
   console.log('Address manually added:', result);
   ```

2. Verify the address is linked:
   ```javascript
   const { isAddressLinked } = require('../app/src/utils/solana');
   
   const isLinked = await isAddressLinked(connection, wallet.publicKey, evmAddress);
   console.log('Address is linked:', isLinked); // Should be true
   ```

## Troubleshooting

### LayerZero Message Not Arriving
- Check the message status on LayerZeroScan
- Ensure you're using the correct Solana program ID in the EVM contract
- Make sure there are sufficient fees for the cross-chain message

### Solana Program Errors
- Check the Solana logs with `solana logs` command
- Ensure the account is initialized before checking linked addresses
- Verify that the proper permissions are in place for account operations

### EVM Contract Errors
- Check that the correct LayerZero endpoint is configured
- Ensure sufficient gas and value for the transaction
- Verify the message format is correct
