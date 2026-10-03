import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { formatTodayLabel, getTodayKey } from "@/domain/day";
import { systemClock } from "@/ports/clock";

export default function TodayScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{formatTodayLabel(getTodayKey(systemClock))}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
