// app/(tabs)/_layout.tsx
// ✅ Minimal Teal Tab Bar — Expo Router Tabs + i18n + Dynamic Dark Mode

import { Tabs } from "expo-router";
import { Platform, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useThemeColors } from "@/src/contexts/ThemeContext";
import { useTranslation } from "@/src/contexts/TranslationContext";

function AnimatedTabIcon({ focused, iconName, COLORS }: { focused: boolean; iconName: string; COLORS: any }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(focused ? 1 : 0.9, { damping: 15, stiffness: 200 }) },
    ],
  }));

  return (
    <Animated.View style={[{ alignItems: 'center', justifyContent: 'center', width: 36, height: 36 }, animatedStyle]}>
      {focused ? (
        <View style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: COLORS.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Ionicons name={iconName as any} size={18} color="#fff" />
        </View>
      ) : (
        <Ionicons name={`${iconName}-outline` as any} size={20} color={COLORS.textTertiary} />
      )}
    </Animated.View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const COLORS = useThemeColors();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 20 : 12,
          left: 16,
          right: 16,
          backgroundColor: COLORS.surface, // Used surface instead of static tabBg
          borderRadius: 24,
          borderTopWidth: 0,
          height: 62,
          paddingBottom: 0,
          borderWidth: 1,
          borderColor: COLORS.borderLight, // Used borderLight instead of static tabBorder
          shadowColor: '#2C3E50',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 4,
        },
        tabBarItemStyle: {
          paddingTop: 6,
          paddingBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="friends/index"
        options={{
          title: t('tabs.friends'),
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon focused={focused} iconName="people" COLORS={COLORS} />
          ),
        }}
      />
      <Tabs.Screen
        name="servers/index"
        options={{
          title: t('tabs.servers'),
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon focused={focused} iconName="server" COLORS={COLORS} />
          ),
        }}
      />
      <Tabs.Screen
        name="learn/index"
        options={{
          title: t('tabs.learn'),
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon focused={focused} iconName="language" COLORS={COLORS} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon focused={focused} iconName="settings" COLORS={COLORS} />
          ),
        }}
      />
    </Tabs>
  );
}
