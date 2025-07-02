import { useState } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { getLinkedAddresses } from '../utils/solana';
import { checkEvmBalance } from '../utils/evm';
import './DAOVerifier.css';

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

    // Basic Solana address validation
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
      // Create connection to Solana
      const connection = new Connection(clusterApiUrl('devnet'));
      
      // Get linked EVM addresses from Solana contract
      const linkedEvmAddresses = await getLinkedAddresses(connection, new PublicKey(solanaAddress));
      
      // Check DAO token balances for each linked EVM address
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
          console.error(`Error checking balance for ${evmAddress}:`, err);
          evmBalances.push({
            address: evmAddress,
            balance: '0',
            meetsThreshold: false,
            error: err.message
          });
        }
      }
      
      // Determine if address meets DAO criteria (e.g., > 10 tokens total across all linked addresses)
      const meetsDAOCriteria = totalDAOTokens >= 10;
      
      setVerificationResult({
        hasLinkedAddresses: linkedEvmAddresses.length > 0,
        linkedEvmAddresses,
        evmBalances,
        totalDAOTokens,
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
    <div className="dao-verifier">
      <div className="dao-verifier__container">
        <div className="dao-verifier__header">
          <div className="dao-verifier__icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="url(#gradient1)"/>
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366F1"/>
                  <stop offset="100%" stopColor="#8B5CF6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="dao-verifier__title">DAO Verification Portal</h1>
          <p className="dao-verifier__subtitle">
            Verify your cross-chain identity and DAO token eligibility
          </p>
        </div>

        <div className="dao-verifier__form-card">
          <form onSubmit={handleVerify} className="dao-verifier__form">
            <div className="dao-verifier__input-group">
              <label htmlFor="solana-address" className="dao-verifier__label">
                Solana Wallet Address
              </label>
              <div className="dao-verifier__input-wrapper">
                <svg className="dao-verifier__input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 12V8H4V12H20ZM20 14H4V16C4 17.1 4.9 18 6 18H18C19.1 18 20 17.1 20 16V14ZM18 6C19.1 6 20 6.9 20 8V12H4V8C4 6.9 4.9 6 6 6H18Z" fill="currentColor"/>
                </svg>
                <input
                  id="solana-address"
                  type="text"
                  value={solanaAddress}
                  onChange={handleAddressChange}
                  placeholder="Enter your Solana address..."
                  className="dao-verifier__input"
                  disabled={isVerifying}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isVerifying || !solanaAddress}
              className={`dao-verifier__button ${isVerifying ? 'dao-verifier__button--loading' : ''}`}
            >
              {isVerifying ? (
                <>
                  <svg className="dao-verifier__spinner" width="20" height="20" viewBox="0 0 24 24">
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
            <div className="dao-verifier__alert dao-verifier__alert--error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {error}
            </div>
          )}
        </div>

        {verificationResult && (
          <div className="dao-verifier__results">
            <div className="dao-verifier__results-header">
              <h2 className="dao-verifier__results-title">Verification Results</h2>
              <div className={`dao-verifier__status-badge ${verificationResult.meetsDAOCriteria ? 'dao-verifier__status-badge--success' : 'dao-verifier__status-badge--warning'}`}>
                {verificationResult.meetsDAOCriteria ? 'Eligible' : 'Not Eligible'}
              </div>
            </div>

            <div className="dao-verifier__info-card">
              <div className="dao-verifier__info-header">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
                </svg>
                <h3>Solana Identity</h3>
              </div>
              <div className="dao-verifier__address-display">
                <span className="dao-verifier__address-label">Address:</span>
                <code className="dao-verifier__address-code">{solanaAddress}</code>
              </div>
            </div>

            {!verificationResult.hasLinkedAddresses ? (
              <div className="dao-verifier__empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.17L13.24 8.1C12.45 7.8 11.55 7.8 10.76 8.1L7.83 5.17L10.5 2.5L9 1L3 7V9H5V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V9H21Z" fill="currentColor" opacity="0.3"/>
                </svg>
                <h3>No Linked Addresses Found</h3>
                <p>This Solana address doesn't have any linked EVM addresses yet.</p>
              </div>
            ) : (
              <>
                <div className="dao-verifier__linked-addresses">
                  <h3 className="dao-verifier__section-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M13.828 10.172L15.656 8.344C16.781 7.219 16.781 5.375 15.656 4.25C14.531 3.125 12.688 3.125 11.563 4.25L9.735 6.078M10.172 13.828L8.344 15.656C7.219 16.781 7.219 18.625 8.344 19.75C9.469 20.875 11.313 20.875 12.438 19.75L14.266 17.922M14.828 9.172L9.172 14.828" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Linked EVM Addresses ({verificationResult.evmBalances.length})
                  </h3>
                  <div className="dao-verifier__addresses-grid">
                    {verificationResult.evmBalances.map((evmInfo, index) => (
                      <div key={index} className="dao-verifier__address-card">
                        <div className="dao-verifier__address-card-header">
                          <div className="dao-verifier__chain-badge">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            EVM Chain
                          </div>
                          <div className={`dao-verifier__threshold-indicator ${evmInfo.meetsThreshold ? 'dao-verifier__threshold-indicator--success' : 'dao-verifier__threshold-indicator--warning'}`}>
                            {evmInfo.meetsThreshold ? '✓' : '!'}
                          </div>
                        </div>
                        
                        <div className="dao-verifier__address-details">
                          <div className="dao-verifier__detail-row">
                            <span className="dao-verifier__detail-label">Address:</span>
                            <code className="dao-verifier__detail-value">{evmInfo.address}</code>
                          </div>
                          <div className="dao-verifier__detail-row">
                            <span className="dao-verifier__detail-label">DAO Tokens:</span>
                            <span className="dao-verifier__token-amount">{evmInfo.balance}</span>
                          </div>
                          <div className="dao-verifier__detail-row">
                            <span className="dao-verifier__detail-label">Status:</span>
                            <span className={`dao-verifier__status-text ${evmInfo.meetsThreshold ? 'dao-verifier__status-text--success' : 'dao-verifier__status-text--warning'}`}>
                              {evmInfo.meetsThreshold ? 'Meets threshold (≥10)' : 'Below threshold (<10)'}
                            </span>
                          </div>
                          {evmInfo.error && (
                            <div className="dao-verifier__error-message">
                              Error: {evmInfo.error}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dao-verifier__summary-card">
                  <div className="dao-verifier__summary-header">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <h3>Total DAO Holdings</h3>
                  </div>
                  <div className="dao-verifier__total-amount">
                    {verificationResult.totalDAOTokens} <span>tokens</span>
                  </div>
                </div>
              </>
            )}

            <div className={`dao-verifier__final-verdict ${verificationResult.meetsDAOCriteria ? 'dao-verifier__final-verdict--success' : 'dao-verifier__final-verdict--warning'}`}>
              <div className="dao-verifier__verdict-icon">
                {verificationResult.meetsDAOCriteria ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div className="dao-verifier__verdict-content">
                <h3 className="dao-verifier__verdict-title">
                  {verificationResult.meetsDAOCriteria ? 'DAO Voting Eligible' : 'DAO Voting Ineligible'}
                </h3>
                <p className="dao-verifier__verdict-description">
                  {verificationResult.meetsDAOCriteria 
                    ? `You have ${verificationResult.totalDAOTokens} DAO tokens, which meets the minimum requirement of 10 tokens for voting eligibility.`
                    : `You have ${verificationResult.totalDAOTokens} DAO tokens, but need at least 10 tokens to be eligible for DAO voting.`
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DAOVerifier;
