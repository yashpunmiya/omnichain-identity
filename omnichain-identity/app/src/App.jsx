import { useState } from 'react';
import WalletConnector from './components/WalletConnector';
import IdentityLinker from './components/IdentityLinker';
import DAOVerifier from './components/DAOVerifier';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('identity');

  return (
    <div className="app-container">
      <header>
        <h1>Omnichain Identity Linker</h1>
        <p>Connect and link your EVM and Solana wallets via LayerZero</p>
      </header>

      <WalletConnector />

      <div className="tabs">
        <div
          className={`tab ${activeTab === 'identity' ? 'active' : ''}`}
          onClick={() => setActiveTab('identity')}
        >
          Identity Linker
        </div>
        <div
          className={`tab ${activeTab === 'dao' ? 'active' : ''}`}
          onClick={() => setActiveTab('dao')}
        >
          DAO Verifier
        </div>
      </div>

      <main>
        {activeTab === 'identity' ? (
          <IdentityLinker />
        ) : (
          <DAOVerifier />
        )}
      </main>

      <footer>
        <p>Powered by LayerZero V2 | Built for Solana Breakout Hackathon</p>
      </footer>
    </div>
  );
}

export default App;
