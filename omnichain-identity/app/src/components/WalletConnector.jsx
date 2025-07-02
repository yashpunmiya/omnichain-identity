import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';

function WalletConnector() {
  // Solana wallet connection
  const { publicKey: solanaPublicKey } = useWallet();
  
  // EVM wallet connection
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect();

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="wallet-connector">
      <h2 className="wallet-connector__title">Connect Your Wallets</h2>
      
      <div className="wallet-connector__grid">
        {/* Solana Wallet Section */}
        <div className="wallet-connector__section">
          <div className="wallet-connector__header">
            <div className="wallet-connector__chain-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="white"/>
              </svg>
            </div>
            <span className="wallet-connector__chain-name">Solana Wallet</span>
          </div>
          
          {solanaPublicKey && (
            <div className="wallet-connector__address">
              {formatAddress(solanaPublicKey.toString())}
            </div>
          )}
          
          <WalletMultiButton className="wallet-connector__button" />
        </div>

        {/* EVM Wallet Section */}
        <div className="wallet-connector__section">
          <div className="wallet-connector__header">
            <div className="wallet-connector__chain-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="wallet-connector__chain-name">EVM Wallet</span>
          </div>
          
          {isEvmConnected && evmAddress && (
            <div className="wallet-connector__address">
              {formatAddress(evmAddress)}
            </div>
          )}
          
          {!isEvmConnected ? (
            <button 
              onClick={() => connect()} 
              className="wallet-connector__button"
            >
              Connect EVM Wallet
            </button>
          ) : (
            <button 
              onClick={() => disconnect()} 
              className="wallet-connector__button wallet-connector__button--disconnect"
            >
              Disconnect EVM Wallet
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default WalletConnector;
