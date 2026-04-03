// app/auth/register.tsx
// ✅ Register Route — wraps existing RegisterScreen with navigation bridge

import { useRouter } from "expo-router";
import RegisterScreen from "@/src/screens/RegisterScreen";

export default function RegisterRoute() {
  const router = useRouter();

  const navigation: any = {
    navigate: (name: string) => {
      if (name === 'LoginScreen') {
        router.push('/auth/login');
      }
    },
    goBack: () => router.back(),
  };

  return <RegisterScreen navigation={navigation} />;
}
