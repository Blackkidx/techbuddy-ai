// app/channel/[channelId].tsx
// ✅ Dynamic Channel Chat Route — wraps ChannelChatScreen

import { useLocalSearchParams } from "expo-router";
import ChannelChatScreen from "@/src/screens/ChannelChatScreen";

export default function ChannelRoute() {
  const params = useLocalSearchParams();

  const routeCompat = {
    params: {
      channelId: params.channelId as string,
      channelName: params.channelName as string,
      channelDescription: (params.channelDescription as string) || '',
    },
  };

  return <ChannelChatScreen route={routeCompat} />;
}
