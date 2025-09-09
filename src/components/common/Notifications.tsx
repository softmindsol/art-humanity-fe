import  { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useSelector } from 'react-redux';
// Redux state aur actions (yeh hum abhi banayenge)
// import useSocket from '@/hooks/useSocket'; // Farz karein aapne socket ke liye ek custom hook banaya hai
import { selectAllNotifications, selectUnreadCount } from '@/redux/slice/notification';
import { fetchNotifications, markNotificationsAsRead } from '@/redux/action/notification';
import useAppDispatch from '@/hook/useDispatch';
import { useSocket } from '@/context/SocketContext';
import useAuth from '@/hook/useAuth';

export const Notifications = () => {
    const dispatch = useAppDispatch();
    const {user} = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const notifications = useSelector(selectAllNotifications);
    const unreadCount = useSelector(selectUnreadCount);
    const socket:any = useSocket(); // Socket instance hasil karein

    // Pehli baar notifications fetch karein
    useEffect(() => {
        dispatch(fetchNotifications({ userId :user?.id}));
    }, [dispatch]);

    // Real-time mein nayi notifications sunein
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = () => {
            // Jab nayi notification aaye, to list ko dobara fetch karein
            dispatch(fetchNotifications({ userId: user?.id }));
        };

        socket.on('new_notification', handleNewNotification);

        return () => {
            socket.off('new_notification', handleNewNotification);
        };
    }, [socket, dispatch]);

    const handleBellClick = () => {
        setIsOpen(!isOpen);
        // Agar unread notifications hain, to unhe 'read' mark kar dein
        if (unreadCount > 0) {
            dispatch(markNotificationsAsRead({ userId: user?.id }));
        }
    };

    return (
        <div className="relative">
            <button onClick={handleBellClick} className="relative">
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white border rounded shadow-lg">
                    <div className="p-2 font-bold border-b">Notifications</div>
                    <div>
                        {notifications.length > 0 ? (
                            notifications.map((notif:any) => (
                                <div key={notif._id} className={`p-2 border-b !m-0 ${!notif.isRead ? 'bg-blue-50' : ''}`}>
                                    <p className="text-sm">{notif.message}</p>
                                    <p className="text-xs text-gray-500">{new Date(notif.createdAt).toLocaleString()}</p>
                                </div>
                            ))
                        ) : (
                            <p className="p-4 text-center text-gray-500">No new notifications.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};