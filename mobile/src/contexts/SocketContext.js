// mobile/src/contexts/SocketContext.js
// Socket Context - Global Socket State Management

import React, { createContext, useContext, useEffect, useState } from 'react';
import socketService from '../services/socket.service';
import { useAuth } from './AuthContext'; // ✅ Import useAuth

export const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const { user } = useAuth(); // ✅ Consume AuthContext

  // ✅ Effect: Connect/Disconnect based on user state
  useEffect(() => {
    if (user) {
      // User logged in -> Connect
      console.log('👤 User logged in, connecting socket...');
      initializeSocket();
    } else {
      // User logged out -> Disconnect
      console.log('👤 User logged out, disconnecting socket...');
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [user]); // ✅ Run when user changes

  /**
   * เชื่อมต่อ Socket
   */
  const initializeSocket = async () => {
    try {
      // เชื่อมต่อ
      const connected = await socketService.connect();

      if (connected) {
        // อัพเดทสถานะ
        const status = socketService.getConnectionStatus();
        setIsConnected(status.connected);
        setSocketId(status.socketId);
      }

    } catch (error) {
      console.error('❌ Socket initialization error:', error);
    }
  };

  /**
   * Reconnect Socket
   */
  const reconnect = async () => {
    console.log('🔄 Reconnecting socket...');
    await initializeSocket();
  };

  /**
   * Disconnect Socket
   */
  const disconnect = () => {
    socketService.disconnect();
    setIsConnected(false);
    setSocketId(null);
  };

  const value = {
    isConnected,
    socketId,
    socketService,
    reconnect,
    disconnect
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;