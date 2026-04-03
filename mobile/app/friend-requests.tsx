// app/friend-requests.tsx
// ✅ Friend Requests Route

import { useRouter } from "expo-router";
import FriendRequestsScreen from "@/src/screens/FriendRequestsScreen";

export default function FriendRequestsRoute() {
  const router = useRouter();

  // Bridge Expo Router → React Navigation compatible navigation object
  const navigation = {
    goBack: () => router.back(),
    navigate: (name: string, params?: any) => router.push(name as any),
  };

  return <FriendRequestsScreen navigation={navigation} />;
}
