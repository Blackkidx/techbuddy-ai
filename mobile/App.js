// mobile/App.js

import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { SocketProvider } from './src/contexts/SocketContext';

export default function App() {
  return (
    // ✅ นำ AuthProvider มาครอบเป็นชั้นนอกสุด
    <AuthProvider>
      <SocketProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <AppNavigator />
      </SocketProvider>
    </AuthProvider>
  );
}