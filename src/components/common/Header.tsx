import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import AuthModal from "../modal/AuthModal";
import { useSelector } from "react-redux";
import { getUserById, logoutUser } from "@/redux/action/auth";
import type { RootState } from "@/redux/store";
import useAppDispatch from "@/hook/useDispatch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  openAuthModal,
  closeAuthModal,
  selectIsAuthModalOpen,
} from "@/redux/slice/opeModal";
import { Menu, X } from "lucide-react";

const Header = () => {
  const isAuthModalOpen = useSelector(selectIsAuthModalOpen);
  const dispatch = useAppDispatch();
  const { user, profile } = useSelector((state: RootState) => state.auth);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logoutUser())
      .unwrap()
      .then(() => {
        localStorage.clear();
        window.location.reload();
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
      <div className="bg-[#f5f5dc] shadow-md shadow-[#0000001A] w-full">
        <header className="z-50 ">
          {/* Mobile Layout - Icon, Text, Menu in single flex row */}
          <div className="flex items-center justify-between w-full lg:hidden">
            {/* Logo Icon */}
            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center">
                <img
                  src="/favicon.PNG"
                  alt="Logo"
                  className="size-12 flex-shrink-0"
                />
              </Link>
              {/* Text - Center */}
              <div className="flex-1 text-center">
                <h1 className="text-lg font-bold leading-tight text-[#5d4037]">
                  Project Art of Humanity
                </h1>
              </div>
            </div>

            {/* Menu Icon */}
            <button
              className="flex items-center justify-center text-[#5d4037] p-2 hover:bg-[#f1e6da] rounded-md transition-colors"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-6" />
            </button>
          </div>

          {/* Desktop Layout - Original three-section layout */}
          <div className="hidden lg:flex items-center justify-between w-full min-h-[80px]">
            {/* Logo Section - Icon + Text in flex */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link to="/" className="flex items-center gap-3">
                {/* Icon */}
                <img
                  src="/favicon.PNG"
                  alt="Logo"
                  className="size-16 flex-shrink-0"
                />
                {/* Text */}
                <div className="flex flex-col justify-center">
                  <h1 className="text-2xl font-bold leading-tight text-[#5d4037]">
                    Project Art of Humanity
                  </h1>
                  <p className="text-sm leading-tight text-[#7e5d52]">
                    Collaborative Canvases of Human Expression
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop Nav - Centered vertically */}
            <div className="hidden md:flex items-center gap-6">
              <nav className="flex items-center">
                <ul className="flex gap-4 items-center">
                  <li>
                    <NavLink
                      to="/guideline"
                      className="flex items-center h-full"
                    >
                      Guideline
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/gallery" className="flex items-center h-full">
                      Gallery
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/projects"
                      className="flex items-center h-full"
                    >
                      Contribute
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/demo" className="flex items-center h-full">
                      Demo
                    </NavLink>
                  </li>
                </ul>
              </nav>

              <div className="flex items-center" style={{ zIndex: 2000 }}>
                {profile ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      {profile.avatar ? (
                        <img
                          src={profile.avatar}
                          alt="Avatar"
                          className="w-9 h-9 rounded-full object-cover cursor-pointer border-2 border-[#d4af37] shadow-md hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#5d4037] text-white flex items-center justify-center font-bold cursor-pointer select-none transition-transform hover:scale-105 shadow-md">
                          {profile.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-60 bg-[#fef9f4] border border-[#d4af37] rounded-lg shadow-lg"
                    >
                      <DropdownMenuLabel>
                        <div className="font-medium text-[#5d4037] ">
                          {profile.fullName}
                        </div>
                        <div className="text-xs text-[#7e5d52]">
                          {profile.email}
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-[#d4af37]" />
                      <Link to="/profile">
                        <DropdownMenuItem className="cursor-pointer text-[#5d4037] hover:bg-[#f1e6da] transition-colors">
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
                    className="btn-auth w-full py-3 text-lg font-semibold flex items-center justify-center"
                    onClick={() => dispatch(openAuthModal())}
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sidebar - Right side */}
          <div className="relative z-50 w-64 h-full ml-auto bg-[#fef9f4] border-l border-[#d4af37] shadow-lg flex flex-col p-4">
            {/* Close button */}
            <button
              className="absolute top-[26px] right-4 text-[#5d4037] p-1 flex items-center justify-center"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>

            {/* Logo inside Sidebar */}
            <Link
              to="/"
              className="flex items-center gap-2 mb-8"
              onClick={() => setIsSidebarOpen(false)}
            >
              <img
                src="/favicon.PNG"
                alt="Logo"
                className="size-12 flex-shrink-0"
              />
              <h1 className="text-xl font-bold text-[#5d4037]">Project Art</h1>
            </Link>

            {/* Nav links */}
            <nav className="flex flex-col gap-4 !justify-start !items-start ml-2">
              <NavLink
                to="/guideline"
                className="block text-lg font-medium text-[#5d4037] hover:text-[#d4af37] transition"
                onClick={() => setIsSidebarOpen(false)}
              >
                Guideline
              </NavLink>
              <NavLink
                to="/gallery"
                className="block text-lg font-medium text-[#5d4037] hover:text-[#d4af37] transition"
                onClick={() => setIsSidebarOpen(false)}
              >
                Gallery
              </NavLink>
              <NavLink
                to="/projects"
                className="block text-lg font-medium text-[#5d4037] hover:text-[#d4af37] transition"
                onClick={() => setIsSidebarOpen(false)}
              >
                Contribute
              </NavLink>
              <NavLink
                to="/demo"
                className="block text-lg font-medium text-[#5d4037] hover:text-[#d4af37] transition"
                onClick={() => setIsSidebarOpen(false)}
              >
                Demo
              </NavLink>
            </nav>

            {/* Auth Section */}
            <div className="mt-auto pt-6 border-t border-[#d4af37]">
              {profile ? (
                <>
                  <div className="mb-4">
                    <div className="font-medium text-[#5d4037]">
                      {profile.fullName}
                    </div>
                    <div className="text-xs text-[#7e5d52]">
                      {profile.email}
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setIsSidebarOpen(false)}
                    className="block mb-3 text-[#5d4037] hover:text-[#d4af37]"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-red-600 hover:text-[#d4af37] w-full text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  id="sign-in-btn-mobile"
                  className="btn-auth w-full py-3 text-lg font-semibold flex items-center justify-center"
                  onClick={() => {
                    setIsSidebarOpen(false);
                    dispatch(openAuthModal());
                  }}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => dispatch(closeAuthModal())}
        />
      )}
    </>
  );
};

export default Header;