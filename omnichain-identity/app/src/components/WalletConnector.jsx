import React, { useState, useRef, useEffect } from 'react';
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

  // State for context menu
  const [showSolanaMenu, setShowSolanaMenu] = useState(false);
  const [showEvmMenu, setShowEvmMenu] = useState(false);
  const solanaMenuRef = useRef(null);
  const evmMenuRef = useRef(null);

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Copy address to clipboard
  const copyToClipboard = (address) => {
    navigator.clipboard.writeText(address);
    // Could add a toast notification here
  };
  
  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (solanaMenuRef.current && !solanaMenuRef.current.contains(event.target)) {
        setShowSolanaMenu(false);
      }
      if (evmMenuRef.current && !evmMenuRef.current.contains(event.target)) {
        setShowEvmMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div>
      <h3>Connect Your Wallets</h3>
      
      <div className="wallet-grid">
        {/* Solana Wallet Section - First to appear in front */}
        <div className="wallet-section" style={{ zIndex: 50 }}>
          <div className="wallet-header">
            <span className="wallet-chain-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="white"/>
              </svg>
            </span>
            <span className="wallet-chain-name">Solana Wallet</span>
          </div>
          
          {solanaPublicKey && (
            <div className="wallet-address-container">
              <div 
                className="wallet-address" 
                onClick={() => setShowSolanaMenu(!showSolanaMenu)}
                aria-label="Solana wallet address options"
              >
                {formatAddress(solanaPublicKey.toString())}
              </div>
              
              {showSolanaMenu && (
                <div className="wallet-context-menu" ref={solanaMenuRef}>
                  <div 
                    className="wallet-context-item"
                    onClick={() => {
                      copyToClipboard(solanaPublicKey.toString());
                      setShowSolanaMenu(false);
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M8 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21H16C17.1046 21 18 20.1046 18 19V17M8 5C8 6.10457 8.89543 7 10 7H14C15.1046 7 16 6.10457 16 5M8 5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5M16 5V11M14 13H20M20 13L17 10M20 13L17 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Copy address
                  </div>
                </div>
              )}
            </div>
          )}
          
          <WalletMultiButton className="solana-wallet-button" />
        </div>

        {/* EVM Wallet Section */}
        <div className="wallet-section" style={{ zIndex: 40 }}>
          <div className="wallet-header">
            <span className="wallet-chain-icon evm-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span className="wallet-chain-name">EVM Wallet</span>
          </div>
          
          {isEvmConnected && evmAddress && (
            <div className="wallet-address-container">
              <div 
                className="wallet-address" 
                onClick={() => setShowEvmMenu(!showEvmMenu)}
                aria-label="EVM wallet address options"
              >
                {formatAddress(evmAddress)}
              </div>
              
              {showEvmMenu && (
                <div className="wallet-context-menu" ref={evmMenuRef}>
                  <div 
                    className="wallet-context-item"
                    onClick={() => {
                      copyToClipboard(evmAddress);
                      setShowEvmMenu(false);
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M8 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21H16C17.1046 21 18 20.1046 18 19V17M8 5C8 6.10457 8.89543 7 10 7H14C15.1046 7 16 6.10457 16 5M8 5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5M16 5V11M14 13H20M20 13L17 10M20 13L17 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Copy address
                  </div>
                  <div 
                    className="wallet-context-item wallet-context-item--danger"
                    onClick={() => {
                      disconnect();
                      setShowEvmMenu(false);
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M17 16L21 12M21 12L17 8M21 12H9M13 16V17C13 18.6569 11.6569 20 10 20H6C4.34315 20 3 18.6569 3 17V7C3 5.34315 4.34315 13 7V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Disconnect EVM Wallet
                  </div>
                </div>
              )}
            </div>
          )}
          
          {!isEvmConnected ? (
            <button 
              onClick={() => connect()} 
              className="btn btn--connect"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
                <path d="M17 16L21 12M21 12L17 8M21 12H9M13 16V17C13 18.6569 11.6569 20 10 20H6C4.34315 20 3 18.6569 3 17V7C3 5.34315 4.34315 4 6 4H10C11.6569 4 13 5.34315 13 7V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Connect EVM Wallet
            </button>
          ) : (
            <div className="wallet-connected-status">
              <div className="connected-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Connected
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WalletConnector;
