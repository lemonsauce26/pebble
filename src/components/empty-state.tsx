import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export function EmptyState({ message }: { message: string }) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.message}>{message}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  message: {
    opacity: 0.6,
    textAlign: "center",
  },
});
