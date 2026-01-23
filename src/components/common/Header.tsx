import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
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
  closeAuthModal,
  selectIsAuthModalOpen,
  openDonationForm,
} from "@/redux/slice/opeModal";
import { useSocket } from "@/context/SocketContext";
import {
  fetchNotifications,
  markNotificationsAsRead,
  markSingleNotificationRead,
} from "@/redux/action/notification";
import {
  Bell,
  FileText,
  Heart,
  Image,
  LogOut,
  Menu,
  PlayCircle,
  UserCircle2,
  Users,
  X,
  Home,
} from "lucide-react";
import { addNotification } from "@/redux/slice/notification";
import useOnClickOutside from "@/hook/useOnClickOutside";
import { toast } from "sonner";
import DonationForm from "../stripe/DonationForm";
import CheckoutForm from "../stripe/CheckoutForm";
import PaymentSuccessModal from "../modal/PaymentSuccessModal";
import ConfirmationModal from "../modal/ConfirmationModal";
import CustomModal from "../modal/CustomModal";

const Header = () => {
  const isAuthModalOpen = useSelector(selectIsAuthModalOpen);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, profile } = useSelector((state: RootState) => state.auth);

  const notificationRef = useRef<HTMLDivElement>(null);
  // --- DRAWER STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- NOTIFICATION STATE ---
  const { notifications, unreadCount } =
    useSelector((state: RootState) => state?.notifications) || []; // <-- Notification state
  const [isNotificationOpen, setIsNotificationOpen] = useState(false); // <-- Dropdown ke liye state
  const { socket }: any = useSocket(); // <-- Socket instance hasil karein
  // ----State----
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // --- DONATION MODAL KE LIYE NAYI STATE ---
  const [donationState, setDonationState] = useState({
    isFormOpen: false, // Yeh DonationForm (amount input) ko control karega
    isCheckoutOpen: false, // Yeh CheckoutForm (card input) ko control karega
    clientSecret: null as string | null,
    amount: 0,
  });

  useOnClickOutside([notificationRef], () => setIsNotificationOpen(false));
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // Loading state

  const handleLogout = () => {
    // Ab yeh function foran logout nahi karega, sirf modal kholega
    setIsLogoutModalOpen(true);
  };

  // Jab user modal ke andar "Logout" button par click karega
  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      localStorage.clear();
      window.location.href = "/"; // Redirect to home page for a full refresh
      await dispatch(logoutUser()).unwrap();
    } catch (err) {
      // toast.error("Logout failed. Please try again.");
      console.error("Logout failed", err);
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false); // Modal ko band karein
    }
  };

  // Jab DonationForm 'onDonate' call kare
  const handleOnDonate = (clientSecret: string, amount: number) => {
    setDonationState({
      isFormOpen: false, // Amount wala form band kar do
      isCheckoutOpen: true, // Card wala form khol do
      clientSecret,
      amount,
    });
  };

  // Jab payment kamyab ho jaye
  const handlePaymentSuccess = () => {
    toast.success("Thank you for your generous donation!");
    setDonationState({
      isFormOpen: false,
      isCheckoutOpen: false,
      clientSecret: null,
      amount: 0,
    });
    setIsSuccessModalOpen(true);
  };

  const handleSupportClick = () => {
    // if (onOpenDonationForm) {
    //   onOpenDonationForm();
    // }
    // // Foran apne andar wala modal kholein
    setDonationState({ ...donationState, isFormOpen: true });
    dispatch(openDonationForm());
    handleLinkClick();
  };

  useEffect(() => {
    if (user && user?._id) {
      dispatch(getUserById(user?._id));
      // --- JAISE HI USER LOGIN HO, NOTIFICATIONS FETCH KAREIN ---
      dispatch(fetchNotifications({ userId: user?._id })); // <--
    }
  }, [user, dispatch]);

  // --- REAL-TIME NOTIFICATION LISTENER ---
  useEffect(() => {
    // Ab 'socket' variable ya to اصل socket instance hai ya null
    if (socket) {
      const handleNewNotification = (notification: any) => {
        console.log("New notification received:", notification);
        dispatch(addNotification(notification));
      };

      socket.on("new_notification", handleNewNotification);

      // Listener ko hamesha cleanup karein
      return () => {
        console.log("[Header] Cleaning up socket listener.");
        socket.off("new_notification", handleNewNotification);
      };
    } else {
      console.log("[Header] No socket instance found, listener not attached.");
    }
  }, [socket, dispatch]); // Dependency array bilkul sahi hai

  // --- BELL ICON PAR CLICK HANDLE KAREIN ---
  const handleBellClick = () => {
    setIsNotificationOpen((prev) => !prev);
  };
  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.preventDefault(); // Agar yeh link hai to page navigate na ho
    e.stopPropagation(); // Event bubble na ho
    if (unreadCount > 0) {
      console.log("Marking all notifications as read via button click...");
      dispatch(markNotificationsAsRead({ userId: user?._id }));
    }
  };
  // Link click par drawer band karne ke liye function
  const handleLinkClick = () => {
    setIsSidebarOpen(false);
  };

  const handleNotificationClick = (notification: any) => {
    // Pehle dropdown band kar dein
    setIsNotificationOpen(false);

    // Agar notification pehle se 'read' nahi hai, to hi API call bhejein
    if (!notification.isRead) {
      console.log(`Marking notification ${notification._id} as read...`);
      dispatch(
        markSingleNotificationRead({
          notificationId: notification._id,
          userId: user?._id,
        }),
      );
      dispatch(fetchNotifications({ userId: user?._id }));
    }
  };

  useEffect(() => {
    if (isAuthModalOpen || isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isAuthModalOpen, isSidebarOpen]);
  useEffect(() => {
    if (user && user._id) {
      dispatch(getUserById(user._id));
    }
  }, [user, dispatch]);

  // --- HIDE HEADER ON AUTH PAGES ---
  const location = useLocation();
  if (location.pathname === "/signup" || location.pathname === "/login" || location.pathname === "/forgot-password") {
    return null;
  }

  return (
    <>
      {/* Fixed Pill Container */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[1000] w-[95%] ">
        <header className="flex items-center justify-between px-6 !py-[5px] rounded-full  border border-white/20 shadow-2xl bg-black/10 backdrop-blur-[2px]">
          {/* Logo Section */}
          <div className="logo-container">
            <Link to="/" className="logo-link flex items-center gap-3">
              <img
                src="/assets/logo.svg"
                alt="Logo"
                className="w-14 h-14 object-contain"
              />
            </Link>
          </div>

          {/* Navigation - Hidden on Mobile */}
          <div className="desktop-nav hidden md:flex items-center gap-8">
            <nav className="hidden md:block">
              <ul className="flex items-center gap-8">
                <li>
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      isActive
                        ? "active text-white flex items-center gap-2"
                        : "text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
                    }
                  >
                    <Home size={16} />
                    <span className="hidden lg:inline">Home</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/guideline"
                    className={({ isActive }) =>
                      isActive
                        ? "active text-white flex items-center gap-2"
                        : "text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
                    }
                  >
                    <FileText size={16} />
                    <span className="hidden lg:inline">Guideline</span>
                  </NavLink>
                </li>
                {
                  // user!=null &&
                  <li>
                    <NavLink
                      to="/gallery"
                      className={({ isActive }) =>
                        isActive
                          ? "active text-white flex items-center gap-2"
                          : "text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
                      }
                    >
                      <Image size={16} />
                      <span className="hidden lg:inline">Gallery</span>
                    </NavLink>
                  </li>
                }
                {
                  // user != null &&
                  <li>
                    <NavLink
                      to="/projects"
                      className={({ isActive }) =>
                        isActive
                          ? "active text-white flex items-center gap-2"
                          : "text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
                      }
                    >
                      <Users size={16} />
                      <span className="hidden lg:inline">Contribute</span>
                    </NavLink>
                  </li>
                }
                <li>
                  <NavLink
                    to="/demo"
                    className={({ isActive }) =>
                      isActive
                        ? "active text-white flex items-center gap-2"
                        : "text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
                    }
                  >
                    <PlayCircle size={16} />
                    <span className="hidden lg:inline">Demo</span>
                  </NavLink>
                </li>

                {/* Bell Icon for Notifications */}
                {user?._id && (
                  <li>
                    <div ref={notificationRef} className="relative mt-1">
                      <button
                        onClick={handleBellClick}
                        className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
                            {unreadCount}
                          </span>
                        )}
                      </button>

                      {/* --- NOTIFICATION DROPDOWN --- */}
                      {isNotificationOpen && (
                        <div className="absolute right-0 mt-4 w-80 bg-[#1A1D24] border border-white/10 rounded-xl shadow-2xl max-h-96 overflow-y-auto p-2 z-[2000]">
                          <div className="p-3 flex justify-between items-center border-b border-white/5 mb-2">
                            <span className="font-bold text-white text-sm">
                              Notifications
                            </span>
                            {unreadCount > 0 && (
                              <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs text-red-400 hover:text-red-300 transition-colors"
                              >
                                Mark all as read
                              </button>
                            )}
                          </div>
                          {notifications.length > 0 ? (
                            <ul className="space-y-1 flex flex-col">
                              {notifications.map((notif: any) => (
                                <li
                                  key={notif?._id}
                                  className={`p-3 rounded-lg text-sm transition-colors ${!notif.isRead ? "bg-white/5 hover:bg-white/10" : "bg-transparent hover:bg-white/5"} mb-1`}
                                >
                                  <Link
                                    to={`/project/${notif.project?.canvasId}`}
                                    onClick={() =>
                                      handleNotificationClick(notif)
                                    }
                                    className="block"
                                  >
                                    <div
                                      className={`mb-1 ${!notif.isRead ? "text-white font-medium" : "text-gray-400"}`}
                                    >
                                      {notif?.message}
                                    </div>
                                    <div className="text-[10px] text-gray-500">
                                      {new Date(
                                        notif?.createdAt,
                                      ).toLocaleString()}
                                    </div>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="p-8 text-center text-gray-500 text-sm">
                              No new notifications
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                )}
              </ul>
            </nav>

            {/* Auth Buttons - Hidden on Mobile (moved to sidebar) */}
            <div className="auth-buttons hidden md:flex items-center">
              {profile ? (
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      {profile?.avatar ? (
                        <img
                          src={profile?.avatar}
                          alt="Avatar"
                          className="w-9 h-9 rounded-full object-cover cursor-pointer border-2 border-white/20 hover:border-white transition-colors"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FFD93D] text-white flex items-center justify-center font-bold cursor-pointer select-none shadow-lg">
                          {profile?.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-60 bg-[#1A1D24] border border-white/10 rounded-xl shadow-2xl text-gray-200 mt-2"
                    >
                      <DropdownMenuLabel className="p-3">
                        <div className="font-bold text-white mb-0.5">
                          {profile?.fullName}
                        </div>
                        <div className="text-xs text-gray-500 font-normal truncate">
                          {profile?.email}
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/10" />

                      <Link to="/profile">
                        <DropdownMenuItem className="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white transition-colors flex items-center gap-2 p-2.5 rounded-md mx-1 my-0.5">
                          <UserCircle2 size={16} />
                          <span>Profile</span>
                        </DropdownMenuItem>
                      </Link>

                      <DropdownMenuItem
                        onClick={handleSupportClick}
                        className="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white transition-colors flex items-center gap-2 p-2.5 rounded-md mx-1 my-0.5"
                      >
                        <Heart size={16} />
                        <span>Support Us</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300 transition-colors flex items-center gap-2 p-2.5 rounded-md mx-1 my-0.5"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <button
                  id="sign-in-btn"
                  className="px-6 py-2 rounded-full font-medium text-white bg-gradient-to-r from-[#E23373] to-[#FEC133] hover:opacity-90 transition-opacity transform active:scale-95 shadow-[0_0_20px_rgba(226,51,115,0.4)] font-montserrat"
                  onClick={() => navigate('/signup')}
                >
                  Sign In
                </button>
              )}
            </div>

          </div>

          {/* Mobile Menu Button - Direct Child */}
          <div className="md:hidden relative z-100 flex items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="!text-white hover:bg-white/10 p-2 rounded-full transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>
      </div>
      <div
        onClick={() => setIsSidebarOpen(false)}
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300
                    ${isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      ></div>

      {/* ===== SIDEBAR PANEL (WITH AUTH LOGIC) ===== */}
      <div
        className={`fixed top-0 right-0 h-full w-72 max-w-[80%] bg-[#1A1D24] border-l border-white/10 p-5 z-[2000] shadow-2xl 
                transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Close Button */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          {/* Logo (Left side) */}
          <Link
            to="/"
            onClick={handleLinkClick}
            className="flex items-center gap-x-3"
          >
            <img src="/assets/logo.svg" alt="Logo" className="h-10 w-10 object-contain" />
          </Link>

          {/* Close Button (Right side) */}
          <button onClick={() => setIsSidebarOpen(false)} className="text-white/70 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Flex container to push auth section to the bottom */}
        <div className="flex flex-col justify-between h-[calc(100%-100px)]">
          {/* Navigation Links */}
          <nav>
            <ul className="flex flex-col gap-y-2">
              {/* Home Link */}
              <li>
                <NavLink
                  to="/"
                  onClick={handleLinkClick}
                  className="cursor-pointer text-gray-300 hover:text-white hover:bg-white/5 p-3 rounded-lg transition-all flex items-center gap-3 font-medium"
                >
                  <span className="text-lg">Home</span>
                </NavLink>
              </li>

              {/* Guideline Link */}
              <li>
                <NavLink
                  to="/guideline"
                  onClick={handleLinkClick}
                  className="cursor-pointer text-gray-300 hover:text-white hover:bg-white/5 p-3 rounded-lg transition-all flex items-center gap-3 font-medium"
                >
                  <FileText size={20} />
                  <span>Guideline</span>
                </NavLink>
              </li>

              {/* Gallery Link */}
              {/* user && ( // Uncomment if needed */ }
                 <li>
                  <NavLink
                    to="/gallery"
                    onClick={handleLinkClick}
                    className="cursor-pointer text-gray-300 hover:text-white hover:bg-white/5 p-3 rounded-lg transition-all flex items-center gap-3 font-medium"
                  >
                    <Image size={20} />
                    <span>Gallery</span>
                  </NavLink>
                </li>
             { /* ) */ }

              {/* Contribute Link */}
              {/* user && ( // Uncomment if needed */ }
                <li>
                  <NavLink
                    to="/projects"
                    onClick={handleLinkClick}
                    className="cursor-pointer text-gray-300 hover:text-white hover:bg-white/5 p-3 rounded-lg transition-all flex items-center gap-3 font-medium"
                  >
                    <Users size={20} />
                    <span>Contribute</span>
                  </NavLink>
                </li>
              { /* ) */ }

              {/* Demo Link */}
              <li>
                <NavLink
                  to="/demo"
                  onClick={handleLinkClick}
                  className="cursor-pointer text-gray-300 hover:text-white hover:bg-white/5 p-3 rounded-lg transition-all flex items-center gap-3 font-medium"
                >
                  <PlayCircle size={20} />
                  <span>Demo</span>
                </NavLink>
              </li>

              {/* Support Us Link */}
              {user?._id && (
                <li
                  onClick={handleSupportClick}
                  className="cursor-pointer text-gray-300 hover:text-white hover:bg-white/5 p-3 rounded-lg transition-all flex items-center gap-3 font-medium"
                >
                  <Heart size={20} />
                  <span>Support Us</span>
                </li>
              )}
            </ul>
          </nav>

          {/* Auth Section (Sign In OR Profile/Logout) */}
          <div className="pt-6 border-t border-white/10">
            {profile ? (
              // --- AGAR USER LOGGED IN HAI ---
              <div className="flex flex-col items-center gap-4">

                 <div className="flex items-center gap-3 w-full p-2 rounded-lg bg-white/5">
                    {profile?.avatar ? (
                        <img
                          src={profile?.avatar}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FFD93D] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                          {profile?.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    <div className="flex flex-col overflow-hidden">
                        <span className="font-semibold text-white truncate">{profile.fullName}</span>
                        <span className="text-xs text-gray-400 truncate">{profile.email}</span>
                    </div>
                 </div>

                <button
                  onClick={() => {
                    handleLogout();
                    handleLinkClick(); 
                  }}
                  className="w-full cursor-pointer py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            ) : (
              // --- AGAR USER LOGGED OUT HAI ---
              <button
                onClick={() => {
                  navigate('/signup'); 
                  handleLinkClick(); 
                }}
                className="w-full cursor-pointer py-3 rounded-full font-bold text-white bg-gradient-to-r from-[#E23373] to-[#FEC133] hover:opacity-90 shadow-lg transition-all active:scale-95"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1. Amount Input Wala Modal */}
      {/* <Dialog open={isDonationFormOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) dispatch(closeDonationForm());
        }}>
        <DialogContent className="bg-[#5d4037] border-2 border-[#3e2723] text-white font-[Georgia, serif] max-w-3xl">
          <DonationForm onDonate={handleOnDonate} />
        </DialogContent>
      </Dialog> */}
      <CustomModal
        isOpen={donationState.isFormOpen}
        onClose={() => {
          setDonationState({ ...donationState, isFormOpen: false });
        }}
      >
        <DonationForm onDonate={handleOnDonate} />
      </CustomModal>

      {/* 2. Card Input Wala Modal */}
      {/* <Dialog open={donationState.isCheckoutOpen} onOpenChange={(isOpen) => setDonationState({ ...donationState, isCheckoutOpen: isOpen })}>
        <DialogContent className="!bg-[#5d4037] border-2 border-[#3e2723] text-white font-[Georgia, serif] max-w-3xl">
          <DialogHeader>
            <DialogTitle className='!text-white'>Confirm Your Donation</DialogTitle>
          </DialogHeader>
          {donationState.clientSecret && (
            <CheckoutForm
              clientSecret={donationState.clientSecret}
              projectPrice={donationState.amount}
              onPaymentSuccess={handlePaymentSuccess}
            />
          )}
        </DialogContent>
      </Dialog> */}
      <CustomModal
        isOpen={donationState.isCheckoutOpen}
        onClose={() =>
          setDonationState({ ...donationState, isCheckoutOpen: false })
        }
      >
        {donationState.clientSecret && (
          <CheckoutForm
            clientSecret={donationState.clientSecret}
            projectPrice={donationState.amount}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
      </CustomModal>
      {/* Modal renders conditionally */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => dispatch(closeAuthModal())}
        />
      )}
      <PaymentSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        paymentType="donation" // Is baar type 'donation' hai
        // Donation ke case mein project ya download handler ki zaroorat nahi
      />
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
        title="Are you sure you want to log out?"
        description="You will be returned to the homepage. You can always log back in anytime."
        confirmText="Yes, Logout"
        isLoading={isLoggingOut}
      />
      
    </>
  );
};

export default Header;
