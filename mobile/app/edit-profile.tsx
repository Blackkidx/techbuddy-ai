// app/edit-profile.tsx
// ✅ Edit Profile Route

import { useRouter } from "expo-router";
import EditProfileScreen from "@/src/screens/EditProfileScreen";

export default function EditProfileRoute() {
  const router = useRouter();

  // Bridge Expo Router → React Navigation compatible navigation object
  const navigation = {
    goBack: () => router.back(),
    navigate: (name: string, params?: any) => router.push(name as any),
  };

  return <EditProfileScreen navigation={navigation} />;
}
