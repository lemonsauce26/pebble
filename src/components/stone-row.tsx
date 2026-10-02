import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { StoneKind } from "@/domain/stone";
import { useThemeColor } from "@/hooks/use-theme-color";

export function StoneRow({
  title,
  kind,
  weeklyNTarget,
}: {
  title: string;
  kind: StoneKind;
  weeklyNTarget: number | null;
}) {
  const iconColor = useThemeColor({}, "text");

  return (
    <ThemedView style={styles.row}>
      <IconSymbol
        name={kind === "weekly" ? "checkmark" : "repeat"}
        size={16}
        color={iconColor}
        style={styles.icon}
      />
      <ThemedText style={styles.title}>{title}</ThemedText>
      {kind === "weekly_n" && weeklyNTarget !== null ? (
        // 완료 개수는 완료 체크 기능이 생긴 뒤에야 존재한다. 그때까지는 0으로 보인다.
        <ThemedText style={styles.counter}>0/{weeklyNTarget}</ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  icon: {
    opacity: 0.6,
  },
  title: {
    flex: 1,
  },
  counter: {
    opacity: 0.6,
    fontSize: 13,
  },
});
