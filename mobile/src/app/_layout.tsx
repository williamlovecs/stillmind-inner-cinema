import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { colors } from "@/constants/theme";
import { AppProvider } from "@/state/AppProvider";
import { OnboardingGate } from "@/components/stillmind/OnboardingGate";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <AppProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: "fade_from_bottom" }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="reset" options={{ presentation: "fullScreenModal", gestureEnabled: false }} />
          <Stack.Screen name="method/[id]" />
        </Stack>
        <OnboardingGate />
      </AppProvider>
    </GestureHandlerRootView>
  );
}
