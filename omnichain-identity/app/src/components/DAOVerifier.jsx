import { useState } from 'react';
import { getLinkedAddresses, checkEvmBalance } from '../utils/evm';

function DAOVerifier() {
  const [evmAddress, setEvmAddress] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');

  const handleAddressChange = (e) => {
    setEvmAddress(e.target.value);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!evmAddress) {
      setError('Please enter an EVM address');
      return;
    }

    // Basic EVM address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(evmAddress)) {
      setError('Please enter a valid EVM address');
      return;
    }

    setIsVerifying(true);
    setError('');
    setVerificationResult(null);

    try {
      // Get linked Solana addresses from EVM contract
      const linkedAddresses = await getLinkedAddresses(evmAddress);
      
      // Check EVM balance (demo tokens based on ETH balance)
      const balance = await checkEvmBalance(evmAddress);
      
      // Determine if address meets DAO criteria (e.g., > 10 tokens)
      const meetsDAOCriteria = parseFloat(balance) >= 10;
      
      setVerificationResult({
        hasLinkedAddresses: linkedAddresses.length > 0,
        linkedAddresses,
        evmBalance: balance,
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
      <p>Enter an EVM address to verify linked Solana addresses and DAO token balances</p>
      
      <form onSubmit={handleVerify} className="verify-form">
        <input
          type="text"
          value={evmAddress}
          onChange={handleAddressChange}
          placeholder="Enter EVM address (0x...)"
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
          
          <div className="evm-info">
            <h4>EVM Address Info:</h4>
            <p><strong>Address:</strong> {evmAddress}</p>
            <p><strong>Demo Token Balance:</strong> {verificationResult.evmBalance} tokens</p>
          </div>
          
          {!verificationResult.hasLinkedAddresses ? (
            <p>No linked Solana addresses found for this EVM address.</p>
          ) : (
            <>
              <h4>Linked Solana Addresses:</h4>
              <ul className="linked-addresses-list">
                {verificationResult.linkedAddresses.map((address, index) => (
                  <li key={index} className="linked-address-item">
                    <span>{address}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          
          <div className="dao-eligibility">
            <h4>DAO Voting Eligibility:</h4>
            {verificationResult.meetsDAOCriteria ? (
              <div className="eligibility-badge eligible">
                ✅ Eligible - Has sufficient DAO tokens ({verificationResult.evmBalance} ≥ 10)
              </div>
            ) : (
              <div className="eligibility-badge not-eligible">
                ❌ Not Eligible - Insufficient DAO tokens ({verificationResult.evmBalance} &lt; 10)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DAOVerifier;
