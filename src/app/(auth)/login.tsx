import { View, Text, TouchableOpacity, Image, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();
const redirectTo = makeRedirectUri();

console.log("🔗 Redirect URI:", redirectTo);

export default function LoginScreen() {
  const handleGoogleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) return;

    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (res.type === "success") {
      const { params } = QueryParams.getQueryParams(res.url);
      const { access_token, refresh_token } = params;
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-5xl font-bold text-primary mb-2">Splitzy</Text>
        <Text className="text-lg text-gray-400 mb-12 text-center">
          Llevá las cuentas con tu pareja, sin dramas.
        </Text>

        <TouchableOpacity
          onPress={handleGoogleLogin}
          className="bg-white flex-row items-center px-6 py-4 rounded-2xl w-full"
        >
          <Image
            source={{
              uri: "https://developers.google.com/identity/images/g-logo.png",
            }}
            className="w-6 h-6 mr-4"
          />
          <Text className="text-gray-800 text-lg font-semibold">
            Continuar con Google
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
