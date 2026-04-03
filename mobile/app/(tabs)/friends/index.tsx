// app/(tabs)/friends/index.tsx
// ✅ Friends Tab — wraps existing FriendListScreen with navigation bridge

import { useRouter } from "expo-router";
import FriendListScreen from "@/src/screens/FriendListScreen";

export default function FriendsTab() {
  const router = useRouter();

  // Bridge Expo Router → React Navigation compatible navigation object
  const navigation: any = {
    navigate: (name: string, params?: any) => {
      if (name === 'ChatScreen' && params?.friend) {
        router.push({
          pathname: '/chat/[friendId]',
          params: {
            friendId: params.friend.userId || params.friend.id,
            friend: JSON.stringify(params.friend),
          },
        });
      } else if (name === 'FriendRequests') {
        router.push('/friend-requests');
      } else {
        router.push(name as any);
      }
    },
    goBack: () => router.back(),
    getParent: () => ({
      navigate: (name: string, params?: any) => {
        if (name === 'ChatScreen' && params?.friend) {
          router.push({
            pathname: '/chat/[friendId]',
            params: {
              friendId: params.friend.userId || params.friend.id,
              friend: JSON.stringify(params.friend),
            },
          });
        }
      },
    }),
  };

  return <FriendListScreen navigation={navigation} />;
}
