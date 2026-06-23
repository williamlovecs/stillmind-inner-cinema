import { Alert, Linking, Platform, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";
import { BrandHeader, Chip, Screen, SectionHeading, Surface, type } from "@/components/stillmind/ui";
import { useApp, type Preferences } from "@/state/AppProvider";
import { reminderHourBucket, track } from "@/lib/analytics";

export default function ProfileScreen() {
  const { preferences, sessions, updatePreferences, deleteAllData } = useApp();
  const toggle = (key: keyof Preferences) => updatePreferences({ [key]: !preferences[key] } as Partial<Preferences>);

  const exportData = async () => {
    const file = new File(Paths.cache, `stillmind-export-${new Date().toISOString().slice(0, 10)}.json`);
    if (file.exists) file.delete();
    file.create();
    file.write(JSON.stringify({ exportedAt: new Date().toISOString(), preferences, sessions }, null, 2));
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: "application/json" });
    else Alert.alert("导出已生成", file.uri);
    track("data_exported", { format: "json" });
  };

  const scheduleReminder = async (hour: number) => {
    const Notifications = await import("expo-notifications");
    const permission = await Notifications.requestPermissionsAsync();
    if (permission.status !== "granted") return false;
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("stillmind-anchors", { name: "觉察锚点", importance: Notifications.AndroidImportance.DEFAULT });
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({ content: { title: "StillMind", body: "看一眼：此刻有哪部内在电影正在播放？" }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0, channelId: Platform.OS === "android" ? "stillmind-anchors" : undefined } });
    return true;
  };

  const toggleReminder = async (enabled: boolean) => {
    if (Platform.OS === "web") {
      return Alert.alert("请在 iPhone 中设置", "本地觉察提醒会在原生 App 中启用。 ");
    }
    if (enabled) {
      if (!await scheduleReminder(preferences.reminderHour)) return Alert.alert("没有通知权限", "你可以稍后在系统设置中开启。 ");
    } else {
      const Notifications = await import("expo-notifications");
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    await updatePreferences({ reminderEnabled: enabled });
    track("reminder_changed", { enabled, hour_bucket: reminderHourBucket(preferences.reminderHour) });
  };

  const changeReminderHour = async (hour: number) => {
    if (preferences.reminderEnabled && !await scheduleReminder(hour)) return;
    await updatePreferences({ reminderHour: hour });
    track("reminder_changed", { enabled: preferences.reminderEnabled, hour_bucket: reminderHourBucket(hour) });
  };

  const confirmDelete = () => Alert.alert("清除本机数据？", "练习记录、偏好和引导状态都会被删除。此操作无法撤销。", [{ text: "取消", style: "cancel" }, { text: "清除", style: "destructive", onPress: deleteAllData }]);

  return (
    <Screen>
      <BrandHeader eyebrow="设置与隐私" title="你决定什么被保存，什么被发送。" />
      <View style={styles.section}><SectionHeading title="练习偏好" />
        <SettingRow title="优先睁眼练习" subtitle="推荐时避开必须闭眼的方法" value={preferences.eyesOpenPreferred} onValueChange={() => toggle("eyesOpenPreferred")} />
        <SettingRow title="允许身体关注" subtitle="关闭后不推荐身体扫描" value={preferences.bodyFocusAllowed} onValueChange={() => toggle("bodyFocusAllowed")} />
        <SettingRow title="允许调整呼吸" subtitle="关闭后呼吸法只提供视觉跟随" value={preferences.breathChangeAllowed} onValueChange={() => toggle("breathChangeAllowed")} />
        <SettingRow title="触感节奏" subtitle="呼吸和步骤切换时轻触提示" value={preferences.hapticsEnabled} onValueChange={() => toggle("hapticsEnabled")} />
      </View>
      <View style={styles.section}><SectionHeading title="数据" caption="默认本地优先" />
        <SettingRow title="保存本机历史" subtitle="关闭后新练习不会进入回看" value={preferences.historyEnabled} onValueChange={() => toggle("historyEnabled")} />
        <SettingRow title="可选 AI 生成" subtitle="开启后仅在你主动生成时发送输入" value={preferences.aiEnabled} onValueChange={() => toggle("aiEnabled")} />
        <ActionRow icon="share-outline" title="导出本机数据" onPress={exportData} />
        <ActionRow icon="trash-outline" title="清除所有本机数据" danger onPress={confirmDelete} />
      </View>
      <View style={styles.section}><SectionHeading title="提醒" />
        <SettingRow title="每日觉察锚点" subtitle={`当前时间 ${String(preferences.reminderHour).padStart(2, "0")}:00，中性文案，可随时关闭`} value={preferences.reminderEnabled} onValueChange={toggleReminder} />
        {preferences.reminderEnabled ? <View style={styles.reminderTimes}>{[8, 12, 18, 21].map((hour) => <Chip key={hour} label={`${String(hour).padStart(2, "0")}:00`} selected={preferences.reminderHour === hour} onPress={() => changeReminderHour(hour)} />)}</View> : null}
      </View>
      <View style={styles.section}><SectionHeading title="关于" />
        <ActionRow icon="help-circle-outline" title="支持与反馈" onPress={() => Linking.openURL("https://stillmind-inner-cinema.vercel.app/support")} />
        <ActionRow icon="shield-checkmark-outline" title="隐私政策" onPress={() => Linking.openURL("https://stillmind-inner-cinema.vercel.app/privacy")} />
        <ActionRow icon="document-text-outline" title="服务条款" onPress={() => Linking.openURL("https://stillmind-inner-cinema.vercel.app/terms")} />
        <Surface style={styles.boundary}><Text style={type.bodyStrong}>产品边界</Text><Text style={type.body}>StillMind 是一般觉察与状态切换工具，不提供诊断、治疗或紧急支持。如有即时危险，请联系当地紧急服务或可信任的人。</Text></Surface>
      </View>
    </Screen>
  );
}

function SettingRow({ title, subtitle, value, onValueChange }: { title: string; subtitle: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return <Surface style={styles.row}><View style={styles.flex}><Text style={type.bodyStrong}>{title}</Text><Text style={type.caption}>{subtitle}</Text></View><Switch value={value} onValueChange={onValueChange} trackColor={{ false: "#293146", true: colors.violet }} thumbColor={colors.white} /></Surface>;
}
function ActionRow({ icon, title, danger, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; danger?: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress}><Surface style={styles.row}><Ionicons name={icon} size={21} color={danger ? colors.danger : colors.lavender} /><Text style={[type.bodyStrong, styles.flex, danger && { color: colors.danger }]}>{title}</Text><Ionicons name="chevron-forward" size={19} color={colors.textFaint} /></Surface></Pressable>;
}
const styles = StyleSheet.create({ section: { gap: 10 }, row: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 12 }, flex: { flex: 1 }, boundary: { gap: 8 }, reminderTimes: { flexDirection: "row", flexWrap: "wrap", gap: 8 } });
