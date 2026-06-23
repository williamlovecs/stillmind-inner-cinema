import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { METHOD_CATALOG, type PracticeFamily } from "@stillmind/domain";
import { BrandHeader, Chip, Screen, SectionHeading, type } from "@/components/stillmind/ui";
import { MethodCard } from "@/components/stillmind/MethodCard";
import { useApp } from "@/state/AppProvider";

const FILTERS: { id: "all" | PracticeFamily; label: string }[] = [
  { id: "all", label: "全部" }, { id: "distance", label: "拉开距离" }, { id: "settle", label: "先安定" }, { id: "observe", label: "练习观察" }, { id: "release", label: "松开重播" }, { id: "return", label: "回到行动" }, { id: "reflect", label: "复盘习惯" },
];

export default function PracticesScreen() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const { preferences, toggleFavorite } = useApp();
  const methods = useMemo(() => METHOD_CATALOG.filter((method) => filter === "all" || method.family === filter), [filter]);

  return (
    <Screen>
      <BrandHeader eyebrow="方法库" title="不是更多内容，是更合适的方法。" />
      <Text style={type.body}>每一种方法都能单独使用。推荐只是入口，你永远可以自己选择。</Text>
      <View style={styles.filters}>{FILTERS.map((item) => <Chip key={item.id} label={item.label} selected={filter === item.id} onPress={() => setFilter(item.id)} />)}</View>
      <View style={styles.list}>
        <SectionHeading title={`${methods.length} 种方法`} caption="核心版本均可离线" />
        {methods.map((method) => <MethodCard key={method.id} method={method} favorite={preferences.favoriteMethodIds.includes(method.id)} onFavorite={() => toggleFavorite(method.id)} onPress={() => router.push({ pathname: "/method/[id]", params: { id: method.id } })} />)}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ filters: { flexDirection: "row", flexWrap: "wrap", gap: 9 }, list: { gap: 12 } });
