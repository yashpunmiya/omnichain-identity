# 🌐 OmniChainID — Decentralised Cross-Chain Identity Linker powered by Layerzero v2 

## 🚀 Overview  

**OmniChainID** is a cross-chain identity linking protocol built using **LayerZero V2**. It enables users to securely link their **Solana** and **EVM chain** wallets through verifiable on-chain messages, laying the groundwork for unified identity verification in omnichain DAOs, dApps and ecosystems.

This project was developed as part of the **LayerZero Solana Breakout Bounty Hackathon**.

---

## 🎯 Why OmniChainID?  

Modern decentralised ecosystems are fragmented, with identities split across different chains. OmniChainID solves this by providing a **secure, decentralised and composable framework** for linking multiple wallet addresses under a single identity without needing off-chain infrastructure.

---

## 🔧 How It Works  

- **EVM User Signs a Link Request:**  
  The EVM contract triggers a LayerZero message to the Solana program, carrying identity linking details.

- **LayerZero Endpoint Relays Message:**  
  The LayerZero endpoint routes the message securely across the chains.

- **Solana PDA Stores the Link:**  
  On Solana, a Program Derived Address (PDA) securely stores the association between the Solana and EVM wallet addresses.

- **DAO / dApps Verify via EVM Address:**  
  DAOs can later verify user identity solely through the linked EVM address, ensuring composability across chains.

---

## 🔗 Project Architecture  

| Component            | Technology        |
|:--------------------|:-----------------|
| EVM Contracts        | Solidity (Hardhat)|
| Solana Program       | Anchor Framework  |
| Messaging Protocol   | LayerZero V2      |
| Frontend Integration | React + Ethers.js |

---

## ⚙️ Deployment & Setup  

### 1️⃣ Install Dependencies  
```bash
npm install
```

### 2️⃣ Create `.env`  
```env
PRIVATE_KEY=your_evm_private_key
ETHEREUM_RPC_URL=your_sepolia_rpc
LZ_ETHEREUM_ENDPOINT=LayerZero_Sepolia_Endpoint
SOLANA_OAPP_ADDRESS=Deployed_Solana_Program_Address
```

### 3️⃣ Deploy EVM Contract  
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### 4️⃣ Configure Peers  
Set the peer Solana program address in your EVM contract.

### 5️⃣ Test Cross-Chain Messages  
Run the message sending script to verify full integration.

---

## 📈 Hackathon Achievements  

- ✅ Deployed fully functional Solana Program (Anchor)
- ✅ LayerZero V2 integration for both EVM and Solana
- ✅ Cross-chain messaging with peer configuration
- ✅ Frontend wallet connection and identity verification demo
- ✅ Documented entire setup for reproducibility

---

## 💡 Key Takeaways  

- Cross-chain identity linking is possible natively on-chain without third-party systems.
- LayerZero V2 endpoints, DVN and executor configurations are crucial for message routing.
- Omnichain identity frameworks will power future DAO governance and decentralised applications.

---

## 📜 Licence  

MIT © 2025 OmniChainID Contributors  

---

## 🔗 Useful Resources  

- [LayerZero V2 Docs](https://docs.layerzero.network/v2/)
- [LayerZero Deployed Contracts](https://docs.layerzero.network/v2/deployments/deployed-contracts?stages=testnet)
- [Solana Anchor Docs](https://book.anchor-lang.com/)
