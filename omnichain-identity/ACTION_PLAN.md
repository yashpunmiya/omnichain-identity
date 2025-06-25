# Omnichain Identity Linker: Action Plan

## Immediate Next Steps

### 1. Deploy Solana Program
```bash
# Make sure you're in the right directory
cd devtools/examples/oapp-solana

# Build the program
anchor build

# Get the program ID
solana address -k target/deploy/my_oapp-keypair.json

# Update the program ID in Anchor.toml and lib.rs if needed

# Deploy to Solana devnet
anchor deploy --provider.cluster devnet

# Note down the program ID for future reference
```

### 2. Deploy EVM Contract
```bash
# Navigate to the EVM contracts directory
cd omnichain-identity/evm-contracts

# Install dependencies if not done already
npm install

# Create or update .env file with your private key and endpoints
# PRIVATE_KEY=your_private_key_here
# ALCHEMY_API_KEY=your_alchemy_api_key
# LZ_ETHEREUM_ENDPOINT=0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675
# LZ_POLYGON_ENDPOINT=0x3c2269811836af69497E5F486A85D7316753cf62
# LZ_BSC_ENDPOINT=0x3c2269811836af69497E5F486A85D7316753cf62

# Deploy the contract (choose your preferred network)
npx hardhat run scripts/deploy.js --network sepolia

# Verify the LayerZero connection
npx hardhat run scripts/verify-lz-connection.js --network sepolia

# Save the deployed contract address
```

### 3. Test Cross-Chain Identity Linking

#### 3.1 Initialize Solana Identity Account
Create a test script or use the CLI to:
- Initialize an identity account for your Solana wallet
- Verify the account was created correctly

#### 3.2 Send Link Request from EVM
- Use the deployed EVM contract to send a link request
- Include your Solana wallet address in the request
- Monitor the transaction status on LayerZeroScan

#### 3.3 Verify Link on Solana
- Check if your identity account has been updated with the EVM address
- Try both the `get_linked_addresses` and `is_address_linked` functions

### 4. Frontend Integration

#### 4.1 Update Configuration
- Update the program IDs and contract addresses in your frontend config
- Ensure all dependencies for Solana and EVM interaction are installed

#### 4.2 Implement UI Flows
- Wallet connection for both chains
- Link creation interface
- Address verification display

#### 4.3 Test End-to-End
- Perform a complete test of the linking process through the UI
- Verify the results on both chains

## Documentation & Submission

### 1. Finalize Documentation
- Update README with deployment instructions
- Complete any missing details in implementation guides
- Include screenshots of the working application

### 2. Prepare Hackathon Submission
- Record a demo video if required
- Write a concise project description
- Highlight the innovation and potential use cases

### 3. Submit Your Project
- Follow the hackathon submission guidelines
- Include all necessary links and documentation
