import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

// Derive socket URL from current page origin, or use env variable
const getSocketUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  // In dev with Vite proxy, backend is on port 5000
  if (import.meta.env.DEV) return 'http://localhost:5000';
  // In production, same origin
  return window.location.origin;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    const s = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    s.on('connect', () => {
      console.log('🔌 Socket connected:', s.id);
      setConnected(true);
    });

    s.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setConnected(false);
    });

    s.on('userCount', (count) => setUserCount(count));

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected, userCount }}>
      {children}
    </SocketContext.Provider>
  );
};
