import { useState } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
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
    try {
      new PublicKey(solanaAddress);
    } catch {
      setError('Please enter a valid Solana address');
      return;
    }
    setIsVerifying(true);
    setError('');
    setVerificationResult(null);
    try {
      const connection = new Connection(clusterApiUrl('devnet'));
      const linkedEvmAddresses = await getLinkedAddresses(connection, new PublicKey(solanaAddress));
      const evmBalances = [];
      let totalDAOTokens = 0;
      for (const evmAddress of linkedEvmAddresses) {
        try {
          const balance = await checkEvmBalance(evmAddress);
          const balanceNum = parseFloat(balance);
          evmBalances.push({
            address: evmAddress,
            balance: balance,
            meetsThreshold: balanceNum >= 10
          });
          totalDAOTokens += balanceNum;
        } catch (err) {
          evmBalances.push({
            address: evmAddress,
            balance: '0',
            meetsThreshold: false,
            error: err.message
          });
        }
      }
      const meetsDAOCriteria = totalDAOTokens >= 10;
      setVerificationResult({
        hasLinkedAddresses: linkedEvmAddresses.length > 0,
        linkedEvmAddresses,
        evmBalances,
        totalDAOTokens,
        meetsDAOCriteria
      });
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <section className="dao-verifier">
      <div className="dao-container">
        <header className="dao-header">
          <span className="dao-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="url(#gradient1)"/>
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366F1"/>
                  <stop offset="100%" stopColor="#8B5CF6"/>
                </linearGradient>
              </defs>
            </svg>
          </span>
          <h1 className="dao-title">DAO Verification Portal</h1>
          <p className="dao-subtitle">
            Verify your cross-chain identity and DAO token eligibility
          </p>
        </header>
        
        <div className="card card--elevated p-6 mb-8">
          <form onSubmit={handleVerify} className="dao-form">
            <div className="dao-input-group">
              <label htmlFor="solana-address" className="dao-label">
                Solana Wallet Address
              </label>
              <div className="dao-input-wrapper">
                <svg className="dao-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 12V8H4V12H20ZM20 14H4V16C4 17.1 4.9 18 6 18H18C19.1 18 20 17.1 20 16V14ZM18 6C19.1 6 20 6.9 20 8V12H4V8C4 6.9 4.9 6 6 6H18Z" fill="currentColor"/>
                </svg>
                <input
                  id="solana-address"
                  type="text"
                  value={solanaAddress}
                  onChange={handleAddressChange}
                  placeholder="Enter your Solana address..."
                  className="dao-input"
                  disabled={isVerifying}
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isVerifying || !solanaAddress}
              className={`btn dao-button ${isVerifying ? 'disabled' : ''}`}
            >
              {isVerifying ? (
                <>
                  <svg className="spinner" width="20" height="20" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
                  </svg>
                  Verifying Identity...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Verify Eligibility
                </>
              )}
            </button>
          </form>
          {error && (
            <div className="alert alert--error mt-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{error}</span>
            </div>
          )}
        </div>
        
        {verificationResult && (
          <div className="dao-results">
            <div className="dao-results-header">
              <h2 className="dao-results-title">Verification Results</h2>
              <div className={`dao-status-badge ${verificationResult.meetsDAOCriteria ? 'dao-status-badge--success' : 'dao-status-badge--warning'}`}>
                {verificationResult.meetsDAOCriteria ? 'Eligible' : 'Not Eligible'}
              </div>
            </div>
            
            <div className="dao-info-card">
              <div className="dao-info-header">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
                </svg>
                <h3>Solana Identity</h3>
              </div>
              <div className="dao-address-display">
                <span className="dao-address-label">Address:</span>
                <code className="dao-address-code">{solanaAddress}</code>
              </div>
            </div>
            
            {!verificationResult.hasLinkedAddresses ? (
              <div className="dao-empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.17L13.24 8.1C12.45 7.8 11.55 7.8 10.76 8.1L7.83 5.17L10.5 2.5L9 1L3 7V9H5V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V9H21Z" fill="currentColor" opacity="0.3"/>
                </svg>
                <h3>No Linked Addresses Found</h3>
                <p>This Solana address doesn't have any linked EVM addresses yet.</p>
              </div>
            ) : (
              <>
                <div className="dao-linked-addresses">
                  <h3 className="dao-section-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M13.828 10.172L15.656 8.344C16.781 7.219 16.781 5.375 15.656 4.25C14.531 3.125 12.688 3.125 11.563 4.25L9.735 6.078M10.172 13.828L8.344 15.656C7.219 16.781 7.219 18.625 8.344 19.75C9.469 20.875 11.313 20.875 12.438 19.75L14.266 17.922M14.828 9.172L9.172 14.828" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Linked EVM Addresses
                  </h3>
                  <ul className="dao-addresses-list">
                    {verificationResult.evmBalances.map((item, idx) => (
                      <li key={idx} className="dao-address-item">
                        <div className="dao-address-details">
                          <span className="dao-address">{item.address}</span>
                          <span className={`dao-threshold-indicator ${item.meetsThreshold ? 'dao-threshold-indicator--success' : 'dao-threshold-indicator--warning'}`}>
                            {item.meetsThreshold ? 'Eligible' : 'Not Eligible'}
                          </span>
                        </div>
                        <div className="dao-token-amount">DAO Tokens: {item.balance}</div>
                        {item.error && <div className="text-error text-sm mt-1">{item.error}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="dao-summary-card">
                  <div className="dao-summary-header">
                    <h3>Total DAO Tokens</h3>
                    <div className="dao-total-amount">
                      <span>{verificationResult.totalDAOTokens}</span>
                    </div>
                  </div>
                  <div className={`dao-final-verdict ${verificationResult.meetsDAOCriteria ? 'dao-final-verdict--success' : 'dao-final-verdict--warning'}`}>
                    <span className="dao-verdict-icon">
                      {verificationResult.meetsDAOCriteria ? '✅' : '⚠️'}
                    </span>
                    <div className="dao-verdict-content">
                      <div className="dao-verdict-title">
                        {verificationResult.meetsDAOCriteria ? 'You are eligible for DAO membership!' : 'Not enough DAO tokens for eligibility.'}
                      </div>
                      <div className="dao-verdict-description">
                        {verificationResult.meetsDAOCriteria ? 'Congratulations! You meet the DAO token threshold.' : 'You need at least 10 DAO tokens across all linked EVM addresses.'}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default DAOVerifier;
