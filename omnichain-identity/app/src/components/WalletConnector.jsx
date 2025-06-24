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
    <div className="card">
      <h2>Connect Your Wallets</h2>
      
      {/* Solana Wallet Section */}
      <div className="wallet-section">
        <div>
          <h3>Solana Wallet</h3>
          {solanaPublicKey && (
            <div className="address-display">
              {formatAddress(solanaPublicKey.toString())}
            </div>
          )}
        </div>
        <WalletMultiButton />
      </div>

      {/* EVM Wallet Section */}
      <div className="wallet-section">
        <div>
          <h3>EVM Wallet</h3>
          {isEvmConnected && evmAddress && (
            <div className="address-display">
              {formatAddress(evmAddress)}
            </div>
          )}
        </div>
        {!isEvmConnected ? (
          <button onClick={() => connect()}>Connect EVM Wallet</button>
        ) : (
          <button onClick={() => disconnect()}>Disconnect EVM Wallet</button>
        )}
      </div>
    </div>
  );
}

export default WalletConnector;
