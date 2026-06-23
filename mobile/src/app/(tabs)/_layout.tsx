import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";

const ICONS = {
  index: ["sparkles", "sparkles-outline"],
  practices: ["grid", "grid-outline"],
  reflection: ["layers", "layers-outline"],
  profile: ["person-circle", "person-circle-outline"],
} as const;

export default function TabLayout() {
  return (
    <Tabs screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.lavender,
      tabBarInactiveTintColor: colors.textFaint,
      tabBarStyle: { position: "absolute", height: 82, paddingTop: 8, paddingBottom: 18, backgroundColor: "rgba(5, 9, 20, 0.95)", borderTopColor: colors.border },
      tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      tabBarIcon: ({ focused, color, size }) => {
        const icons = ICONS[route.name as keyof typeof ICONS] ?? ICONS.index;
        return <Ionicons name={focused ? icons[0] : icons[1]} color={color} size={size} />;
      },
    })}>
      <Tabs.Screen name="index" options={{ title: "此刻" }} />
      <Tabs.Screen name="practices" options={{ title: "练习" }} />
      <Tabs.Screen name="reflection" options={{ title: "回看" }} />
      <Tabs.Screen name="profile" options={{ title: "我的" }} />
    </Tabs>
  );
}
