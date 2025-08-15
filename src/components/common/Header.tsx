import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import AuthModal from '../modal/AuthModal';
import { useSelector } from 'react-redux';
import { getUserById, logoutUser } from '@/redux/action/auth';
import type { RootState } from '@/redux/store';
import useAppDispatch from '@/hook/useDispatch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';

const Header = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { user, profile } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser())
      .unwrap()
      .then(() => {
        localStorage.clear(); // optional, if using redux-persist
        window.location.reload()
      })
      .catch((err) => {
        console.error("Logout failed", err);
      });
  };
  
  useEffect(() => {
    if (user && user.id) {
      dispatch(getUserById(user.id));
    }
  }, [user, dispatch]);

  return (
    <>
      <div className="header-container">
        <header className='z-10  '>
          <div className="logo-container">
            <Link to="/" className="logo-link">
              <img src="/favicon.PNG" alt="Logo" className="logo" />
              <div className="logo-text ">
                <h1>Project Art of Humanity</h1>
                <p className="tagline">Collaborative Canvases of Human Expression</p>
              </div>
            </Link>
          </div>
          <div className="header-right flex items-center">
            <nav>
              <ul>
                <li><NavLink to="/guideline">Guideline</NavLink></li>
                {
                  user!=null &&   <li><NavLink to="/gallery">Gallery</NavLink></li>
                  
                }
                {
                  user != null && <li><NavLink to="/projects">Contribute</NavLink></li>

                }
               
              
                <li><NavLink to="/demo">Demo</NavLink></li>
              </ul>
            </nav>

            <div className="auth-buttons " style={{zIndex:2000}}>
              {profile ? (
                <DropdownMenu >
                  <DropdownMenuTrigger asChild>
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt="Avatar"
                        className="w-9 h-9 rounded-full object-cover cursor-pointer border-2 border-[#d4af37] shadow-md hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full bg-[#5d4037] text-white flex items-center justify-center font-bold cursor-pointer select-none transition-transform hover:scale-105 shadow-md"
                      >
                        {profile.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-60 bg-[#fef9f4] border border-[#d4af37] rounded-lg shadow-lg"
                  >
                    <DropdownMenuLabel>
                      <div className="font-medium text-[#5d4037] ">{profile.fullName}</div>
                      <div className="text-xs text-[#7e5d52]">{profile.email}</div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[#d4af37]" />

                    <Link to='/profile'>  
                    <DropdownMenuItem
                      className="cursor-pointer text-[#5d4037] hover:bg-[#f1e6da] transition-colors"
                    >
                      Profile           
                    </DropdownMenuItem>
                     </Link>
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-red-600 hover:bg-[#f1e6da] transition-colors"
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
