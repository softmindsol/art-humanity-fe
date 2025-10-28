import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import AuthModal from '../modal/AuthModal';
import { useSelector } from 'react-redux';
import { getUserById, logoutUser } from '@/redux/action/auth';
import type { RootState } from '@/redux/store';
import useAppDispatch from '@/hook/useDispatch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { openAuthModal, closeAuthModal, selectIsAuthModalOpen, openDonationForm } from '@/redux/slice/opeModal';
import { useSocket } from '@/context/SocketContext';
import { fetchNotifications, markNotificationsAsRead, markSingleNotificationRead } from '@/redux/action/notification';
import { Bell, FileText, Heart, Image, LogOut, Menu, PlayCircle, UserCircle2, Users, X } from 'lucide-react';
import { addNotification } from '@/redux/slice/notification';
import useOnClickOutside from '@/hook/useOnClickOutside';
import { toast } from 'sonner';
import DonationForm from '../stripe/DonationForm';
import CheckoutForm from '../stripe/CheckoutForm';
import PaymentSuccessModal from '../modal/PaymentSuccessModal';
import ConfirmationModal from '../modal/ConfirmationModal';
import CustomModal from '../modal/CustomModal';

const Header = () => {
  const isAuthModalOpen = useSelector(selectIsAuthModalOpen);
  const dispatch = useAppDispatch();
  const { user, profile } = useSelector((state: RootState) => state.auth);

  const notificationRef = useRef<HTMLDivElement>(null);
  // --- DRAWER STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- NOTIFICATION STATE ---
  const { notifications, unreadCount } = useSelector((state: RootState) => state?.notifications) || []; // <-- Notification state
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
      window.location.href = '/'; // Redirect to home page for a full refresh
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
    setDonationState({ isFormOpen: false, isCheckoutOpen: false, clientSecret: null, amount: 0 });
    setIsSuccessModalOpen(true);

  };

  const handleSupportClick = () => {
    // if (onOpenDonationForm) {
    //   onOpenDonationForm();
    // }
    // // Foran apne andar wala modal kholein
    setDonationState({ ...donationState, isFormOpen: true });
    dispatch(openDonationForm())
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

      socket.on('new_notification', handleNewNotification);

      // Listener ko hamesha cleanup karein
      return () => {
        console.log("[Header] Cleaning up socket listener.");
        socket.off('new_notification', handleNewNotification);
      };
    } else {
      console.log("[Header] No socket instance found, listener not attached.");
    }
  }, [socket, dispatch]); // Dependency array bilkul sahi hai



  // --- BELL ICON PAR CLICK HANDLE KAREIN ---
  const handleBellClick = () => {
    setIsNotificationOpen(prev => !prev);
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
  }

  const handleNotificationClick = (notification: any) => {
    // Pehle dropdown band kar dein
    setIsNotificationOpen(false);

    // Agar notification pehle se 'read' nahi hai, to hi API call bhejein
    if (!notification.isRead) {
      console.log(`Marking notification ${notification._id} as read...`);
      dispatch(markSingleNotificationRead({ notificationId: notification._id, userId: user?._id }));
      dispatch(fetchNotifications({ userId: user?._id }));

    }
  };

  useEffect(() => {
    if (isAuthModalOpen || isSidebarOpen) {
      document.body.style.overflow = 'hidden'
    }
    else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }

  }, [isAuthModalOpen, isSidebarOpen])
  useEffect(() => {
    if (user && user._id) {
      dispatch(getUserById(user._id));
    }
  }, [user, dispatch]);

  return (
    <>
      <div className="header-container ">
        <header className=' !max-w-7xl  !z-[1000]  '>
          <div className="logo-container">
            <Link to="/" className="logo-link">
              <img src="/favicon.PNG" alt="Logo" className="logo" />
              <div className="logo-text ">
                <h1 className='text-[24px] text-[#333] font-bold'>MurArt</h1>
                <p className="tagline">Collaborative Canvases of Human Expression</p>
              </div>
            </Link>
          </div>


          <div className="header-right flex items-center">
            <nav>
              <ul className=''>
                <li><NavLink to="/guideline">Guideline</NavLink></li>
                {
                  // user!=null &&   
                  <li><NavLink to="/gallery">Gallery</NavLink></li>

                }
                {
                  // user != null && 
                  <li><NavLink to="/projects">Contribute</NavLink></li>

                }


                <li><NavLink to="/demo">Demo</NavLink></li>
                {user?._id && <li>
                  <div ref={notificationRef} className=" mt-2 md:mt-3">
                    <button
                      onClick={handleBellClick}
                      className="text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                    >
                      <Bell size={24} className='' />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {/* --- NOTIFICATION DROPDOWN --- */}
                    {isNotificationOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-[#fef9f4] border border-[#d4af37] rounded-lg shadow-lg max-h-96 overflow-y-auto p-2">
                        <div className="p-2 flex justify-between items-center">
                          <span className="font-bold text-[#5d4037]">Notifications</span>

                          {/* --- YAHAN PAR BUTTON HAI --- */}
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllAsRead}
                              className="text-xs text-red-600 hover:underline cursor-pointer"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>
                        <DropdownMenuSeparator className="bg-[#d4af37]" />
                        {notifications.length > 0 ? (
                          <ul className="space-y-1 flex flex-col ">
                            {notifications.map((notif: any) => (
                              <li
                                key={notif?._id}
                                className={`p-2 rounded-md text-sm !mr-0 ${!notif.isRead ? 'bg-[#f1e6da] font-semibold ' : 'text-gray-600'} mb-2`}
                              >
                                <Link to={`/project/${notif.project?.canvasId}`} onClick={() => handleNotificationClick(notif)}
                                >
                                  {notif?.message}
                                  <div className='text-xs text-gray-500 mt-1'>{new Date(notif?.createdAt).toLocaleString()}</div>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="p-4 text-center text-gray-500">You have no notifications.</div>
                        )}
                      </div>
                    )}
                  </div>
                </li>}
              </ul>
            </nav>

            <div className="auth-buttons " style={{ zIndex: 2000 }} >
              {profile ? (
                <div >

                  <DropdownMenu >
                    <DropdownMenuTrigger asChild>
                      {profile?.avatar ? (
                        <img
                          src={profile?.avatar}
                          alt="Avatar"
                          className="w-9 h-9 rounded-full object-cover cursor-pointer border-2 border-[#d4af37] shadow-md hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full bg-[#5d4037] text-white flex items-center justify-center font-bold cursor-pointer select-none transition-transform hover:scale-105 shadow-md"
                        >
                          {profile?.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-60 bg-[#fef9f4] border border-[#d4af37] rounded-lg shadow-lg"
                    >
                      <DropdownMenuLabel>
                        <div className="font-medium text-[#5d4037] ">{profile?.fullName}</div>
                        <div className="text-xs text-[#7e5d52]">{profile?.email}</div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-[#d4af37]" />

                      {/* --- PROFILE LINK WITH ICON --- */}
                      <Link to='/profile'>
                        <DropdownMenuItem className="cursor-pointer text-[#5d4037] hover:bg-[#f1e6da] transition-colors flex items-center gap-2">
                          <UserCircle2 size={16} />
                          <span>Profile</span>
                        </DropdownMenuItem>
                      </Link>

                      {/* --- SUPPORT US LINK WITH ICON --- */}
                      <DropdownMenuItem
                        // onClick={() => setDonationState({ ...donationState, isFormOpen: true })}
                        onClick={handleSupportClick}
                        className="cursor-pointer text-[#5d4037] hover:bg-[#f1e6da] transition-colors flex items-center gap-2"
                      >
                        <Heart size={16} />
                        <span>Support Us</span>
                      </DropdownMenuItem>

                      {/* --- LOGOUT BUTTON WITH ICON --- */}
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer text-red-600 hover:bg-[#f1e6da] transition-colors flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu></div>
              ) : (
                <button
                  id="sign-in-btn"
                  className="btn-auth"
                  onClick={() => dispatch(openAuthModal())}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
          <div className='lg:hidden mr-3'>
            <button onClick={() => setIsSidebarOpen(true)}>
              <Menu size={28} className='cursor-pointer' />
            </button>
          </div>
        </header>
      </div>
      <div
        onClick={() => setIsSidebarOpen(false)}
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300
                    ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`
        }
      ></div>

      {/* ===== SIDEBAR PANEL (WITH AUTH LOGIC) ===== */}
      <div
        className={`fixed top-0 right-0 h-full w-72 max-w-[80%] bg-[#f5f5dc] p-5 z-50 shadow-lg 
                transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`
        }
      >
        {/* Close Button */}
        <div className="flex items-center justify-between mb-5 pb-2 border-b border-accent-dark">
          {/* Logo (Left side) */}
          <Link to="/" onClick={handleLinkClick} className="flex items-center gap-x-3">
            <img src="/favicon.PNG" alt="Logo" className="h-10 w-10" />
            {/* <span className="font-bold text-primary-dark text-lg font-playfair">Project Art</span> */}
          </Link>

          {/* Close Button (Right side) */}
          <button onClick={() => setIsSidebarOpen(false)}>
            <X className="h-6 w-6 text-primary-dark" />
          </button>
        </div>


        {/* Flex container to push auth section to the bottom */}
        <div className="flex flex-col justify-between h-[calc(100%-64px)]">

          {/* Navigation Links */}
          <nav>
            <ul className="flex flex-col gap-y-4">
              {/* Guideline Link with Icon */}
              <li>
                <NavLink
                  to="/guideline"
                  onClick={handleLinkClick}
                  className="cursor-pointer text-[#5d4037] hover:bg-[#f1e6da] transition-colors !flex !items-center gap-2"
                >
                  <FileText size={24} />
                  <span>Guideline</span>
                </NavLink>
              </li>

              {/* Gallery Link with Icon */}
              <li>
                <NavLink
                  to="/gallery"
                  onClick={handleLinkClick}
                  className="cursor-pointer text-[#5d4037] hover:bg-[#f1e6da] transition-colors !flex !items-center gap-2"
                >
                  <Image size={24} />
                  <span>Gallery</span>
                </NavLink>
              </li>

              {/* Contribute Link with Icon */}
              <li>
                <NavLink
                  to="/projects"
                  onClick={handleLinkClick}
                  className="cursor-pointer text-[#5d4037] hover:bg-[#f1e6da] transition-colors !flex !items-center gap-2"
                >
                  <Users size={24} />
                  <span>Contribute</span>
                </NavLink>
              </li>

              {/* Demo Link with Icon */}
              <li>
                <NavLink
                  to="/demo"
                  onClick={handleLinkClick}
                  className="cursor-pointer text-[#5d4037] hover:bg-[#f1e6da] transition-colors !flex !items-center gap-2"
                >
                  <PlayCircle size={24} />
                  <span>Demo</span>
                </NavLink>
              </li>

              {/* Support Us Link with Icon */}
              {user?._id && <span
                onClick={handleSupportClick}
                className="cursor-pointer text-[#5d4037] hover:bg-[#f1e6da] transition-colors !flex !items-center gap-2"
              >
                <Heart size={24} />
                <span>Support Us</span>
              </span>}
            </ul>
          </nav>

          {/* Auth Section (Sign In OR Profile/Logout) */}
          <div className="pt-6 border-t border-[#a1887f]">
            {profile ? (
              // --- AGAR USER LOGGED IN HAI ---
              <div className="text-center">
                <div className="font-semibold text-lg text-[#3e2723]">{profile.fullName}</div>
                <div className="text-sm text-primary mb-4">{profile.email}</div>
                <button
                  onClick={() => {
                    handleLogout();
                    handleLinkClick(); // Sidebar band karein
                  }}
                  className="w-full cursor-pointer py-2 bg-[#3e2723] text-white rounded-full hover:opacity-75 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              // --- AGAR USER LOGGED OUT HAI ---
              <button
                onClick={() => {
                  dispatch(openAuthModal()); // Auth modal kholein
                  handleLinkClick(); // Sidebar band karein
                }}
                className="w-full cursor-pointer py-2 bg-[#3e2723] text-[#ffff] rounded-full font-semibold text-md hover:opacity-75 transition-colors"
              >
                Sign In / Sign Up
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
        onClose={() => { setDonationState({ ...donationState, isFormOpen: false }) }}
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
        onClose={() => setDonationState({ ...donationState, isCheckoutOpen: false })}
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
      {isAuthModalOpen && <AuthModal isOpen={isAuthModalOpen} onClose={() => dispatch(closeAuthModal())} />}
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
