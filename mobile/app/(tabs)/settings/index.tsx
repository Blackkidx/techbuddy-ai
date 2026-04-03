// app/(tabs)/settings/index.tsx
// ✅ Settings Tab — Main Settings Hub

import { useRouter } from "expo-router";
import SettingsScreen from "@/src/screens/SettingsScreen";

export default function SettingsTab() {
  const router = useRouter();

  const navigation: any = {
    navigate: (name: string, params?: any) => {
      if (name === 'Profile') {
        router.push('/profile');
      } else if (name === 'EditProfile') {
        router.push('/edit-profile');
      } else {
        router.push(name as any);
      }
    },
    goBack: () => router.back(),
  };

  return <SettingsScreen navigation={navigation} />;
}
