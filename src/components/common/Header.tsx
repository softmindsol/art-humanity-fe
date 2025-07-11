import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import AuthModal from '../modal/AuthModal';
import {  useSelector } from 'react-redux';
import { getUserById } from '@/redux/action/auth';
import type { RootState } from '@/redux/store';
import useAppDispatch from '@/hook/useDispatch';

const Header = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { user, profile } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (user && user.id) {
      dispatch(getUserById(user.id));
    }
  }, [user, dispatch]);

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
              {profile ? (
                <div className="user-avatar">
                  {profile.fullName.charAt(0).toUpperCase()}
                </div>
              ) : (
                <button
                  id="sign-in-btn"
                  className="btn-auth"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  Sign In
                </button>
              )}
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
