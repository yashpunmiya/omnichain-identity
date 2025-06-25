# Troubleshooting Guide for Omnichain Identity Project

## 🔧 Solana Program Issues

### ❌ Error: "Failed to build anchor program"
- **Possible cause**: Missing dependencies
- **Solution**: 
  ```bash
  sudo apt update
  sudo apt install build-essential libudev-dev -y
  ```

### ❌ Error: "Transaction simulation failed: Error processing Instruction"
- **Possible cause**: Incorrect program ID in code vs deployed ID
- **Solution**: 
  1. Get your program ID: `solana address -k target/deploy/oapp-keypair.json`
  2. Update the ID in `lib.rs` and `Anchor.toml`
  3. Rebuild: `anchor build`
  4. Redeploy: `anchor deploy --provider.cluster devnet`

### ❌ Error: "Endpoint module not found"
- **Possible cause**: Using the wrong LayerZero import
- **Solution**: Follow the exact structure in the official example

## 🔧 EVM Contract Issues

### ❌ Error: "LayerZero endpoint not found"
- **Possible cause**: Wrong network or endpoint address
- **Solution**: Verify endpoint addresses in your .env file against [LayerZero's docs](https://docs.layerzero.network/v2/developers/evm/contract-addresses)

### ❌ Error: "Insufficient funds for gas * price + value"
- **Possible cause**: Not enough testnet tokens or high gas price
- **Solution**: 
  1. Get more testnet tokens from a faucet
  2. Adjust the gas settings in the deploy script

## 🔧 Frontend Issues

### ❌ Error: "Cannot find module '@solana/wallet-adapter'"
- **Possible cause**: Missing dependencies
- **Solution**: 
  ```bash
  npm install @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets @solana/web3.js
  ```

### ❌ Error: "Invalid program id"
- **Possible cause**: Using the wrong program ID in the frontend
- **Solution**: Double check your .env.local file has the correct values:
  ```
  VITE_SOLANA_PROGRAM_ID=your_actual_deployed_program_id
  ```

### ❌ Error: "Cannot connect to wallet"
- **Possible cause**: Browser extension not installed or locked
- **Solution**: Install/unlock Phantom or other Solana wallet extension

## 🔧 Cross-Chain Issues

### ❌ Error: "LayerZero message failed"
- **Possible cause**: Wrong Solana destination encoding
- **Solution**: Verify your solanaProgramId in the EVM contract is correctly formatted

### ❌ Error: "Message never received on Solana"
- **Possible causes**: 
  1. Gas fee too low
  2. Wrong destination address
- **Solution**: 
  1. Increase gas fee for LayerZero message
  2. Use LayerZeroScan to debug transaction

## 🔍 Diagnostic Commands

### 🔹 Check Solana Program
```bash
# View program account
solana program show YOUR_PROGRAM_ID --url devnet

# Check your PDA account
solana account ADDRESS_OF_PDA --url devnet
```

### 🔹 Verify EVM Contract
```bash
# Check contract bytecode (via Etherscan API)
curl https://api-testnet.etherscan.io/api?module=contract&action=getabi&address=YOUR_CONTRACT_ADDRESS
```

### 🔹 Test LayerZero Connection
```bash
# Verify chain is supported
npx hardhat run scripts/verify-lz-connection.js --network ethereum
```
