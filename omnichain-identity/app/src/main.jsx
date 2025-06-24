import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Solana Wallet Adapter
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'

// EVM Wallet support with wagmi
import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { mainnet, polygon, bsc } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

// Import Solana wallet CSS
import '@solana/wallet-adapter-react-ui/styles.css'

// Setup Solana wallet adapter
const solanaNetwork = WalletAdapterNetwork.Devnet
const solanaEndpoint = clusterApiUrl(solanaNetwork)
const solanaWallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter()
]

// Setup EVM wallet configs
const { chains, publicClient } = configureChains(
  [mainnet, polygon, bsc],
  [publicProvider()]
)

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new CoinbaseWalletConnector({ 
      chains,
      options: {
        appName: 'Omnichain Identity',
      },
    }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: process.env.WALLET_CONNECT_PROJECT_ID || 'dummy-project-id',
      },
    }),
  ],
  publicClient,
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConnectionProvider endpoint={solanaEndpoint}>
      <WalletProvider wallets={solanaWallets} autoConnect>
        <WalletModalProvider>
          <WagmiConfig config={wagmiConfig}>
            <App />
          </WagmiConfig>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </React.StrictMode>,
)
