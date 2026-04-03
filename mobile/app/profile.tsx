// app/profile.tsx
// ✅ Profile Route — Accessible from Settings
import { useRouter } from "expo-router";
import ProfileScreen from "@/src/screens/ProfileScreen";

export default function ProfileRoute() {
  const router = useRouter();
  const navigation: any = {
    navigate: (name: string, params?: any) => {
      if (name === 'EditProfile') {
        router.push('/edit-profile');
      } else {
        router.push(name as any);
      }
    },
    goBack: () => router.back(),
  };

  return <ProfileScreen navigation={navigation} />;
}
