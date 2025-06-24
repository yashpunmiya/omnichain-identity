import { useState } from 'react';
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { getLinkedAddresses } from '../utils/solana';
import { checkEvmBalance } from '../utils/evm';

function DAOVerifier() {
  const [solanaAddress, setSolanaAddress] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');

  const handleAddressChange = (e) => {
    setSolanaAddress(e.target.value);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!solanaAddress) {
      setError('Please enter a Solana address');
      return;
    }

    setIsVerifying(true);
    setError('');
    setVerificationResult(null);

    try {
      // Validate Solana address
      const pubkey = new PublicKey(solanaAddress);
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      
      // Get linked EVM addresses
      const linkedAddresses = await getLinkedAddresses(connection, pubkey);
      
      if (linkedAddresses.length === 0) {
        setVerificationResult({
          hasLinkedAddresses: false,
          linkedAddresses: [],
          evmBalances: {}
        });
        return;
      }
      
      // Check EVM balances for all linked addresses
      const balancePromises = linkedAddresses.map(async (address) => {
        const balance = await checkEvmBalance(address);
        return { address, balance };
      });
      
      const balanceResults = await Promise.all(balancePromises);
      
      // Format results
      const evmBalances = {};
      balanceResults.forEach((result) => {
        evmBalances[result.address] = result.balance;
      });
      
      // Determine if any address meets DAO criteria (e.g., > 10 tokens)
      const meetsDAOCriteria = balanceResults.some((result) => 
        parseFloat(result.balance) >= 10
      );
      
      setVerificationResult({
        hasLinkedAddresses: true,
        linkedAddresses,
        evmBalances,
        meetsDAOCriteria
      });
      
    } catch (err) {
      console.error('Error verifying:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="dao-verifier card">
      <h2>DAO Verification</h2>
      <p>Enter a Solana address to verify linked EVM addresses and DAO token balances</p>
      
      <form onSubmit={handleVerify} className="verify-form">
        <input
          type="text"
          value={solanaAddress}
          onChange={handleAddressChange}
          placeholder="Enter Solana address"
          className="address-input"
        />
        <button type="submit" disabled={isVerifying}>
          {isVerifying ? 'Verifying...' : 'Verify'}
        </button>
      </form>
      
      {error && <p className="error">{error}</p>}
      
      {verificationResult && (
        <div className="verification-result">
          <h3>Verification Results</h3>
          
          {!verificationResult.hasLinkedAddresses ? (
            <p>No linked EVM addresses found for this Solana address.</p>
          ) : (
            <>
              <h4>Linked EVM Addresses:</h4>
              <ul className="linked-addresses-list">
                {verificationResult.linkedAddresses.map((address, index) => (
                  <li key={index} className="linked-address-item">
                    <span>{address}</span>
                    <span className="balance">
                      Balance: {verificationResult.evmBalances[address] || '0'} DAO Tokens
                    </span>
                  </li>
                ))}
              </ul>
              
              <div className="dao-eligibility">
                <h4>DAO Voting Eligibility:</h4>
                {verificationResult.meetsDAOCriteria ? (
                  <div className="eligibility-badge eligible">
                    ✅ Eligible - Has sufficient DAO tokens
                  </div>
                ) : (
                  <div className="eligibility-badge not-eligible">
                    ❌ Not Eligible - Insufficient DAO tokens
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default DAOVerifier;
