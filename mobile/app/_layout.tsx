// app/_layout.tsx
// ✅ Root Layout — Expo Router + AuthProvider + NativeWind + Fonts

import "@/global.css";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { NotoSansThai_400Regular, NotoSansThai_500Medium, NotoSansThai_700Bold } from "@expo-google-fonts/noto-sans-thai";
import { NotoSansJP_400Regular, NotoSansJP_500Medium, NotoSansJP_700Bold } from "@expo-google-fonts/noto-sans-jp";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/src/contexts/AuthContext";
import { NotificationProvider } from "@/lib/notification-context";
import { SettingsProvider } from "@/src/contexts/SettingsContext";
import { ThemeProvider } from "@/src/contexts/ThemeContext";
import { TranslationProvider } from "@/src/contexts/TranslationContext";

// Keep splash visible while loading
SplashScreen.preventAutoHideAsync();

// ==============================
// Loading Screen
// ==============================
function LoadingScreen() {
  return (
    <View style={loadStyles.container}>
      <LinearGradient
        colors={['#0f0a1a', '#1a1525']}
        style={StyleSheet.absoluteFillObject}
      />
      <ActivityIndicator size="large" color="#FF6B6B" />
      <Text style={loadStyles.text}>Loading...</Text>
    </View>
  );
}

const loadStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0a1a',
  },
  text: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },
});

// ==============================
// Auth Guard — handles redirect
// ==============================
function AuthGuard() {
  const { user, loading } = useAuth() as any;
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    setIsReady(true);

    const inAuthGroup = segments[0] === "auth";

    if (!user && !inAuthGroup) {
      router.replace("/auth/login");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)/friends");
    }
  }, [user, loading, segments]);

  if (loading || !isReady) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="chat/[friendId]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="channel/[channelId]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="profile" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="edit-profile" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="friend-requests" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}

// ==============================
// Root Layout
// ==============================
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    NotoSansThai_400Regular,
    NotoSansThai_500Medium,
    NotoSansThai_700Bold,
    NotoSansJP_400Regular,
    NotoSansJP_500Medium,
    NotoSansJP_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <SettingsProvider>
            <ThemeProvider>
              <TranslationProvider>
                <NotificationProvider>
                  <AuthGuard />
                  <StatusBar style="light" />
                </NotificationProvider>
              </TranslationProvider>
            </ThemeProvider>
          </SettingsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
