// app/chat/[friendId].tsx
// ✅ Dynamic Chat Route — wraps existing ChatScreen

import { useLocalSearchParams } from "expo-router";
import ChatScreen from "@/src/screens/ChatScreen";

export default function ChatRoute() {
  const params = useLocalSearchParams();

  // ChatScreen expects route.params.friend, so we pass it through
  const routeCompat = {
    params: {
      friend: params.friend ? JSON.parse(params.friend as string) : null,
    },
  };

  return <ChatScreen route={routeCompat} />;
}
