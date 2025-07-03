import { useState } from 'react';
import WalletConnector from './components/WalletConnector';
import IdentityLinker from './components/IdentityLinker';
import DAOVerifier from './components/DAOVerifier';
import Logo from './components/Logo';
import './styles/design-system.css';
import './styles/components.css';
import './styles/wallet-fixes.css';

function App() {
  const [activeTab, setActiveTab] = useState('identity');

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Logo size="large" />
          <div className="sidebar-brand-text">
            <h1 className="sidebar-title">OmniChain ID</h1>
            <p className="sidebar-subtitle">Cross-chain wallet linking</p>
          </div>
        </div>
        <div className="wallet-connector">
          <WalletConnector />
        </div>
        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${activeTab === 'identity' ? 'sidebar-nav-item--active' : ''}`}
            onClick={() => setActiveTab('identity')}
            aria-label="Identity Linker"
          >
            <span className="sidebar-nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M13.828 10.172L15.656 8.344C16.781 7.219 16.781 5.375 15.656 4.25C14.531 3.125 12.688 3.125 11.563 4.25L9.735 6.078M10.172 13.828L8.344 15.656C7.219 16.781 7.219 18.625 8.344 19.75C9.469 20.875 11.313 20.875 12.438 19.75L14.266 17.922M14.828 9.172L9.172 14.828" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span>Identity Linker</span>
          </button>
          <button
            className={`sidebar-nav-item ${activeTab === 'dao' ? 'sidebar-nav-item--active' : ''}`}
            onClick={() => setActiveTab('dao')}
            aria-label="DAO Verifier"
          >
            <span className="sidebar-nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span>DAO Verifier</span>
          </button>
        </nav>
        <footer className="sidebar-footer">
          <div className="sidebar-footer-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <p>Powered by LayerZero V2</p>
              <p className="sidebar-footer-subtitle">Solana Breakout Hackathon</p>
            </div>
          </div>
        </footer>
      </aside>
      <main className="main">
        <section className="main-content">
          {activeTab === 'identity' ? <IdentityLinker /> : <DAOVerifier />}
        </section>
      </main>
    </div>
  );
}

export default App;

