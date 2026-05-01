import React, { useState, useEffect } from 'react';
import { UserCircle, Activity, ShieldCheck, Sun, Moon } from 'lucide-react';
import ApplicantView from './views/ApplicantView';
import UnderwriterView from './views/UnderwriterView';
import RegulatorView from './views/RegulatorView';

function App() {
  const [activeTab, setActiveTab] = useState('applicant');
  const [theme, setTheme] = useState(() => {
    // Restore saved theme or default to dark
    return localStorage.getItem('ethicredit-theme') || 'dark';
  });

  // Apply theme to root element whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ethicredit-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const renderContent = () => {
    switch (activeTab) {
      case 'applicant':    return <ApplicantView />;
      case 'underwriter':  return <UnderwriterView />;
      case 'regulator':    return <RegulatorView />;
      default:             return <ApplicantView />;
    }
  };

  return (
    <div className="app-container">
      <div className="bg-glow-1" />
      <div className="bg-glow-2" />

      <aside className="sidebar">
        <div style={{ flex: 1 }}>
          {/* Brand */}
          <div className="brand">EthiCredit Pro</div>
          <div className="brand-sub">Agentic Fair Lending AI</div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              width: '100%', padding: '0.65rem 1rem', borderRadius: '12px',
              background: theme === 'dark' ? 'rgba(245,158,11,0.1)' : 'rgba(139,92,246,0.1)',
              border: `1px solid ${theme === 'dark' ? 'rgba(245,158,11,0.25)' : 'rgba(139,92,246,0.25)'}`,
              color: theme === 'dark' ? '#f59e0b' : '#7c3aed',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              marginBottom: '1.25rem', fontFamily: 'inherit',
              transition: 'all 0.3s ease',
            }}
            title="Toggle dark / light mode"
          >
            {theme === 'dark'
              ? <><Sun size={16} /> Switch to Light Mode</>
              : <><Moon size={16} /> Switch to Dark Mode</>
            }
          </button>

          <div className="nav-section-label">Workspaces</div>
          <nav>
            <div
              className={`nav-item ${activeTab === 'applicant' ? 'active' : ''}`}
              onClick={() => setActiveTab('applicant')}
            >
              <UserCircle size={20} /><span>The Applicant</span>
            </div>
            <div
              className={`nav-item ${activeTab === 'underwriter' ? 'active' : ''}`}
              onClick={() => setActiveTab('underwriter')}
            >
              <Activity size={20} /><span>The Underwriter</span>
            </div>
            <div
              className={`nav-item ${activeTab === 'regulator' ? 'active' : ''}`}
              onClick={() => setActiveTab('regulator')}
            >
              <ShieldCheck size={20} /><span>The Regulator</span>
              <span className="nav-badge">⚠</span>
            </div>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-status">
            <div className="status-dot" />
            <span>AI Engine Online</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            XGBoost · SHAP · AIF360
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem', opacity: 0.6 }}>
            Theme: {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
          </div>
        </div>
      </aside>

      <main className="main-content">{renderContent()}</main>
    </div>
  );
}

export default App;
