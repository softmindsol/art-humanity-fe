import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import AuthModal from '../modal/AuthModal';
import { useSelector } from 'react-redux';
import { getUserById, logoutUser } from '@/redux/action/auth';
import type { RootState } from '@/redux/store';
import useAppDispatch from '@/hook/useDispatch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { openAuthModal, closeAuthModal, selectIsAuthModalOpen } from '@/redux/slice/opeModal';
import { useSocket } from '@/context/SocketContext';
import { fetchNotifications, markNotificationsAsRead, markSingleNotificationRead } from '@/redux/action/notification';
import { Bell } from 'lucide-react';
import { addNotification } from '@/redux/slice/notification';
import { useOnClickOutside } from '@/hook/useOnClickOutside';

const Header = () => {
  const isAuthModalOpen = useSelector(selectIsAuthModalOpen);
  const dispatch = useAppDispatch();
  const { user, profile } = useSelector((state: RootState) => state.auth);
  const notificationRef = useRef<HTMLDivElement>(null);

  // --- NOTIFICATION STATE ---
  const { notifications, unreadCount } = useSelector((state: RootState) => state?.notifications) || []; // <-- Notification state
  const [isNotificationOpen, setIsNotificationOpen] = useState(false); // <-- Dropdown ke liye state
  const { socket }: any = useSocket(); // <-- Socket instance hasil karein

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

  useOnClickOutside(notificationRef, () => setIsNotificationOpen(false));

  useEffect(() => {
    if (user && user?.id) {
      dispatch(getUserById(user.id));
      // --- JAISE HI USER LOGIN HO, NOTIFICATIONS FETCH KAREIN ---
      dispatch(fetchNotifications({ userId: user?.id })); // <--
    }
  }, [user, dispatch]);

  // --- REAL-TIME NOTIFICATION LISTENER ---
  useEffect(() => {
    // Ab 'socket' variable ya to اصل socket instance hai ya null
    if (socket) {
      console.log("[Header] Socket instance found, attaching listener.");

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
      dispatch(markNotificationsAsRead({ userId: user?.id }));

    }
  };

  const handleNotificationClick = (notification: any) => {
    // Pehle dropdown band kar dein
    setIsNotificationOpen(false);

    // Agar notification pehle se 'read' nahi hai, to hi API call bhejein
    if (!notification.isRead) {
      console.log(`Marking notification ${notification._id} as read...`);
      dispatch(markSingleNotificationRead({ notificationId: notification._id, userId: user?.id }));
      dispatch(fetchNotifications({ userId: user?.id }));

    }
  };

  useEffect(()=>{
    if (isAuthModalOpen){
      document.body.style.overflow='hidden'
    }
    else {
      document.body.style.overflow = 'auto'
    }

    return ()=>{
      document.body.style.overflow = 'auto'
    }

  }, [isAuthModalOpen])
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
                {user?.id && <li>
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
                              className="text-xs text-blue-600 hover:underline"
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
                                key={notif._id}
                                className={`p-2 rounded-md text-sm ${!notif.isRead ? 'bg-[#f1e6da] font-semibold' : 'text-gray-600'} mb-2`}
                              >
                                <Link to={`/project/${notif.project?.canvasId}`} onClick={() => handleNotificationClick(notif)}
                                >
                                  {notif.message}
                                  <div className='text-xs text-gray-500 mt-1'>{new Date(notif.createdAt).toLocaleString()}</div>
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

            <div className="auth-buttons " style={{ zIndex: 2000 }}>
              {profile ? (
                <>

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
                  </DropdownMenu></>
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
        </header>
      </div>

      {/* Modal renders conditionally */}
      {isAuthModalOpen && <AuthModal isOpen={isAuthModalOpen} onClose={() => dispatch(closeAuthModal())} />}
    </>
  );
};

export default Header;
