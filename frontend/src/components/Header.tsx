import React from 'react';

interface HeaderProps {
  showBackButton?: boolean;
  onBackClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ showBackButton = false, onBackClick }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-text">
          <h1 className="app-title">APTOS AURA WEAVER</h1>
          <p className="app-subtitle">Generate your personalized aura NFT based on your on-chain activity</p>
        </div>
        <div className="header-actions">
          {showBackButton && (
            <button
              onClick={onBackClick}
              className="btn btn-secondary back-button"
              title="Go back"
            >
              ← Back
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;