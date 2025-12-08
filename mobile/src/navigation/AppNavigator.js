// mobile/src/navigation/AppNavigator.js
// ✅ MODERNIZED VERSION with Beautiful Bottom Tab Navigator

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// ✅ Import useAuth
import { useAuth } from '../contexts/AuthContext';

// ✅ Import Theme
import { COLORS, SPACING, RADIUS, TEXT_STYLES, SHADOWS } from '../theme';

// ========== Import Screen Components ==========
// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Chat Screens
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import FriendListScreen from '../screens/FriendListScreen';
import FriendRequestsScreen from '../screens/FriendRequestsScreen';

// Thai Tutor Screens
import DailyWordScreen from '../screens/DailyWordScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import WordListScreen from '../screens/WordListScreen';
import MyDictionaryScreen from '../screens/MyDictionaryScreen';
import WordDetailScreen from '../screens/WordDetailScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ==========================================
// 1. Thai Tutor Stack Navigator
// ==========================================
function ThaiTutorStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          ...TEXT_STYLES.h4,
          color: '#fff',
        },
      }}
    >
      <Stack.Screen
        name="DailyWord"
        component={DailyWordScreen}
        options={{ title: 'Daily Word' }}
      />
      <Stack.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ title: 'Categories' }}
      />
      <Stack.Screen
        name="WordList"
        component={WordListScreen}
        options={({ route }) => ({ title: route.params?.title || 'Word List' })}
      />
      <Stack.Screen
        name="WordDetail"
        component={WordDetailScreen}
        options={{ title: 'Word Detail' }}
      />
      <Stack.Screen
        name="MyDictionary"
        component={MyDictionaryScreen}
        options={{ title: 'My Dictionary' }}
      />
    </Stack.Navigator>
  );
}

// ==========================================
// Custom Tab Bar Icon Component
// ==========================================
const TabBarIcon = ({ focused, iconName, color }) => {
  if (focused) {
    return (
      <View style={styles.activeIconContainer}>
        <LinearGradient
          colors={COLORS.primaryGradient}
          style={styles.activeIconGradient}
        >
          <Ionicons name={iconName} size={22} color="#fff" />
        </LinearGradient>
      </View>
    );
  }
  return <Ionicons name={iconName} size={24} color={color} />;
};

// ==========================================
// 2. Main Bottom Tab Navigator
// ==========================================
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName;

          if (route.name === 'Chat') {
            iconName = 'chatbubbles';
          } else if (route.name === 'ThaiTutor') {
            iconName = 'language';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <TabBarIcon focused={focused} iconName={iconName} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text.tertiary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Chat"
        component={FriendListScreen}
        options={{
          title: 'Friends',
          tabBarLabel: 'Friends',
        }}
      />
      <Tab.Screen
        name="ThaiTutor"
        component={ThaiTutorStack}
        options={{
          title: 'Learn Thai',
          tabBarLabel: 'Learn',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

// ==========================================
// 3. Auth Stack
// ==========================================
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          ...TEXT_STYLES.h4,
          color: '#fff',
        },
      }}
    >
      <Stack.Screen
        name="LoginScreen"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RegisterScreen"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// ==========================================
// 4. Main App Stack (Authenticated)
// ==========================================
function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          ...TEXT_STYLES.h4,
          color: '#fff',
        },
        cardStyle: {
          backgroundColor: COLORS.background,
        },
      }}
    >
      {/* ✅ Main App with Bottom Tabs */}
      <Stack.Screen
        name="MainApp"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />

      {/* ✅ Additional Screens */}
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{
          title: 'TechBuddy Chat',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FriendManagement"
        component={FriendListScreen}
        options={{
          title: 'Manage Friends',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="FriendList"
        component={FriendListScreen}
        options={{
          title: 'Friends',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="FriendRequests"
        component={FriendRequestsScreen}
        options={{
          title: 'Friend Requests',
          headerStyle: {
            backgroundColor: COLORS.surface,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: COLORS.text.primary,
        }}
      />
    </Stack.Navigator>
  );
}

// ==========================================
// 5. Root Navigator
// ==========================================
function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <LinearGradient
        colors={[COLORS.background, COLORS.backgroundLight]}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </LinearGradient>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

// ==========================================
// Styles
// ==========================================
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tab Bar Styles
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.base,
    height: Platform.OS === 'ios' ? 88 : 70,
    ...SHADOWS.lg,
  },
  tabBarLabel: {
    ...TEXT_STYLES.tabLabel,
    marginTop: SPACING.xs,
  },
  tabBarItem: {
    paddingTop: SPACING.xs,
  },

  // Active Icon
  activeIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.primary,
  },
});

export default AppNavigator;