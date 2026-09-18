import { useEffect, useState } from "react";
import { FlatList, StyleSheet } from "react-native";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";

import { EmptyState } from "@/components/empty-state";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { db } from "@/data/db";
import migrations from "@/data/migrations/migrations";
import { selectPlans } from "@/data/plan.repository";
import { formatPeriodLabel, getCurrentMonthPeriod } from "@/domain/period";
import { systemClock } from "@/ports/clock";
import { supabase } from "@/ports/supabase";

export default function HomeScreen() {
  const { success: migrationsReady, error: migrationError } = useMigrations(db, migrations);
  const [userId, setUserId] = useState<string | null>(null);

  const period = getCurrentMonthPeriod(systemClock);
  const monthLabel = formatPeriodLabel("month", period);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: plans } = useLiveQuery(
    userId ? selectPlans(db, userId, "month", period) : selectPlans(db, "", "month", period),
  );

  if (migrationError) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>DB 준비 중 문제가 생겼어요: {migrationError.message}</ThemedText>
      </ThemedView>
    );
  }

  if (!migrationsReady || !userId) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>준비 중...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{monthLabel}</ThemedText>

      {plans && plans.length > 0 ? (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ThemedView style={styles.planRow}>
              <ThemedText>{item.title}</ThemedText>
            </ThemedView>
          )}
        />
      ) : (
        <EmptyState message="아직 이번 달 계획이 없어요" />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  planRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});
