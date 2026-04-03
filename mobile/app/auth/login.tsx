// app/auth/login.tsx
// ✅ Login Route — wraps existing LoginScreen with navigation bridge

import { useRouter } from "expo-router";
import LoginScreen from "@/src/screens/LoginScreen";

export default function LoginRoute() {
  const router = useRouter();

  const navigation: any = {
    navigate: (name: string) => {
      if (name === 'RegisterScreen') {
        router.push('/auth/register');
      }
    },
    goBack: () => router.back(),
  };

  return <LoginScreen navigation={navigation} />;
}
