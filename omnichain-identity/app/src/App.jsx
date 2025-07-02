import { useState } from 'react';
import WalletConnector from './components/WalletConnector';
import IdentityLinker from './components/IdentityLinker';
import DAOVerifier from './components/DAOVerifier';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('identity');

  return (
    <div className="app">
      <div className="app__sidebar">
        <div className="app__brand">
          <div className="app__logo">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="url(#logoGradient)"/>
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366F1"/>
                  <stop offset="100%" stopColor="#8B5CF6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="app__brand-text">
            <h1 className="app__title">Omnichain Identity</h1>
            <p className="app__subtitle">Cross-chain wallet linking</p>
          </div>
        </div>

        <WalletConnector />

        <nav className="app__nav">
          <div
            className={`app__nav-item ${activeTab === 'identity' ? 'app__nav-item--active' : ''}`}
            onClick={() => setActiveTab('identity')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M13.828 10.172L15.656 8.344C16.781 7.219 16.781 5.375 15.656 4.25C14.531 3.125 12.688 3.125 11.563 4.25L9.735 6.078M10.172 13.828L8.344 15.656C7.219 16.781 7.219 18.625 8.344 19.75C9.469 20.875 11.313 20.875 12.438 19.75L14.266 17.922M14.828 9.172L9.172 14.828" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Identity Linker</span>
          </div>
          <div
            className={`app__nav-item ${activeTab === 'dao' ? 'app__nav-item--active' : ''}`}
            onClick={() => setActiveTab('dao')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>DAO Verifier</span>
          </div>
        </nav>

        <div className="app__footer">
          <div className="app__footer-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <p>Powered by LayerZero V2</p>
              <p className="app__footer-subtitle">Solana Breakout Hackathon</p>
            </div>
          </div>
        </div>
      </div>

      <main className="app__main">
        <div className="app__content">
          {activeTab === 'identity' ? (
            <IdentityLinker />
          ) : (
            <DAOVerifier />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
