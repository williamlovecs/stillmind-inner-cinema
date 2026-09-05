import { useSyncExternalStore } from "react";
import { Text, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { colors } from "@/constants/theme";
import { AppProvider } from "@/state/AppProvider";
import { OnboardingGate } from "@/components/stillmind/OnboardingGate";

const subscribe = () => () => undefined;
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export default function RootLayout() {
  // A static Expo export cannot know the URL's per-session query or device preferences.
  // Render the same shell on server and first hydration; mount runtime routing afterward.
  // Native renderers use the client snapshot immediately. Do not suppress hydration errors.
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      {hydrated ? <AppProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: "fade_from_bottom" }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="reset" options={{ presentation: "fullScreenModal", gestureEnabled: false }} />
          <Stack.Screen name="method/[id]" />
        </Stack>
        <OnboardingGate />
      </AppProvider> : <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.text }}>正在准备 StillMind…</Text>
      </View>}
    </GestureHandlerRootView>
  );
}
