# 🔧 LayerZero V2 Configuration & Troubleshooting Guide

## 📍 Current Status
Based on LayerZero scan, your transaction is **BLOCKED** with status "WAITING FOR ULN CONFIG". This means the configuration is incomplete.

## ⚡ Quick Fix Commands

### 1. EVM Side Configuration

```bash
cd evm-contracts

# Install dependencies if not done
npm install

# Configure peers and initial settings
npx hardhat run scripts/configure-layerzero.js --network sepolia

# Initialize LayerZero configuration
npm run lz:config:init

# Wire the configuration (this applies DVN, executor, and peer settings)
npm run lz:wire

# Verify configuration
npm run lz:config:get
```

### 2. Solana Side Configuration

```bash
cd oapp-solana

# Build the program
anchor build

# Configure peer settings (manual for now)
# You need to call set_peer_config instruction with:
# - EID: 40161 (Sepolia)
# - Peer Address: 0x429B3fc57dD1000eBd6eC9A77e7f3E0ABdD252fa

# Example using Anchor CLI:
anchor run setPeer --provider.cluster devnet -- --eid 40161 --peer 0x429B3fc57dD1000eBd6eC9A77e7f3E0ABdD252fa
```

## 🔍 What Was Missing

### ❌ EVM Issues Fixed:
1. **Peer Configuration** - Added setPeer call in configure script
2. **DVN Configuration** - Specified LayerZero Labs DVN for Sepolia
3. **Executor Configuration** - Added proper executor with gas limits
4. **ULN Config** - Added proper send/receive configurations

### ❌ Solana Issues Fixed:
1. **Receive Handler** - Program has lz_receive but needs peer config
2. **Peer Recognition** - Need to set EVM contract as trusted peer
3. **ULN Validation** - Proper DVN configuration needed

## 📋 Detailed Configuration

### LayerZero V2 Settings Applied:

**Sepolia → Solana:**
- DVN: `0x8eebf8b423B73bFCa51a1Db4B7354AA0bFCA9193` (LayerZero Labs)
- Executor: `0x718B92b5CB0a5552039B593faF724D182A881eDA`
- Gas Limit: 200,000
- Confirmations: 1 (Sepolia) → 32 (Solana)

**Solana → Sepolia:**
- DVN: `4VDjp6XQaxoZf5RGwiPU9NR1EXSZn2TP4ATMmiSzLfhb` (LayerZero Labs)
- Executor: Same as above
- Gas Limit: 200,000
- Confirmations: 32 (Solana) → 1 (Sepolia)

## 🐛 Troubleshooting

### If `npm run lz:wire` fails:

1. **Check network connection:**
   ```bash
   npx hardhat run scripts/test-connection.js --network sepolia
   ```

2. **Verify contract deployment:**
   ```bash
   npx hardhat verify --network sepolia 0x429B3fc57dD1000eBd6eC9A77e7f3E0ABdD252fa
   ```

3. **Check gas/ETH balance:**
   ```bash
   npx hardhat run scripts/check-balance.js --network sepolia
   ```

### If Solana peer config fails:

1. **Check Solana wallet balance:**
   ```bash
   solana balance --url devnet
   ```

2. **Get devnet SOL:**
   ```bash
   solana airdrop 2 --url devnet
   ```

3. **Verify program deployment:**
   ```bash
   solana program show DDyBRUnarV5xAdTn3XmjbhEGuiinCBRLT1tGkc33f5Fz --url devnet
   ```

## 🎯 Testing After Configuration

1. **Check LayerZero scan status:**
   Visit: https://layerzeroscan.com/ and search for your transaction

2. **Send a test message:**
   ```bash
   npx hardhat run scripts/test-message.js --network sepolia
   ```

3. **Verify on both chains:**
   - EVM: Check transaction on Etherscan
   - Solana: Check transaction on Solscan

## 📖 Key Files Modified

- `layerzero.config.ts` - Complete LayerZero V2 configuration
- `configure-layerzero.js` - Peer configuration script
- `wire-layerzero.js` - DevTools wiring script
- `package.json` - Added LayerZero CLI commands

## ⚠️ Important Notes

1. **Always run `lz:wire` after contract deployment**
2. **Solana peer configuration must be done manually** (custom program structure)
3. **Both sides need proper peer configuration** for bidirectional messaging
4. **DVN addresses differ between chains** (Sepolia vs Solana)

## 🚀 Next Steps

1. Run the configuration commands above
2. Wait for LayerZero scan to show "DELIVERED" status
3. Test cross-chain identity linking
4. Implement frontend integration
5. Add error handling and monitoring
