import { useState } from "react";
import { Alert, Linking, Platform, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";
import { BrandHeader, Chip, Screen, SectionHeading, SecondaryButton, Surface, type } from "@/components/stillmind/ui";
import { useApp, type Preferences } from "@/state/AppProvider";
import { reminderHourBucket, track } from "@/lib/analytics";

const WEB_BASE_URL = (process.env.EXPO_PUBLIC_STILLMIND_WEB_BASE_URL || "https://stillmind-inner-cinema.vercel.app").replace(/\/$/, "");

export default function ProfileScreen() {
  const { preferences, sessions, updatePreferences, runReminderTask, deleteAllData } = useApp();
  // Alert.alert is a silent no-op on react-native-web; any feedback a web user must see renders inline.
  const [notice, setNotice] = useState<{ title: string; body: string }>();
  const toggle = (key: keyof Preferences) => {
    updatePreferences({ [key]: !preferences[key] } as Partial<Preferences>).catch(() => {
      setNotice({ title: "设置暂未保存", body: "你仍可以继续使用；本次会话内设置已生效，但未能写入本机存储。" });
    });
  };

  const exportData = async () => {
    let temporaryFile: File | undefined;
    try {
      const payload = JSON.stringify({ exportedAt: new Date().toISOString(), preferences, sessions }, null, 2);
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `stillmind-export-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        // Give the browser a turn to begin the download before releasing the blob.
        setTimeout(() => URL.revokeObjectURL(url), 0);
      } else {
        const file = new File(Paths.cache, `stillmind-export-${new Date().toISOString().slice(0, 10)}.json`);
        temporaryFile = file;
        if (file.exists) file.delete();
        file.create();
        file.write(payload);
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: "application/json" });
        else {
          setNotice({ title: "当前无法分享导出", body: "这台设备暂不支持分享文件，本机记录没有改动。" });
          return;
        }
      }
      track("data_exported", { format: "json" });
    } catch {
      setNotice({ title: "导出未完成", body: "本机数据没有改动。你可以稍后再试，或直接结束使用。" });
    } finally {
      try { if (temporaryFile?.exists) temporaryFile.delete(); }
      catch { setNotice({ title: "导出临时文件未清理", body: "设备缓存中可能仍留有导出文件，请在设备文件管理中确认。" }); }
    }
  };

  const openPage = (url: string) => {
    void Linking.openURL(url).catch(() => {
      setNotice({ title: "页面暂未打开", body: "请检查网络连接后再试。" });
    });
  };

  const scheduleReminder = async (hour: number) => {
    const Notifications = await import("expo-notifications");
    const permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) return false;
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("stillmind-anchors", { name: "觉察锚点", importance: Notifications.AndroidImportance.DEFAULT });
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({ content: { title: "StillMind", body: "看一眼：此刻有哪部内在电影正在播放？" }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0, channelId: Platform.OS === "android" ? "stillmind-anchors" : undefined } });
    return true;
  };

  const toggleReminder = async (enabled: boolean) => {
    if (Platform.OS === "web") {
      setNotice({ title: "请在 iPhone 中设置", body: "本地觉察提醒会在原生 App 中启用。网页版不发送提醒通知。" });
      return;
    }
    try {
      await runReminderTask(async (current) => {
        if (enabled) {
          if (!await scheduleReminder(current.reminderHour)) {
            setNotice({ title: "没有通知权限", body: "你可以稍后在系统设置中开启通知，再回来设置提醒。" });
            return;
          }
        } else {
          const Notifications = await import("expo-notifications");
          await Notifications.cancelAllScheduledNotificationsAsync();
        }
        await updatePreferences({ reminderEnabled: enabled });
        track("reminder_changed", { enabled, hour_bucket: reminderHourBucket(current.reminderHour) });
      });
    } catch {
      setNotice({ title: "提醒未完整更新", body: "请在系统通知设置中确认当前状态，再稍后重试。" });
    }
  };

  const changeReminderHour = async (hour: number) => {
    try {
      await runReminderTask(async (current) => {
        if (current.reminderEnabled && !await scheduleReminder(hour)) {
          setNotice({ title: "没有通知权限", body: "提醒时间没有改动。你可以稍后在系统设置中开启通知。" });
          return;
        }
        await updatePreferences({ reminderHour: hour });
        track("reminder_changed", { enabled: current.reminderEnabled, hour_bucket: reminderHourBucket(hour) });
      });
    } catch {
      setNotice({ title: "时间未完整更新", body: "请在系统通知设置中确认当前提醒，再稍后重试。" });
    }
  };

  const confirmDelete = () => {
    if (Platform.OS === "web") {
      // react-native-web Alert is a no-op; deletion must actually be reachable in web builds.
      if (window.confirm("清除本机数据？练习记录、偏好和引导状态都会被删除。此操作无法撤销。")) {
        deleteAllData().catch(() => setNotice({ title: "清除未完成", body: "本机数据可能仍保留了一部分。你可以稍后再试。" }));
      }
      return;
    }
    Alert.alert("清除本机数据？", "练习记录、偏好和引导状态都会被删除。此操作无法撤销。", [{ text: "取消", style: "cancel" }, { text: "清除", style: "destructive", onPress: () => { deleteAllData().catch(() => setNotice({ title: "清除未完成", body: "本机数据可能仍保留了一部分。你可以稍后再试。" })); } }]);
  };

  return (
    <Screen>
      <BrandHeader eyebrow="设置与隐私" title="你决定什么被保存，什么被发送。" />
      {notice ? <Surface style={styles.notice}>
        <View accessibilityRole="alert" style={styles.flex}><Text style={type.bodyStrong}>{notice.title}</Text><Text style={type.caption}>{notice.body}</Text></View>
        <SecondaryButton label="知道了" onPress={() => setNotice(undefined)} />
      </Surface> : null}
      <View style={styles.section}><SectionHeading title="练习偏好" />
        <SettingRow title="优先睁眼练习" subtitle="推荐时优先选择可睁眼完成的方法" value={preferences.eyesOpenPreferred} onValueChange={() => toggle("eyesOpenPreferred")} />
        <SettingRow title="允许身体关注" subtitle="关闭后不推荐身体扫描" value={preferences.bodyFocusAllowed} onValueChange={() => toggle("bodyFocusAllowed")} />
        <SettingRow title="允许调整呼吸" subtitle="关闭后不推荐需要主动调整呼吸的方法" value={preferences.breathChangeAllowed} onValueChange={() => toggle("breathChangeAllowed")} />
        <SettingRow title="触感节奏" subtitle="支持的设备在步骤切换时轻触提示" value={preferences.hapticsEnabled} onValueChange={() => toggle("hapticsEnabled")} />
      </View>
      <View style={styles.section}><SectionHeading title="数据" caption="默认本地优先" />
        <SettingRow title="保存本机历史" subtitle="关闭后新练习不会进入回看" value={preferences.historyEnabled} onValueChange={() => toggle("historyEnabled")} />
        <SettingRow title="可选 AI 生成" subtitle="开启后仅在你主动生成时发送输入" value={preferences.aiEnabled} onValueChange={() => toggle("aiEnabled")} />
        <SettingRow title="匿名帮助改进" subtitle="默认关闭；只发送方法、前后变化和复用意愿，不发送你说的话或笔记" value={preferences.anonymousAnalyticsEnabled} onValueChange={() => toggle("anonymousAnalyticsEnabled")} />
        <ActionRow icon="share-outline" title="导出本机数据" onPress={exportData} />
        <ActionRow icon="trash-outline" title="清除所有本机数据" danger onPress={confirmDelete} />
      </View>
      <View style={styles.section}><SectionHeading title="提醒" />
        <SettingRow title="每日觉察锚点" subtitle={`当前时间 ${String(preferences.reminderHour).padStart(2, "0")}:00，中性文案，可随时关闭`} value={preferences.reminderEnabled} onValueChange={toggleReminder} />
        {preferences.reminderEnabled ? <View style={styles.reminderTimes}>{[8, 12, 18, 21].map((hour) => <Chip key={hour} label={`${String(hour).padStart(2, "0")}:00`} selected={preferences.reminderHour === hour} onPress={() => changeReminderHour(hour)} />)}</View> : null}
      </View>
      <View style={styles.section}><SectionHeading title="关于" />
        <ActionRow icon="clipboard-outline" title="种子测试说明" onPress={() => openPage(`${WEB_BASE_URL}/support/seed-test`)} />
        <ActionRow icon="help-circle-outline" title="支持与反馈" onPress={() => openPage(`${WEB_BASE_URL}/support`)} />
        <ActionRow icon="shield-checkmark-outline" title="隐私政策" onPress={() => openPage(`${WEB_BASE_URL}/privacy`)} />
        <ActionRow icon="document-text-outline" title="服务条款" onPress={() => openPage(`${WEB_BASE_URL}/terms`)} />
        <Surface style={styles.boundary}><Text style={type.bodyStrong}>产品边界</Text><Text style={type.body}>StillMind 是一般觉察与状态切换工具，不提供诊断、治疗或紧急支持。如有即时危险，请联系当地紧急服务或可信任的人。</Text></Surface>
      </View>
    </Screen>
  );
}

function SettingRow({ title, subtitle, value, onValueChange }: { title: string; subtitle: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return <Surface style={styles.row}><View style={styles.flex}><Text style={type.bodyStrong}>{title}</Text><Text style={type.caption}>{subtitle}</Text></View><Switch value={value} onValueChange={onValueChange} accessibilityLabel={title} trackColor={{ false: colors.borderStrong, true: colors.accent }} thumbColor={colors.white} /></Surface>;
}
function ActionRow({ icon, title, danger, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; danger?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress}><Surface style={styles.row}><Ionicons name={icon} size={21} color={danger ? colors.danger : colors.lavender} /><Text style={[type.bodyStrong, styles.flex, danger && { color: colors.danger }]}>{title}</Text><Ionicons name="chevron-forward" size={19} color={colors.textFaint} /></Surface></Pressable>;
}
const styles = StyleSheet.create({ section: { gap: 10 }, row: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 12 }, flex: { flex: 1 }, boundary: { gap: 8 }, reminderTimes: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, notice: { flexDirection: "row", alignItems: "center", gap: 12, padding: 13 } });
