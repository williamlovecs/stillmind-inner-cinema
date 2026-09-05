import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { colors } from "@/constants/theme";
import { AppProvider, useApp } from "@/state/AppProvider";
import { OnboardingGate } from "@/components/stillmind/OnboardingGate";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <AppProvider><ReadyRoutes /></AppProvider>
    </GestureHandlerRootView>
  );
}

function ReadyRoutes() {
  const { ready } = useApp();
  // Static export has neither query parameters nor browser preferences. Keep the initial
  // server/client shell identical, and never start a session before preferences have loaded.
  if (!ready) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}><Text style={{ color: colors.textMuted }}>正在准备 StillMind…</Text></View>;
  return <>
    <StatusBar style="light" />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: "fade_from_bottom" }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="reset" options={{ presentation: "fullScreenModal", gestureEnabled: false }} />
      <Stack.Screen name="method/[id]" />
    </Stack>
    <OnboardingGate />
  </>;
}
