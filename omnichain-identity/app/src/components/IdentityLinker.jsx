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
    <div className="identity-linker card">
      <h2>Link Your Identities</h2>
      
      {(!solanaPublicKey || !evmAddress) ? (
        <p>Please connect both your Solana and EVM wallets to link them.</p>
      ) : (
        <>
          <div className="flex flex-col">
            <button 
              onClick={handleLinkWallets} 
              disabled={isLinking || !solanaPublicKey || !evmAddress}
            >
              {isLinking ? 'Linking...' : 'Link Wallets via LayerZero'}
            </button>
            
            {error && (
              <div className="error-container">
                <p className="error">{error}</p>
              </div>
            )}
            
            {txResult && (
              <div className="transaction-info success">
                <h4>🎉 Cross-chain Transaction Successful!</h4>
                <div className="tx-details">
                  <p><strong>Transaction Hash:</strong> 
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${txResult.hash}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="tx-link"
                    >
                      {txResult.hash.substring(0, 10)}...{txResult.hash.substring(txResult.hash.length - 6)}
                    </a>
                  </p>
                  <p><strong>LayerZero Fee:</strong> {txResult.fee} ETH</p>
                  <p><strong>Gas Used:</strong> {txResult.gasUsed}</p>
                  <p><strong>Block:</strong> {txResult.blockNumber}</p>
                  <div className="layerzero-scan">
                    <a 
                      href={txResult.layerZeroScan} 
                      target="_blank" 
                      rel="noreferrer"
                      className="layerzero-link"
                    >
                      🔍 Track on LayerZeroScan
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="linked-addresses">
            <h3>Your Linked Addresses</h3>
            {linkedAddresses.length === 0 ? (
              <p>No linked addresses found. Link your wallets above!</p>
            ) : (
              <ul>
                {linkedAddresses.map((address, index) => (
                  <li key={index} className="address-item">
                    {address}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default IdentityLinker;
