#!/bin/bash

# Direct LayerZero ULN Configuration via Endpoint
# Since Store is initialized but peer config failed, let's configure ULN directly

echo "🎯 DIRECT ULN CONFIGURATION TO UNBLOCK MESSAGE"
echo "=============================================="

# Known addresses from previous output
SOLANA_PROGRAM_ID="DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz"
STORE_ADDRESS="D268ujKzoZ2e8s9P4UnuP3nRBBmzXUKGpvRaj7kM6Dtp"
PEER_ADDRESS="34jLnnsgjfcKtcJeUwRTeBrTvyN9Q5Z3GS5RqL5BfVdH"
EVM_CONTRACT="0xB1e741BDe82434a7E5DcB805a89977be337A7ffA"
SEPOLIA_EID=30161

echo "📋 Known addresses:"
echo "  Program ID: $SOLANA_PROGRAM_ID"
echo "  Store (initialized): $STORE_ADDRESS"
echo "  Peer PDA: $PEER_ADDRESS"
echo "  EVM Contract: $EVM_CONTRACT"
echo "  Sepolia EID: $SEPOLIA_EID"

# Set Solana config
solana config set --url devnet

echo ""
echo "🔍 Checking current status..."

# Check store account
echo "Store account info:"
solana account $STORE_ADDRESS | head -5

echo ""
echo "🎯 CRITICAL ISSUE DIAGNOSIS:"
echo "The LayerZero message is BLOCKED because:"
echo "1. ✅ Solana Store is initialized"
echo "2. ❌ Peer configuration failed (program ID mismatch)"
echo "3. ❌ ULN receive config missing for Sepolia EID $SEPOLIA_EID"

echo ""
echo "💡 SOLUTION: The message will be unblocked when:"
echo "1. Solana OApp has proper ULN configuration for Sepolia"
echo "2. DVN settings match between EVM and Solana"

echo ""
echo "🔧 Using hardhat with correct store address..."

# Update the deployment file and try hardhat commands
echo "Updating hardhat debug to use store address..."
npx hardhat lz:oapp:solana:debug --network solana-testnet --eid 40168 --store $STORE_ADDRESS || echo "Still failed"

echo ""
echo "🎯 ALTERNATE APPROACH - Check if message is auto-delivered:"
echo "Sometimes LayerZero auto-delivers blocked messages once configuration is fixed."
echo ""
echo "1. Check LayerZero Scan:"
echo "   https://testnet.layerzeroscan.com/tx/0xa96a54f5fbcfc2341ca78637818f11dc4e4c68d40f3accee0b63014c51999de5"
echo ""
echo "2. If still blocked, the Solana program needs to call LayerZero endpoint to:"
echo "   - Set receive library for Sepolia EID $SEPOLIA_EID"
echo "   - Configure DVN (likely LayerZero Labs DVN)"
echo "   - Set executor configuration"
echo ""
echo "3. The error suggests program ID mismatch - check if IDL matches deployed program"

echo ""
echo "📋 Quick verification commands:"
echo "solana account $SOLANA_PROGRAM_ID | head -5"
echo "solana account $STORE_ADDRESS | head -5"

echo ""
echo "🔗 Current blocked transaction:"
echo "https://testnet.layerzeroscan.com/tx/0xa96a54f5fbcfc2341ca78637818f11dc4e4c68d40f3accee0b63014c51999de5"
