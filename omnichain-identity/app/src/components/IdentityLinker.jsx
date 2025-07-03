import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount, useSignMessage } from 'wagmi';
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { sendLayerZeroMessage, getLinkedAddresses } from '../utils/evm';

function IdentityLinker() {
  const [linkedAddresses, setLinkedAddresses] = useState([]);
  const [isLinking, setIsLinking] = useState(false);
  const [txResult, setTxResult] = useState(null);
  const [error, setError] = useState('');

  // Solana connection
  const { publicKey: solanaPublicKey } = useWallet();
  
  // EVM wallet
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  
  // EVM signing
  const { signMessageAsync } = useSignMessage();

  // Check for linked addresses when wallets are connected
  useEffect(() => {
    if (evmAddress) {
      fetchLinkedAddresses();
    }
  }, [evmAddress]);

  // Fetch linked addresses from EVM contract
  const fetchLinkedAddresses = async () => {
    if (!evmAddress) return;
    
    try {
      // Get linked addresses from the EVM contract
      const addresses = await getLinkedAddresses(evmAddress);
      setLinkedAddresses(addresses);
      console.log(`✅ Found ${addresses.length} linked addresses for ${evmAddress}`);
    } catch (err) {
      console.error('Error fetching linked addresses:', err);
      setLinkedAddresses([]);
    }
  };

  // Handle linking wallets via LayerZero
  const handleLinkWallets = async () => {
    if (!solanaPublicKey || !evmAddress || !isEvmConnected) {
      setError('Please connect both Solana and EVM wallets');
      return;
    }

    setIsLinking(true);
    setError('');
    setTxResult(null);

    try {
      // Sign message with EVM wallet for proof of ownership
      const messageToSign = `I am linking my Solana wallet ${solanaPublicKey.toString()} with my EVM wallet ${evmAddress}. Timestamp: ${Date.now()}`;
      const signature = await signMessageAsync({ message: messageToSign });
      
      // Construct message payload for LayerZero
      const payload = {
        evmAddress,
        solanaAddress: solanaPublicKey.toString(),
        timestamp: Math.floor(Date.now() / 1000),
        signature
      };

      // Send message through LayerZero - now returns full transaction details
      const result = await sendLayerZeroMessage(payload);
      setTxResult(result);
      
      console.log('✅ Cross-chain message sent successfully:', result);
      
      // Refresh linked addresses after a delay to allow for cross-chain propagation
      setTimeout(fetchLinkedAddresses, 15000);
    } catch (err) {
      console.error('Error linking wallets:', err);
      setError(`Error linking wallets: ${err.message}`);
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <section className="identity-linker">
      <div className="flex flex-col items-center justify-center h-full">
        <header className="identity-hero">
          <h1 className="identity-title">Link Your Cross-Chain Identity</h1>
          <p className="identity-subtitle">
            Securely connect your Solana and EVM wallets using LayerZero's cross-chain infrastructure. 
            Create a unified identity across multiple blockchains.
          </p>
        </header>

        {(!solanaPublicKey || !evmAddress) ? (
          <div className="card p-6 identity-connect-prompt">
            <p className="text-lg text-center">
              Please connect both your Solana and EVM wallets to begin the linking process.
            </p>
          </div>
        ) : (
          <div className="card card--elevated identity-action-card">
            <button 
              onClick={handleLinkWallets} 
              disabled={isLinking || !solanaPublicKey || !evmAddress}
              className="btn btn--lg identity-link-button"
            >
              {isLinking ? (
                <>
                  <svg className="spinner" width="20" height="20" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
                  </svg>
                  Linking via LayerZero...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M13.828 10.172L15.656 8.344C16.781 7.219 16.781 5.375 15.656 4.25C14.531 3.125 12.688 3.125 11.563 4.25L9.735 6.078M10.172 13.828L8.344 15.656C7.219 16.781 7.219 18.625 8.344 19.75C9.469 20.875 11.313 20.875 12.438 19.75L14.266 17.922M14.828 9.172L9.172 14.828" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Link Wallets via LayerZero
                </>
              )}
            </button>
            
            {error && (
              <div className="alert alert--error mb-6">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{error}</span>
              </div>
            )}
            
            {txResult && (
              <div className="alert alert--success mb-6">
                <div className="w-full">
                  <h4 className="identity-success-title">
                    🎉 Cross-chain Transaction Successful!
                  </h4>
                  <div className="identity-tx-details">
                    <div className="identity-tx-row">
                      <span>Transaction Hash:</span>
                      <a 
                        href={`https://sepolia.etherscan.io/tx/${txResult.hash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="identity-tx-link"
                      >
                        {txResult.hash.substring(0, 10)}...{txResult.hash.substring(txResult.hash.length - 6)}
                      </a>
                    </div>
                    <div className="identity-tx-row">
                      <span>LayerZero Fee:</span>
                      <span>{txResult.fee} ETH</span>
                    </div>
                    <div className="identity-tx-row">
                      <span>Gas Used:</span>
                      <span>{txResult.gasUsed}</span>
                    </div>
                    <div className="identity-tx-row">
                      <span>Block:</span>
                      <span>{txResult.blockNumber}</span>
                    </div>
                    <a 
                      href={txResult.layerZeroScan} 
                      target="_blank" 
                      rel="noreferrer"
                      className="identity-lz-link"
                    >
                      🔍 Track on LayerZeroScan
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="identity-addresses">
              <h3 className="identity-addresses-title">Your Linked Addresses</h3>
              {linkedAddresses.length === 0 ? (
                <p className="identity-no-addresses">
                  No linked addresses found. Link your wallets above!
                </p>
              ) : (
                <ul className="identity-addresses-list">
                  {linkedAddresses.map((address, index) => (
                    <li key={index} className="identity-address-item">
                      {address}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default IdentityLinker;
