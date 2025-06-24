import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount, useSignMessage } from 'wagmi';
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { sendLayerZeroMessage } from '../utils/evm';
import { getLinkedAddresses } from '../utils/solana';

function IdentityLinker() {
  const [linkedAddresses, setLinkedAddresses] = useState([]);
  const [isLinking, setIsLinking] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  // Solana connection
  const { publicKey: solanaPublicKey } = useWallet();
  
  // EVM wallet
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  
  // EVM signing
  const { signMessageAsync } = useSignMessage();

  // Check for linked addresses when wallets are connected
  useEffect(() => {
    if (solanaPublicKey) {
      fetchLinkedAddresses();
    }
  }, [solanaPublicKey]);

  // Fetch linked addresses from Solana program
  const fetchLinkedAddresses = async () => {
    if (!solanaPublicKey) return;
    
    try {
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      const addresses = await getLinkedAddresses(connection, solanaPublicKey);
      setLinkedAddresses(addresses);
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

      // Send message through LayerZero
      const hash = await sendLayerZeroMessage(payload);
      setTxHash(hash);
      
      // Refresh linked addresses after a delay to allow for propagation
      setTimeout(fetchLinkedAddresses, 10000);
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
            
            {error && <p className="error">{error}</p>}
            
            {txHash && (
              <div className="transaction-info">
                <p>Transaction sent! Check status on LayerZeroScan:</p>
                <a 
                  href={`https://layerzeroscan.com/tx/${txHash}`} 
                  target="_blank" 
                  rel="noreferrer"
                >
                  {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 6)}
                </a>
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
