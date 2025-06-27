import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import AuthModal from '../modal/AuthModal';

const Header = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
      <div className="header-container">
        <header>
          <div className="logo-container">
            <Link to="/" className="logo-link">
              <img src="/favicon.PNG" alt="Logo" className="logo" />
              <div className="logo-text">
                <h1>Project Art of Humanity</h1>
                <p className="tagline">Collaborative Canvases of Human Expression</p>
              </div>
            </Link>
          </div>
          <div className="header-right">
            <nav>
              <ul>
                <li><NavLink to="/guideline">Guideline</NavLink></li>
                <li><NavLink to="/gallery">Gallery</NavLink></li>
                <li><NavLink to="/projects">Contribute</NavLink></li>
                <li><NavLink to="/demo">Demo</NavLink></li>
              </ul>
            </nav>
            <div className="auth-buttons">
              <button
                id="sign-in-btn"
                className="btn-auth"
                onClick={() => {
                  console.log('Sign In Clicked'); // ✅ DEBUG
                  setIsAuthModalOpen(true);
                }}
              >
                Sign In
              </button>
            </div>
            <div id="user-menu" className="user-menu">
              <div id="user-menu-button" className="user-menu-button">
                <div id="user-avatar" className="user-avatar">U</div>
              </div>
              <div id="user-menu-dropdown" className="user-menu-dropdown">
                <div className="user-menu-item" onClick={() => window.location.href = '/profile'}>Profile</div>
                <div className="user-menu-divider"></div>
                <div id="sign-out-btn" className="user-menu-item">Sign Out</div>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Modal renders conditionally */}
      {isAuthModalOpen && <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />}
    </>
  );
};

export default Header;
