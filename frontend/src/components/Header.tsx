import React from 'react';

interface HeaderProps {
  showBackButton?: boolean;
  onBackClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ showBackButton = false, onBackClick }) => {
  return (
    <header className="app-header" role="banner">
      <div className="header-content">
        <div className="header-text">
          <h1 className="app-title" id="main-title">APTOS AURA WEAVER</h1>
          <p className="app-subtitle" aria-describedby="main-title">
            Generate your personalized aura NFT based on your on-chain activity
          </p>
        </div>
        <nav className="header-actions" role="navigation" aria-label="Header navigation">
          {showBackButton && (
            <button
              onClick={onBackClick}
              className="btn btn-secondary back-button"
              aria-label="Go back to previous page"
              type="button"
            >
              <span aria-hidden="true">←</span> Back
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;