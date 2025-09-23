// src/context/SocketContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store'; // Apne store ki type import karein

// Context ki shape
interface ISocketContext {
  socket: Socket | null;
}

// Context banayein
const SocketContext = createContext<ISocketContext>({
  socket: null,
});

// Custom hook (yeh user ke liye aasani paida karta hai)
export const useSocket = () => {
  return useContext(SocketContext);
};

// Provider ke props ki type
interface SocketProviderProps {
  children: React.ReactNode; // 'any' se behtar
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const { user } = useSelector((state: RootState) => state?.auth);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Sirf tab connect karein jab user mojood ho
    if (user && user._id) {
      const newSocket: Socket = io(import.meta.env.VITE_BASE, {
        query: { userId: user._id }
      });

      // console.log(`[SocketProvider] Socket connected for user: ${user.id}`);
      setSocket(newSocket);

      // Cleanup function (bohat zaroori)
      return () => {
        // console.log(`[SocketProvider] Disconnecting socket for user: ${user.id}`);
        newSocket.disconnect();
      };
    } else {
      // Agar user nahi hai (logout), to socket ko null set karein
      setSocket(null);
    }
  }, [user]); // Yeh effect sirf user ke login/logout par chalega

  // Context ki value ek object hai
  const contextValue = { socket };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};